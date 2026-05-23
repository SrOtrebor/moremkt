const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const nodemailer = require("nodemailer");
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ============================================
// CONFIGURACIÓN DE NODEMAILER (RESEND)
// ============================================
const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY || "dummy"
    }
});

const ADMIN_EMAIL = "hola@morehdmkt.com"; // Email de Moreliz
const FROM_EMAIL = "MoreMKT <noresponder@morehdmkt.com>"; // Dominio verificado en Resend

async function sendEmail(to, subject, html, icsString = null) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[sendEmail] Omitiendo correo a ${to}. Falta RESEND_API_KEY en .env`);
        return;
    }
    try {
        const mailOptions = { from: FROM_EMAIL, to, subject, html };
        if (icsString) {
            mailOptions.attachments = [{
                filename: 'invite.ics',
                content: icsString,
                contentType: 'text/calendar'
            }];
        }
        await transporter.sendMail(mailOptions);
        console.log(`[sendEmail] Correo enviado a ${to}`);
    } catch (error) {
        console.error("[sendEmail] Error al enviar correo:", error);
    }
}

// Generador de invitaciones de calendario (.ics)
function generateIcsString(bookingId, clientName, dateStr, timeStr) {
    // Asumimos hora de Argentina (-03:00)
    const startDate = new Date(`${dateStr}T${timeStr}:00-03:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora
    
    const formatICSDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const startIcs = formatICSDate(startDate);
    const endIcs = formatICSDate(endDate);
    const nowIcs = formatICSDate(new Date());

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MoreMKT//Reservas//ES
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${bookingId}@morehdmkt.com
DTSTAMP:${nowIcs}
DTSTART:${startIcs}
DTEND:${endIcs}
SUMMARY:Asesoría MoreMKT - ${clientName}
DESCRIPTION:Reserva de asesoría de marketing con MoreMKT.\\n\\nCliente: ${clientName}\\nNos conectaremos en el horario pautado.
STATUS:CONFIRMED
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Recordatorio de Asesoría MoreMKT
TRIGGER:-PT1H
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

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

// NUEVO: Cancelar reserva
app.put("/admin/bookings/:id/cancel", requireAuth, async (req, res) => {
    try {
        const bookingId = req.params.id;
        if (!bookingId || bookingId.length > 50 || !/^[a-zA-Z0-9]+$/.test(bookingId)) {
            return res.status(400).json({ error: "ID de reserva inválido" });
        }
        
        const bookingRef = db.collection("bookings").doc(bookingId);
        const bookingDoc = await bookingRef.get();
        
        if (!bookingDoc.exists) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }
        
        await bookingRef.update({ 
            status: "cancelled",
            cancelledAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        const bData = bookingDoc.data();
        if (bData.status !== "cancelled") {
            await sendEmail(
                bData.clientEmail,
                "Aviso de Cancelación - Asesoría MoreMKT",
                `<p>Hola ${bData.clientName},</p><p>Te informamos que tu reserva del ${bData.date} a las ${bData.time} ha sido cancelada.</p><p>Por favor contáctate con nosotros respondiendo este correo si necesitas reprogramar o conocer el motivo.</p>`
            );
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("[admin/bookings/cancel] Error interno.");
        return res.status(500).json({ error: "Error al cancelar reserva" });
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
// PUBLIC: OBTENER PRECIOS
// ============================================
app.get("/pricing", async (req, res) => {
    try {
        const pricingDoc = await db.collection("pricing_config").doc("default").get();
        if (!pricingDoc.exists) {
            return res.status(200).json({ individual: 70000, ventas_ya: 350000 });
        }
        const data = pricingDoc.data();
        return res.status(200).json({ 
            individual: data.individual || 70000, 
            ventas_ya: data.ventas_ya || 350000 
        });
    } catch (error) {
        console.error("[getPricing] Error interno.");
        return res.status(500).json({ error: "Error al obtener precios" });
    }
});

// ============================================
// PUBLIC: CREAR RESERVA
// ============================================
app.post("/createBooking", bookingLimiter, async (req, res) => {
    try {
        const { name, email, phone, date, time, service } = req.body;
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
        const configData = pricingDoc.exists ? pricingDoc.data() : {};
        
        let price = configData.individual || 70000;
        let titleService = "Reserva Asesoría";
        
        if (service === "ventas_ya") {
            price = configData.ventas_ya || 350000;
            titleService = "Pack Inicial: Ventas Ya";
        }

        const bookingRef = await db.collection("bookings").add({
            clientName: sanitizeString(name, 150),
            clientEmail: sanitizeString(email, 254),
            clientPhone: sanitizeString(phone || "", 30),
            service: sanitizeString(service || "asesoria", 50),
            date, time, price,
            status: "pending_payment",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (!process.env.MP_ACCESS_TOKEN) {
            // Modo prueba: confirmar directo si no hay MP configurado
            await bookingRef.update({ status: "confirmed" });
            
            const icsString = generateIcsString(bookingRef.id, name, date, time);
            
            // Correo al cliente
            await sendEmail(
                email, 
                "¡Reserva Confirmada! (PRUEBA)", 
                `<h2>¡Hola ${name}!</h2>
                 <p>Tu reserva de prueba está confirmada.</p>
                 <p><b>Fecha:</b> ${date}<br><b>Hora:</b> ${time}</p>
                 <p><b>Nota:</b> Te adjuntamos una invitación de calendario para que puedas agregar la cita a tu Google Calendar.</p>
                 <p>Saludos,<br>El equipo de MoreMKT</p>`,
                 icsString
            );
            
            // Correo al admin
            await sendEmail(
                ADMIN_EMAIL, 
                "🟢 Nueva Reserva (PRUEBA)", 
                `<h2>¡Nueva Asesoría de Prueba!</h2>
                 <p><b>Cliente:</b> ${name} (${email})</p>
                 <p><b>Fecha:</b> ${date}<br><b>Hora:</b> ${time}</p>`,
                 icsString
            );
            
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
                    title: `${titleService} - ${date} ${time}`,
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
                notification_url: `${process.env.FUNCTIONS_URL}/mercadopagoWebhook`
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
                    
                    const bData = bookingDoc.data();
                    const icsString = generateIcsString(bookingDoc.id, bData.clientName, bData.date, bData.time);
                    
                    // Correo al cliente
                    await sendEmail(
                        bData.clientEmail, 
                        "¡Tu Asesoría en MoreMKT está Confirmada!", 
                        `<h2>¡Hola ${bData.clientName}!</h2>
                         <p>Tu pago ha sido procesado con éxito y tu reserva está confirmada.</p>
                         <p><b>Fecha:</b> ${bData.date}<br><b>Hora:</b> ${bData.time}</p>
                         <p>Nos pondremos en contacto contigo pronto con el enlace de conexión.</p>
                         <p><b>Nota:</b> Te adjuntamos una invitación de calendario para que puedas agregar la cita a tu Google Calendar.</p>
                         <p>Saludos,<br>El equipo de MoreMKT</p>`,
                         icsString
                    );
                    
                    // Correo al admin
                    await sendEmail(
                        ADMIN_EMAIL, 
                        "🟢 Nueva Reserva Confirmada (Pagada)", 
                        `<h2>¡Nueva Asesoría Pagada!</h2>
                         <p><b>Cliente:</b> ${bData.clientName} (${bData.clientEmail})</p>
                         <p><b>Teléfono:</b> ${bData.clientPhone || 'No proporcionado'}</p>
                         <p><b>Fecha:</b> ${bData.date}<br><b>Hora:</b> ${bData.time}</p>
                         <p><b>Monto:</b> $${bData.price}</p>`,
                         icsString
                    );
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

        // Notificar al admin por correo
        await sendEmail(
            ADMIN_EMAIL,
            "🚀 Nuevo Lead - Diagnóstico Online",
            `<h2>Nuevo Solicitante de Diagnóstico</h2>
             <p><b>Nombre:</b> ${name}</p>
             <p><b>Email:</b> ${email}</p>
             <p><b>Teléfono:</b> ${phone}</p>
             <p><b>Mensaje:</b> ${message}</p>
             <br>
             <p><a href="https://wa.me/${phone.replace(/\D/g, '')}" style="background-color:#25D366;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">Contactar por WhatsApp</a></p>`
        );

        return res.status(201).json({ success: true });
    } catch (error) {
        console.error("[saveLead] Error interno.");
        return res.status(500).json({ error: "Error al guardar solicitud" });
    }
});

// cors: false porque lo manejamos manualmente con middleware propio
exports.api = onRequest({ cors: false, maxInstances: 10 }, app);

// ============================================
// CRON JOB: RECORDATORIOS 24HS
// Se ejecuta cada hora buscando reservas programadas para mañana
// ============================================
exports.sendReminders = onSchedule("0 * * * *", async (event) => {
    try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        // Ajuste horario para sacar la fecha local (Argentina UTC-3)
        const tomorrowAR = new Date(tomorrow.getTime() - 3 * 60 * 60 * 1000);
        const targetDate = tomorrowAR.toISOString().split("T")[0];

        // Buscar reservas confirmadas para esa fecha
        const snapshot = await db.collection("bookings")
            .where("date", "==", targetDate)
            .where("status", "==", "confirmed")
            .get();

        if (snapshot.empty) {
            console.log(`[sendReminders] No hay reservas confirmadas para el ${targetDate}`);
            return;
        }

        const nowHours = now.getUTCHours() - 3;
        const currentHour = nowHours < 0 ? nowHours + 24 : nowHours;

        const batch = db.batch();
        let sentCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Si ya se le envió recordatorio, saltar
            if (data.reminderSent) continue;
            
            // Verificar si la hora de la reserva coincide con la hora actual (+/- 1 hr)
            const [bookingHour] = data.time.split(":").map(Number);
            if (bookingHour === currentHour || bookingHour === currentHour + 1) {
                
                await sendEmail(
                    data.clientEmail,
                    "⏰ Recordatorio: Tu asesoría con MoreMKT es mañana",
                    `<h2>¡Hola ${data.clientName}!</h2>
                     <p>Te escribimos para recordarte que mañana <b>${data.date} a las ${data.time}</b> tenemos nuestra sesión de asesoría.</p>
                     <p>Si tienes cualquier duda o necesitas reprogramar, por favor escríbenos respondiendo a este correo.</p>
                     <p>¡Nos vemos mañana!</p>`
                );

                // Marcar como enviado en la DB
                batch.update(doc.ref, { reminderSent: true });
                sentCount++;
            }
        }

        if (sentCount > 0) {
            await batch.commit();
        }
        
        console.log(`[sendReminders] Proceso finalizado. Recordatorios enviados: ${sentCount}`);
    } catch (error) {
        console.error("[sendReminders] Error en el cron job:", error);
    }
});
