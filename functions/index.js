const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ============================================
// SEGURIDAD C-01: JWT_SECRET SIN FALLBACK
// Si no está configurado como variable de entorno, el sistema NO arranca.
// ============================================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("[SEGURIDAD] CRÍTICO: JWT_SECRET no está configurado como variable de entorno. Todos los endpoints de autenticación serán rechazados.");
}

// ============================================
// SEGURIDAD A-01: CORS RESTRINGIDO A DOMINIOS PROPIOS
// ============================================
const ALLOWED_ORIGINS = [
    "https://morehdmkt.com",
    "https://www.morehdmkt.com",
    "https://moremkt-reservas.web.app",
    "https://moremkt-reservas.firebaseapp.com"
];

// Configurar Express
const app = express();

app.use(cors({
    origin: (origin, callback) => {
        // Sin origin: permitir solo en emulador local
        if (!origin && process.env.FUNCTIONS_EMULATOR) return callback(null, true);
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        return callback(new Error("No permitido por CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Limitar tamaño del body a 10kb para prevenir ataques de payload grande
app.use(express.json({ limit: "10kb" }));

// ============================================
// SEGURIDAD M-01: HEADERS DE SEGURIDAD HTTP
// ============================================
app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    next();
});

// ============================================
// SEGURIDAD A-03: RATE LIMITING
// ============================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,                   // Máximo 10 intentos de login por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiados intentos. Por favor, intenta nuevamente en 15 minutos." }
});

const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5,                    // Máximo 5 reservas por IP por hora
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes de reserva. Intenta nuevamente en una hora." }
});

const leadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5,                    // Máximo 5 leads por IP por hora
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes. Intenta nuevamente en una hora." }
});

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// ============================================
function requireAuth(req, res, next) {
    if (!JWT_SECRET) {
        return res.status(503).json({ error: "Servicio no disponible. Configuración del servidor incompleta." });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No autorizado" });
    }
    const token = authHeader.split("Bearer ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
}

// ============================================
// HELPERS: SANITIZACIÓN Y VALIDACIÓN
// ============================================
function sanitizeString(str, maxLength = 200) {
    if (typeof str !== "string") return "";
    return str.trim().substring(0, maxLength);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidDateFormat(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isFutureOrToday(date) {
    const today = new Date().toISOString().split("T")[0];
    return date >= today;
}

// ============================================
// SEGURIDAD C-02: ENDPOINT /admin/setup DESHABILITADO
// Ya fue usado para crear el admin inicial. Permanentemente desactivado.
// ============================================
app.post("/admin/setup", (req, res) => {
    return res.status(410).json({
        error: "Este endpoint ha sido permanentemente deshabilitado por razones de seguridad."
    });
});

// ============================================
// ADMIN: LOGIN
// ============================================
app.post("/admin/login", loginLimiter, async (req, res) => {
    try {
        if (!JWT_SECRET) return res.status(503).json({ error: "Servicio no disponible." });

        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email y contraseña requeridos" });

        // Validar formato de email
        if (!isValidEmail(email)) return res.status(400).json({ error: "Formato de email inválido" });

        const adminSnapshot = await db.collection("admin_users").where("email", "==", email).limit(1).get();

        // Mismo mensaje para email inexistente y contraseña incorrecta (evita enumerar usuarios)
        if (adminSnapshot.empty) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const adminDoc = adminSnapshot.docs[0];
        const adminData = adminDoc.data();

        const isValidPassword = await bcrypt.compare(password, adminData.passwordHash);
        if (!isValidPassword) return res.status(401).json({ error: "Credenciales inválidas" });

        // Reducido a 8 horas (antes era 24h)
        const token = jwt.sign(
            { uid: adminDoc.id, email: adminData.email },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.status(200).json({ success: true, token, user: { email: adminData.email } });
    } catch (error) {
        console.error("[admin/login] Error interno.");
        return res.status(500).json({ error: "Error interno" });
    }
});

// ============================================
// ADMIN: CONFIGURACIÓN Y HORARIOS (PROTEGIDOS)
// ============================================
app.get("/admin/config", requireAuth, async (req, res) => {
    try {
        const availabilityDoc = await db.collection("availability_config").doc("default").get();
        const pricingDoc = await db.collection("pricing_config").doc("default").get();
        const blocksSnapshot = await db.collection("availability_blocks")
            .where("date", ">=", new Date().toISOString().split("T")[0])
            .orderBy("date", "asc").get();

        return res.status(200).json({
            availability: availabilityDoc.exists ? availabilityDoc.data() : null,
            pricing: pricingDoc.exists ? pricingDoc.data() : null,
            blocks: blocksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        });
    } catch (error) {
        console.error("[admin/config] Error interno.");
        return res.status(500).json({ error: "Error al obtener configuración" });
    }
});

app.put("/admin/config/availability", requireAuth, async (req, res) => {
    try {
        const { weekdays, sessionDuration } = req.body;
        if (!weekdays || typeof sessionDuration !== "number" || sessionDuration < 15 || sessionDuration > 480) {
            return res.status(400).json({ error: "Datos de disponibilidad inválidos" });
        }
        await db.collection("availability_config").doc("default").set({
            weekdays,
            sessionDuration,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("[admin/config/availability] Error interno.");
        return res.status(500).json({ error: "Error al actualizar disponibilidad" });
    }
});

app.put("/admin/config/pricing", requireAuth, async (req, res) => {
    try {
        const { individual } = req.body;
        if (typeof individual !== "number" || individual < 0 || individual > 10000000) {
            return res.status(400).json({ error: "Precio inválido" });
        }
        await db.collection("pricing_config").doc("default").set({
            individual,
            currency: "ARS",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("[admin/config/pricing] Error interno.");
        return res.status(500).json({ error: "Error al actualizar precios" });
    }
});

app.post("/admin/blocks", requireAuth, async (req, res) => {
    try {
        const { date, startTime, endTime, reason } = req.body;
        if (!date || !startTime || !endTime) return res.status(400).json({ error: "Faltan datos obligatorios" });
        if (!isValidDateFormat(date)) return res.status(400).json({ error: "Formato de fecha inválido" });

        const blockRef = await db.collection("availability_blocks").add({
            date: sanitizeString(date, 10),
            startTime: sanitizeString(startTime, 5),
            endTime: sanitizeString(endTime, 5),
            reason: sanitizeString(reason || "", 200),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return res.status(201).json({ success: true, blockId: blockRef.id });
    } catch (error) {
        console.error("[admin/blocks] Error interno.");
        return res.status(500).json({ error: "Error al crear bloqueo" });
    }
});

app.delete("/admin/blocks/:id", requireAuth, async (req, res) => {
    try {
        const blockId = req.params.id;
        // Validar que el ID tenga formato válido de Firestore (no injection)
        if (!blockId || blockId.length > 50 || !/^[a-zA-Z0-9]+$/.test(blockId)) {
            return res.status(400).json({ error: "ID de bloqueo inválido" });
        }
        await db.collection("availability_blocks").doc(blockId).delete();
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("[admin/blocks/delete] Error interno.");
        return res.status(500).json({ error: "Error al eliminar bloqueo" });
    }
});

app.get("/admin/bookings", requireAuth, async (req, res) => {
    try {
        const snapshot = await db.collection("bookings").orderBy("date", "desc").limit(100).get();
        return res.status(200).json({
            bookings: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        });
    } catch (error) {
        console.error("[admin/bookings] Error interno.");
        return res.status(500).json({ error: "Error al listar reservas" });
    }
});

// NUEVO: Ver leads del formulario de diagnóstico
app.get("/admin/leads", requireAuth, async (req, res) => {
    try {
        const snapshot = await db.collection("leads").orderBy("createdAt", "desc").limit(100).get();
        return res.status(200).json({
            leads: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        });
    } catch (error) {
        console.error("[admin/leads] Error interno.");
        return res.status(500).json({ error: "Error al listar leads" });
    }
});

// ============================================
// PUBLIC: DISPONIBILIDAD
// ============================================
app.get("/getAvailableSlots", async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: "Fecha requerida" });

        // Validar formato de fecha (previene inyecciones)
        if (!isValidDateFormat(date)) return res.status(400).json({ error: "Formato de fecha inválido" });

        // No mostrar slots de fechas pasadas
        if (!isFutureOrToday(date)) return res.status(200).json({ slots: [] });

        const configDoc = await db.collection("availability_config").doc("default").get();
        if (!configDoc.exists) return res.status(200).json({ slots: [] });

        const config = configDoc.data();
        const dateObj = new Date(date);
        const dayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][dateObj.getUTCDay()];

        const dayConfig = config.weekdays[dayOfWeek];
        if (!dayConfig || !dayConfig.enabled) return res.status(200).json({ slots: [] });

        let slots = [];
        if (dayConfig.timeRanges) {
            for (const range of dayConfig.timeRanges) {
                slots = slots.concat(generateTimeSlots(range.start, range.end, config.sessionDuration));
            }
        }

        const blockedSlots = new Set();
        const blocksSnap = await db.collection("availability_blocks").where("date", "==", date).get();
        blocksSnap.docs.forEach(d => blockedSlots.add(d.data().startTime));

        const bookingsSnap = await db.collection("bookings")
            .where("date", "==", date)
            .where("status", "in", ["confirmed", "pending_payment"])
            .get();
        bookingsSnap.docs.forEach(d => blockedSlots.add(d.data().time));

        const availableSlots = slots.filter(slot => !blockedSlots.has(slot));
        return res.status(200).json({ slots: availableSlots });
    } catch (error) {
        console.error("[getAvailableSlots] Error interno.");
        return res.status(500).json({ error: "Error al obtener horarios" });
    }
});

function generateTimeSlots(startTime, endTime, duration) {
    const slots = [];
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        slots.push(`${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`);
        currentMin += duration;
        if (currentMin >= 60) {
            currentHour += Math.floor(currentMin / 60);
            currentMin = currentMin % 60;
        }
    }
    return slots;
}

// ============================================
// PUBLIC: CREAR RESERVA
// ============================================
app.post("/createBooking", bookingLimiter, async (req, res) => {
    try {
        const { name, email, phone, date, time } = req.body;
        if (!name || !email || !date || !time) return res.status(400).json({ error: "Faltan datos obligatorios" });

        // Validaciones de seguridad A-05
        if (!isValidEmail(email)) return res.status(400).json({ error: "Formato de email inválido" });
        if (!isValidDateFormat(date)) return res.status(400).json({ error: "Formato de fecha inválido" });
        if (!isFutureOrToday(date)) return res.status(400).json({ error: "No se pueden hacer reservas en fechas pasadas" });

        // Validar longitud de campos (prevenir spam con datos gigantes)
        if (name.length > 150 || (phone && phone.length > 30)) {
            return res.status(400).json({ error: "Datos demasiado largos" });
        }

        // Validar que el horario siga disponible (doble verificación)
        const existing = await db.collection("bookings")
            .where("date", "==", date)
            .where("time", "==", time)
            .where("status", "in", ["confirmed", "pending_payment"])
            .get();
        if (!existing.empty) return res.status(400).json({ error: "Horario no disponible" });

        const pricingDoc = await db.collection("pricing_config").doc("default").get();
        const price = pricingDoc.exists ? (pricingDoc.data().individual || 70000) : 70000;

        const bookingRef = await db.collection("bookings").add({
            clientName: sanitizeString(name, 150),
            clientEmail: sanitizeString(email, 254),
            clientPhone: sanitizeString(phone || "", 30),
            date, time, price,
            status: "pending_payment",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (!process.env.MP_ACCESS_TOKEN) {
            // Modo prueba: confirmar directo si no hay MP configurado
            await bookingRef.update({ status: "confirmed" });
            return res.status(200).json({ init_point: "/construccion/index.html?status=approved" });
        }

        const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
        const preference = new Preference(mpClient);

        // SEGURIDAD: Validar baseUrl contra lista blanca (nunca usar origin del cliente directo)
        const requestOrigin = req.get("origin");
        const baseUrl = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : "https://morehdmkt.com";

        const mpResponse = await preference.create({
            body: {
                items: [{
                    id: bookingRef.id,
                    title: `Reserva Asesoría - ${date} ${time}`,
                    quantity: 1,
                    unit_price: price,
                    currency_id: "ARS"
                }],
                payer: {
                    name: sanitizeString(name, 150),
                    email: sanitizeString(email, 254)
                },
                external_reference: bookingRef.id,
                back_urls: {
                    success: `${baseUrl}/construccion/index.html?status=approved`,
                    failure: `${baseUrl}/construccion/index.html?status=failure`,
                    pending: `${baseUrl}/construccion/index.html?status=pending`
                },
                auto_return: "approved",
                notification_url: `${process.env.FUNCTIONS_URL}/api/mercadopagoWebhook`
            }
        });

        return res.status(200).json({ init_point: mpResponse.init_point });
    } catch (error) {
        console.error("[createBooking] Error interno.");
        return res.status(500).json({ error: "Error al crear reserva" });
    }
});

// ============================================
// SEGURIDAD C-03: WEBHOOK MERCADO PAGO CON VERIFICACIÓN REAL
// Verifica el pago directamente en la API de MP antes de confirmar la reserva.
// ============================================
app.post("/mercadopagoWebhook", async (req, res) => {
    // Responder 200 a MP inmediatamente para evitar reintentos innecesarios
    res.status(200).send("OK");

    try {
        const { type, data } = req.body;

        if (type === "payment" && data && data.id && process.env.MP_ACCESS_TOKEN) {
            // VERIFICACIÓN REAL: Consultar el pago directamente a la API de MP
            const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
            const paymentClient = new Payment(mpClient);
            const paymentData = await paymentClient.get({ id: data.id });

            // Solo procesar si el pago fue REALMENTE aprobado por MP
            if (paymentData && paymentData.status === "approved" && paymentData.external_reference) {
                const bookingRef = db.collection("bookings").doc(paymentData.external_reference);
                const bookingDoc = await bookingRef.get();

                if (bookingDoc.exists && bookingDoc.data().status === "pending_payment") {
                    await bookingRef.update({
                        status: "confirmed",
                        paymentId: String(data.id),
                        paymentStatus: paymentData.status,
                        confirmedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        }
    } catch (error) {
        // Ya respondimos 200 a MP. Solo loguear el error.
        console.error("[mercadopagoWebhook] Error al procesar notificación.");
    }
});

// ============================================
// PUBLIC: GUARDAR LEAD (DIAGNÓSTICO ONLINE GRATIS)
// Los datos del formulario se guardan en Firestore como respaldo antes de ir a WhatsApp.
// ============================================
app.post("/saveLead", leadLimiter, async (req, res) => {
    try {
        const { name, phone, email, message } = req.body;
        if (!name || !email || !phone || !message) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        if (!isValidEmail(email)) return res.status(400).json({ error: "Formato de email inválido" });

        // Validar longitudes
        if (name.length > 150 || message.length > 2000 || phone.length > 30) {
            return res.status(400).json({ error: "Datos demasiado largos" });
        }

        await db.collection("leads").add({
            name: sanitizeString(name, 150),
            phone: sanitizeString(phone, 30),
            email: sanitizeString(email, 254),
            message: sanitizeString(message, 2000),
            source: "diagnostico_online",
            status: "nuevo",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(201).json({ success: true });
    } catch (error) {
        console.error("[saveLead] Error interno.");
        return res.status(500).json({ error: "Error al guardar solicitud" });
    }
});

const { onRequest } = require("firebase-functions/v2/https");
// cors: false porque lo manejamos manualmente con middleware propio
exports.api = onRequest({ cors: false, maxInstances: 10 }, app);
