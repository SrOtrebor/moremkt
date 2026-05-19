const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = require("./services/calendarService");
const { getAuthUrl, handleOAuthCallback, isOAuthConnected, disconnectOAuth } = require("./services/googleOAuth");
const confirmationEmailTemplate = require("./emails/confirmationEmailTemplate");
const cancellationEmailTemplate = require("./emails/cancellationEmailTemplate");
const { getOrCreateStudentFolder, addWelcomeDocument } = require("./services/driveService");
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// Configurar Mercado Pago (las credenciales vienen de .env)
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Secret para JWT (en producción usar Firebase Config)
const JWT_SECRET = process.env.JWT_SECRET || "instalacionessl-secret-key-change-in-production";

// Configurar App Express
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * Middleware para validar la autenticación mediante JWT.
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

// ============================================
// ENDPOINTS DE ADMIN - AUTENTICACIÓN
// ============================================

/**
 * Punto de entrada para el login administrativo.
 * @route POST /admin/login
 * @param {string} req.body.email - Email del administrador
 * @param {string} req.body.password - Contraseña en texto plano
 * @returns {Object} JSON con token JWT e info del usuario
 */
app.post("/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña requeridos" });
        }

        // Buscar usuario admin
        const adminSnapshot = await db.collection("admin_users")
            .where("email", "==", email)
            .limit(1)
            .get();

        if (adminSnapshot.empty) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const adminDoc = adminSnapshot.docs[0];
        const adminData = adminDoc.data();

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, adminData.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // Generar token JWT (válido 24 horas)
        const token = jwt.sign(
            {
                uid: adminDoc.id,
                email: adminData.email,
                name: adminData.name,
                role: adminData.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            success: true,
            token,
            user: {
                email: adminData.email,
                name: adminData.name,
                role: adminData.role
            }
        });
    } catch (error) {
        console.error("Error en login:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

/**
 * Obtiene la configuración global del sistema (disponibilidad, precios y bloqueos).
 * Requiere autenticación administrativa.
 * @route GET /admin/config
 */
app.get("/admin/config", requireAuth, async (req, res) => {
    try {
        // Obtener configuración de disponibilidad
        const availabilityDoc = await db.collection("availability_config").doc("default").get();
        const availability = availabilityDoc.exists ? availabilityDoc.data() : null;

        // Obtener configuración de precios
        const pricingDoc = await db.collection("pricing_config").doc("default").get();
        const pricing = pricingDoc.exists ? pricingDoc.data() : null;

        // Obtener bloqueos activos
        const blocksSnapshot = await db.collection("availability_blocks")
            .where("date", ">=", new Date().toISOString().split('T')[0])
            .orderBy("date", "asc")
            .get();

        const blocks = blocksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.status(200).json({
            availability,
            pricing,
            blocks
        });
    } catch (error) {
        console.error("Error al obtener configuración:", error);
        return res.status(500).json({ error: "Error al obtener configuración" });
    }
});

/**
 * Actualizar configuración de disponibilidad
 */
app.put("/admin/config/availability", requireAuth, async (req, res) => {
    try {
        const { weekdays, sessionDuration, minDaysAdvance, maxDaysAdvance } = req.body;

        // Validaciones básicas
        if (!weekdays || typeof sessionDuration !== 'number') {
            return res.status(400).json({ error: "Datos inválidos" });
        }

        const configData = {
            weekdays,
            sessionDuration,
            minDaysAdvance: minDaysAdvance || 1,
            maxDaysAdvance: maxDaysAdvance || 30,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: req.user.email
        };

        await db.collection("availability_config").doc("default").set(configData, { merge: true });

        return res.status(200).json({
            success: true,
            message: "Configuración actualizada correctamente"
        });
    } catch (error) {
        console.error("Error al actualizar disponibilidad:", error);
        return res.status(500).json({ error: "Error al actualizar configuración" });
    }
});

/**
 * Actualizar configuración de precios
 */
app.put("/admin/config/pricing", requireAuth, async (req, res) => {
    try {
        const pricingData = {
            individual,
            currency: "ARS",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: req.user.email
        };

        await db.collection("pricing_config").doc("default").set(pricingData, { merge: true });

        return res.status(200).json({
            success: true,
            message: "Precios actualizados correctamente"
        });
    } catch (error) {
        console.error("Error al actualizar precios:", error);
        return res.status(500).json({ error: "Error al actualizar precios" });
    }
});

/**
 * Crea un bloqueo de horario en la agenda.
 * @route POST /admin/blocks
 * @param {string} req.body.date - Fecha en formato YYYY-MM-DD
 * @param {string} req.body.startTime - Hora de inicio HH:mm
 * @param {string} req.body.endTime - Hora de fin HH:mm
 */
app.post("/admin/blocks", requireAuth, async (req, res) => {
    try {
        const { date, startTime, endTime, reason } = req.body;

        if (!date || !startTime || !endTime) {
            return res.status(400).json({ error: "Fecha y horarios requeridos" });
        }

        // Validar que la fecha sea futura
        const blockDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (blockDate < today) {
            return res.status(400).json({ error: "No se pueden bloquear fechas pasadas" });
        }

        const blockData = {
            date,
            startTime,
            endTime,
            reason: reason || "",
            createdBy: req.user.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const blockRef = await db.collection("availability_blocks").add(blockData);

        return res.status(201).json({
            success: true,
            blockId: blockRef.id,
            message: "Horario bloqueado correctamente"
        });
    } catch (error) {
        console.error("Error al crear bloqueo:", error);
        return res.status(500).json({ error: "Error al crear bloqueo" });
    }
});

/**
 * Eliminar bloqueo de horario
 */
app.delete("/admin/blocks/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        await db.collection("availability_blocks").doc(id).delete();

        return res.status(200).json({
            success: true,
            message: "Bloqueo eliminado correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar bloqueo:", error);
        return res.status(500).json({ error: "Error al eliminar bloqueo" });
    }
});

/**
 * Recupera el listado de reservas con filtros opcionales.
 * @route GET /admin/bookings
 * @param {string} [req.query.status] - Estado de la reserva (confirmed, pending_payment, cancelled)
 */
app.get("/admin/bookings", requireAuth, async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        let query = db.collection("bookings");

        // Filtrar por estado si se especifica
        if (status && status !== 'all') {
            query = query.where("status", "==", status);
        }

        // Filtrar por rango de fechas
        if (startDate) {
            query = query.where("date", ">=", startDate);
        }
        if (endDate) {
            query = query.where("date", "<=", endDate);
        }

        // Ordenar por fecha descendente
        query = query.orderBy("date", "desc").limit(100);

        const snapshot = await query.get();
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.status(200).json({ bookings });
    } catch (error) {
        console.error("Error al listar reservas:", error);
        return res.status(500).json({ error: "Error al listar reservas" });
    }
});

/**
 * Cancelar una reserva
 */
app.put("/admin/bookings/:id/cancel", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const bookingRef = db.collection("bookings").doc(id);
        const bookingDoc = await bookingRef.get();

        if (!bookingDoc.exists) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }

        const bookingData = bookingDoc.data();

        // Eliminar evento de Google Calendar si existe
        if (bookingData.calendarEventId) {
            try {
                await deleteCalendarEvent(bookingData.calendarEventId);
                console.log('✅ Evento de Calendar eliminado:', bookingData.calendarEventId);
            } catch (calendarError) {
                console.error('⚠️ Error al eliminar evento de Calendar:', calendarError.message);
                // Continuar con la cancelación aunque falle Calendar
            }
        }

        await bookingRef.update({
            status: "cancelled",
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            cancelledBy: req.user.email
        });

        // Enviar email de cancelación al estudiante
        try {
            const emailHtml = cancellationEmailTemplate({
                clientName: bookingData.clientName || bookingData.studentName,
                date: bookingData.date,
                time: bookingData.time,
                serviceType: bookingData.serviceType || bookingData.subject || 'Visita Técnica'
            });

            await transporter.sendMail({
                from: `"Instalaciones SL" <${process.env.EMAIL_USER}>`,
                to: bookingData.clientEmail || bookingData.studentEmail,
                subject: `❌ Visita Cancelada - ${bookingData.serviceType || 'Visita Técnica'} - ${bookingData.date}`,
                html: emailHtml
            });

            console.log('✅ Email de cancelación enviado a:', bookingData.studentEmail);
        } catch (emailError) {
            console.error('⚠️ Error al enviar email de cancelación:', emailError.message);
            // No fallar la cancelación si el email falla
        }

        return res.status(200).json({
            success: true,
            message: "Reserva cancelada correctamente"
        });
    } catch (error) {
        console.error("Error al cancelar reserva:", error);
        return res.status(500).json({ error: "Error al cancelar reserva" });
    }
});

/**
 * Confirmar una reserva y crear evento en Google Calendar
 */
app.put("/admin/bookings/:id/confirm", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const bookingRef = db.collection("bookings").doc(id);
        const bookingDoc = await bookingRef.get();

        if (!bookingDoc.exists) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }

        const bookingData = bookingDoc.data();

        // Crear evento en Google Calendar con dirección física
        let calendarEventId = null;
        let driveFolder = null;

        try {
            // Combinar fecha y hora para crear DateTime
            const [year, month, day] = bookingData.date.split('-');
            const [hour, minute] = bookingData.time.split(':');
            const dateTime = new Date(year, month - 1, day, hour, minute);

            const calendarData = {
                id: id,
                clientName: bookingData.clientName,
                clientEmail: bookingData.clientEmail,
                clientPhone: bookingData.clientPhone,
                serviceType: bookingData.serviceType,
                problemDescription: bookingData.problemDescription,
                address: bookingData.address,
                dateTime: dateTime,
                duration: 60 // 60 minutos por defecto
            };

            const calendarResult = await createCalendarEvent(calendarData);
            calendarEventId = calendarResult.eventId;

            console.log('✅ Evento de Calendar creado:', calendarEventId);

        } catch (calendarError) {
            console.error('❌ Error al crear evento de Calendar:', calendarError);
            // No fallar la confirmación si Calendar falla
        }

        // Crear o obtener carpeta de Drive para el cliente
        try {
            const folderData = await getOrCreateStudentFolder({
                studentName: bookingData.clientName,
                studentEmail: bookingData.clientEmail,
                bookingId: id
            });

            driveFolder = folderData.folderLink;
            console.log('📁 Carpeta de Drive:', driveFolder);

            // Agregar documento de bienvenida si es una carpeta nueva
            if (folderData.folderId) {
                await addWelcomeDocument(folderData.folderId, bookingData.clientName);
            }

        } catch (driveError) {
            console.error('⚠️ Error al crear carpeta de Drive:', driveError.message);
            // No fallar la confirmación si Drive falla
        }

        // Actualizar reserva con el evento de Calendar y carpeta de Drive
        await bookingRef.update({
            status: "confirmed",
            confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
            confirmedBy: req.user.email,
            calendarEventId: calendarEventId,
            driveFolder: driveFolder
        });

        // Enviar email de confirmación con dirección
        try {
            const emailHtml = confirmationEmailTemplate({
                clientName: bookingData.clientName,
                date: bookingData.date,
                time: bookingData.time,
                serviceType: bookingData.serviceType,
                address: bookingData.address,
                driveFolder: driveFolder
            });

            await transporter.sendMail({
                from: `"Instalaciones SL" <${process.env.EMAIL_USER}>`,
                to: bookingData.clientEmail,
                subject: `✅ Visita Confirmada - ${bookingData.serviceType} - ${bookingData.date}`,
                html: emailHtml
            });

            console.log('✅ Email de confirmación enviado a:', bookingData.clientEmail);
        } catch (emailError) {
            console.error('⚠️ Error al enviar email de confirmación:', emailError.message);
            // No fallar la confirmación si el email falla
        }

        return res.status(200).json({
            success: true,
            message: "Reserva confirmada correctamente"
        });
    } catch (error) {
        console.error("Error al confirmar reserva:", error);
        return res.status(500).json({ error: "Error al confirmar reserva" });
    }
});

// ============================================
// ENDPOINTS DE ADMIN - GOOGLE CALENDAR OAUTH
// ============================================

/**
 * Generar URL de autorización OAuth
 * NOTA: Sin requireAuth para desarrollo local
 */
app.get("/admin/calendar/auth-url", async (req, res) => {
    try {
        const baseUrl = req.get('origin') || req.get('referer') || 'https://instalacionessl.com.ar';
        const authUrl = getAuthUrl(baseUrl);

        return res.status(200).json({
            success: true,
            authUrl: authUrl
        });
    } catch (error) {
        console.error("Error al generar URL de autorización:", error);
        return res.status(500).json({ error: "Error al generar URL de autorización" });
    }
});

/**
 * Callback OAuth - Recibe código de autorización
 */
app.get("/admin/calendar/callback", async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.redirect('/admin/conectar-calendar.html?calendar_error=no_code');
        }

        const baseUrl = req.get('origin') || req.get('referer') || 'https://instalacionessl.com.ar';

        // Corregir baseUrl para localhost
        const protocol = req.protocol || 'http';
        const host = req.get('host') || 'localhost:5000';
        const correctedBaseUrl = `${protocol}://${host}`;

        console.log('🔍 DEBUG - Protocol:', protocol);
        console.log('🔍 DEBUG - Host:', host);
        console.log('🔍 DEBUG - BaseURL original:', baseUrl);
        console.log('🔍 DEBUG - BaseURL corregida:', correctedBaseUrl);

        await handleOAuthCallback(code, correctedBaseUrl);

        // Redireccionar al dashboard con mensaje de éxito
        return res.redirect('/admin/conectar-calendar.html?calendar_connected=true');
    } catch (error) {
        console.error("Error en callback OAuth:", error);
        return res.redirect('/admin/conectar-calendar.html?calendar_error=true');
    }
});

/**
 * Verificar estado de conexión OAuth
 * NOTA: Sin requireAuth para desarrollo local
 */
app.get("/admin/calendar/status", async (req, res) => {
    try {
        const connected = await isOAuthConnected();

        let expiryDate = null;
        if (connected) {
            const tokensDoc = await db.collection('calendar_oauth_tokens').doc('default').get();
            if (tokensDoc.exists) {
                expiryDate = tokensDoc.data().expiry_date;
            }
        }

        return res.status(200).json({
            connected: connected,
            expiresAt: expiryDate
        });
    } catch (error) {
        console.error("Error al verificar estado OAuth:", error);
        return res.status(500).json({ error: "Error al verificar estado" });
    }
});

/**
 * Desconectar OAuth
 * NOTA: Sin requireAuth para desarrollo local
 */
app.post("/admin/calendar/disconnect", async (req, res) => {
    try {
        await disconnectOAuth();

        return res.status(200).json({
            success: true,
            message: "Google Calendar desconectado correctamente"
        });
    } catch (error) {
        console.error("Error al desconectar OAuth:", error);
        return res.status(500).json({ error: "Error al desconectar" });
    }
});

/**
 * Obtiene los slots de tiempo disponibles para una fecha específica.
 * @route GET /getAvailableSlots
 * @param {string} req.query.date - Fecha a consultar (YYYY-MM-DD)
 */
app.get("/getAvailableSlots", async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: "Fecha requerida" });
        }

        // Obtener configuración de disponibilidad
        const configDoc = await db.collection("availability_config").doc("default").get();
        if (!configDoc.exists) {
            return res.status(500).json({ error: "Configuración no encontrada" });
        }

        const config = configDoc.data();
        const dateObj = new Date(date);
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dateObj.getDay()];

        // Verificar si el día está habilitado
        const dayConfig = config.weekdays[dayOfWeek];
        if (!dayConfig || !dayConfig.enabled) {
            return res.status(200).json({ slots: [] });
        }

        // Generar slots base según configuración (soporta múltiples rangos)
        let slots = [];
        if (dayConfig.timeRanges && dayConfig.timeRanges.length > 0) {
            // Nueva estructura con múltiples rangos
            for (const range of dayConfig.timeRanges) {
                const rangeSlots = generateTimeSlots(range.start, range.end, config.sessionDuration);
                slots = slots.concat(rangeSlots);
            }
        } else if (dayConfig.start && dayConfig.end) {
            // Estructura antigua (compatibilidad)
            slots = generateTimeSlots(dayConfig.start, dayConfig.end, config.sessionDuration);
        }

        // Filtrar slots bloqueados
        const blocksSnapshot = await db.collection("availability_blocks")
            .where("date", "==", date)
            .get();

        const blockedSlots = new Set();
        blocksSnapshot.docs.forEach(doc => {
            const block = doc.data();
            blockedSlots.add(block.startTime);
        });

        // Filtrar slots con reservas confirmadas
        const bookingsSnapshot = await db.collection("bookings")
            .where("date", "==", date)
            .where("status", "==", "confirmed")
            .get();

        bookingsSnapshot.docs.forEach(doc => {
            const booking = doc.data();
            blockedSlots.add(booking.time);
        });

        // Devolver solo slots disponibles
        const availableSlots = slots.filter(slot => !blockedSlots.has(slot));

        return res.status(200).json({ slots: availableSlots });
    } catch (error) {
        console.error("Error al obtener horarios:", error);
        return res.status(500).json({ error: "Error al obtener horarios disponibles" });
    }
});

/**
 * Función auxiliar para generar slots de tiempo
 */
function generateTimeSlots(startTime, endTime, duration) {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        slots.push(timeStr);

        currentMin += duration;
        if (currentMin >= 60) {
            currentHour += Math.floor(currentMin / 60);
            currentMin = currentMin % 60;
        }
    }

    return slots;
}

/**
 * Crea una nueva reserva (booking) e inicia el proceso de pago con Mercado Pago.
 * @route POST /createBooking
 * @param {Object} req.body - Datos de la reserva y contacto del cliente
 */
app.post("/createBooking", async (req, res) => {
    try {
        console.log('📥 createBooking recibido:', JSON.stringify(req.body));
        console.log('🔑 MP_ACCESS_TOKEN presente:', !!process.env.MP_ACCESS_TOKEN);
        console.log('🌐 BASE_URL:', process.env.BASE_URL);

        const {
            name,
            email,
            phone,
            serviceType,
            problemDescription,
            address, // { street, streetNumber, floor, neighborhood, betweenStreets }
            packageType,
            date,
            time
        } = req.body;

        // Validar datos obligatorios
        if (!name || !email || !phone || !serviceType || !date || !time) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        // Validar dirección
        if (!address || !address.street || !address.streetNumber || !address.neighborhood) {
            return res.status(400).json({ error: "Dirección incompleta. Se requiere: calle, altura y barrio" });
        }

        console.log('🔍 Verificando disponibilidad del slot...');
        // Verificar que el slot esté disponible
        const existingBooking = await db.collection("bookings")
            .where("date", "==", date)
            .where("time", "==", time)
            .where("status", "==", "confirmed")
            .limit(1)
            .get();

        if (!existingBooking.empty) {
            return res.status(400).json({ error: "Este horario ya no está disponible" });
        }

        console.log('💰 Obteniendo precio...');
        // Obtener precio (Tarifa única de visita)
        const pricingDoc = await db.collection("pricing_config").doc("default").get();
        const pricing = pricingDoc.exists ? pricingDoc.data() : { individual: 10000 };
        const price = pricing.individual || 10000;
        console.log('💰 Precio:', price);

        console.log('💾 Guardando booking en Firestore...');
        // Crear registro en Firestore
        const bookingRef = await db.collection("bookings").add({
            clientName: name,
            clientEmail: email,
            clientPhone: phone,
            serviceType: serviceType,
            problemDescription: problemDescription || "",
            address: {
                street: address.street,
                streetNumber: address.streetNumber,
                floor: address.floor || "",
                neighborhood: address.neighborhood,
                betweenStreets: address.betweenStreets || ""
            },
            package: packageType || null,
            date: date,
            time: time,
            price: price,
            status: "pending_payment",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Booking guardado:', bookingRef.id);

        // Generar preferencia de pago en Mercado Pago
        let init_point = null;
        try {
            console.log('💳 Creando preferencia de Mercado Pago...');
            const preference = new Preference(mpClient);
            const mpResponse = await preference.create({
                body: {
                    items: [{
                        id: bookingRef.id,
                        title: `Visita Técnica - ${serviceType}`,
                        quantity: 1,
                        unit_price: price,
                        currency_id: 'ARS'
                    }],
                    payer: {
                        name: name,
                        email: email
                    },
                    external_reference: bookingRef.id,
                    back_urls: {
                        success: `${process.env.BASE_URL}/agendar.html?status=approved`,
                        failure: `${process.env.BASE_URL}/agendar.html?status=failure`,
                        pending: `${process.env.BASE_URL}/agendar.html?status=pending`
                    },
                    auto_return: 'approved',
                    notification_url: `${process.env.FUNCTIONS_URL}/api/mercadopagoWebhook`,
                    statement_descriptor: 'Instalaciones SL'
                }
            });
            init_point = mpResponse.init_point;
            console.log('✅ Preferencia de MP creada:', mpResponse.id);
        } catch (mpError) {
            console.error('❌ Error al crear preferencia de MP:', mpError.message || mpError);
            await bookingRef.delete();
            return res.status(500).json({ error: 'No se pudo iniciar el proceso de pago. Intentá de nuevo.' });
        }

        return res.status(201).json({
            success: true,
            bookingId: bookingRef.id,
            message: 'Reserva creada. Completá el pago para confirmar tu visita.',
            init_point: init_point
        });
    } catch (error) {
        console.error("❌ Error al crear reserva:", error.message || error);
        return res.status(500).json({ error: "Error interno al crear la reserva", detail: error.message });
    }
});

/**
 * Webhook de Mercado Pago
 */
app.post("/mercadopagoWebhook", async (req, res) => {
    try {
        // MP envía notificaciones de distintos tipos, solo nos interesan los pagos
        const { type, data } = req.body;

        if (type !== 'payment' || !data?.id) {
            return res.status(200).send("OK"); // Ignorar otros tipos
        }

        console.log('Notificación de pago recibida, ID:', data.id);

        // Consultar el estado real del pago en la API de MP
        const mpPayment = new Payment(mpClient);
        const paymentInfo = await mpPayment.get({ id: data.id });

        console.log('Estado del pago:', paymentInfo.status, '| Referencia:', paymentInfo.external_reference);

        // Solo procesar pagos aprobados
        if (paymentInfo.status !== 'approved') {
            return res.status(200).send("OK");
        }

        const bookingId = paymentInfo.external_reference;
        if (!bookingId) {
            console.error('Pago aprobado pero sin external_reference (bookingId)');
            return res.status(200).send("OK");
        }

        // Obtener el booking de Firestore
        const bookingRef = db.collection("bookings").doc(bookingId);
        const bookingDoc = await bookingRef.get();

        if (!bookingDoc.exists) {
            console.error('Booking no encontrado:', bookingId);
            return res.status(200).send("OK");
        }

        const bookingData = bookingDoc.data();

        // Evitar procesar el mismo pago dos veces
        if (bookingData.status === 'confirmed') {
            console.log('Booking ya confirmado, ignorando duplicado:', bookingId);
            return res.status(200).send("OK");
        }

        // === CONFIRMAR EL BOOKING ===
        let calendarEventId = null;
        let driveFolder = null;

        // 1. Crear evento en Google Calendar
        try {
            const [year, month, day] = bookingData.date.split('-');
            const [hour, minute] = bookingData.time.split(':');
            const dateTime = new Date(year, month - 1, day, hour, minute);

            const calendarResult = await createCalendarEvent({
                id: bookingId,
                clientName: bookingData.clientName,
                clientEmail: bookingData.clientEmail,
                clientPhone: bookingData.clientPhone,
                serviceType: bookingData.serviceType,
                problemDescription: bookingData.problemDescription,
                address: bookingData.address,
                dateTime: dateTime,
                duration: 60
            });
            calendarEventId = calendarResult.eventId;
            console.log('✅ Evento de Calendar creado:', calendarEventId);
        } catch (calendarError) {
            console.error('⚠️ Error al crear evento de Calendar:', calendarError.message);
        }

        // 2. Crear carpeta en Google Drive
        try {
            const folderData = await getOrCreateStudentFolder({
                studentName: bookingData.clientName,
                studentEmail: bookingData.clientEmail,
                bookingId: bookingId
            });
            driveFolder = folderData.folderLink;
            if (folderData.folderId) {
                await addWelcomeDocument(folderData.folderId, bookingData.clientName);
            }
            console.log('📁 Carpeta de Drive creada:', driveFolder);
        } catch (driveError) {
            console.error('⚠️ Error al crear carpeta de Drive:', driveError.message);
        }

        // 3. Actualizar el booking en Firestore
        await bookingRef.update({
            status: 'confirmed',
            confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
            confirmedBy: 'mercadopago_webhook',
            paymentId: String(data.id),
            paymentStatus: paymentInfo.status,
            calendarEventId: calendarEventId,
            driveFolder: driveFolder
        });
        console.log('✅ Booking confirmado en Firestore:', bookingId);

        // 4. Enviar email de confirmación al cliente
        try {
            const emailHtml = confirmationEmailTemplate({
                clientName: bookingData.clientName,
                date: bookingData.date,
                time: bookingData.time,
                serviceType: bookingData.serviceType,
                address: bookingData.address,
                driveFolder: driveFolder
            });
            await transporter.sendMail({
                from: `"Instalaciones SL" <${process.env.EMAIL_USER}>`,
                to: bookingData.clientEmail,
                subject: `✅ Visita Confirmada - ${bookingData.serviceType} - ${bookingData.date}`,
                html: emailHtml
            });
            console.log('✅ Email de confirmación enviado a:', bookingData.clientEmail);
        } catch (emailError) {
            console.error('⚠️ Error al enviar email de confirmación:', emailError.message);
        }

        return res.status(200).send("OK");
    } catch (error) {
        console.error("Error en webhook de Mercado Pago:", error);
        // Siempre responder 200 a MP para que no reintente indefinidamente
        return res.status(200).send("OK");
    }
});

// ============================================
// ENDPOINTS DE ESTUDIANTES - PORTAL
// ============================================

const magicLinkTemplate = require('./emails/magicLinkTemplate');
const nodemailer = require('nodemailer');

// Configurar Nodemailer (usar variables de entorno en producción)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Solicitar magic link
 */
app.post("/student/request-access", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email requerido' });
        }

        // Verificar que el estudiante tenga reservas
        const bookingsSnapshot = await db.collection('bookings')
            .where('clientEmail', '==', email)
            .limit(1)
            .get();

        if (bookingsSnapshot.empty) {
            return res.status(404).json({
                error: 'No encontramos reservas asociadas a este email'
            });
        }

        // Obtener nombre del cliente de la primera reserva
        const firstBooking = bookingsSnapshot.docs[0].data();
        const clientName = firstBooking.clientName || 'Cliente';

        // Generar token de magic link (expira en 15 minutos)
        const magicToken = jwt.sign(
            { email, type: 'magic-link' },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Construir URL del magic link
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const magicLink = `${baseUrl}/mi-cuenta?token=${magicToken}`;

        // Enviar email
        const emailHtml = magicLinkTemplate(clientName, magicLink, 15);

        await transporter.sendMail({
            from: `"Instalaciones SL" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Accedé a tu cuenta - Instalaciones SL',
            html: emailHtml
        });

        return res.status(200).json({
            success: true,
            message: 'Revisa tu email. Te enviamos un link para acceder.'
        });

    } catch (error) {
        console.error('Error al enviar magic link:', error);
        return res.status(500).json({ error: 'Error al enviar el link de acceso' });
    }
});

/**
 * Verificar token y crear sesión
 */
app.post("/student/verify-token", async (req, res) => {
    try {
        const { token } = req.body;
        console.log('=== VERIFY TOKEN DEBUG ===');
        console.log('Token recibido:', token ? token.substring(0, 50) + '...' : 'null');

        if (!token) {
            console.log('ERROR: Token no proporcionado');
            return res.status(400).json({ error: 'Token requerido' });
        }

        // Verificar magic token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
            console.log('Token decodificado exitosamente:', decoded);
        } catch (error) {
            console.log('ERROR al verificar JWT:', error.message);
            return res.status(401).json({ error: 'Link inválido o expirado' });
        }

        if (decoded.type !== 'magic-link') {
            console.log('ERROR: Tipo de token incorrecto:', decoded.type);
            return res.status(401).json({ error: 'Token inválido' });
        }

        const { email } = decoded;
        console.log('Email del token:', email);

        // Crear sesión de 30 días
        const sessionToken = jwt.sign(
            { email, type: 'student-session' },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        console.log('Session token creado');

        // Guardar sesión en Firestore
        const now = new Date();
        const expiresDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const sessionData = {
            sessionToken,
            studentEmail: email,
            createdAt: now,
            expiresAt: expiresDate,
            lastAccess: now
        };

        console.log('Guardando sesión en Firestore...');
        await db.collection('student_sessions').add(sessionData);
        console.log('Sesión guardada exitosamente');

        // Obtener datos básicos del estudiante
        console.log('Buscando bookings para:', email);
        let studentName = 'Estudiante';

        try {
            const bookingsSnapshot = await db.collection('bookings')
                .where('clientEmail', '==', email)
                .limit(1)
                .get();

            console.log('Bookings encontrados:', bookingsSnapshot.size);

            if (!bookingsSnapshot.empty) {
                studentName = bookingsSnapshot.docs[0].data().clientName || 'Cliente';
                console.log('Nombre del cliente:', studentName);
            } else {
                console.log('No se encontraron bookings para este email');
            }
        } catch (bookingError) {
            console.error('Error al buscar bookings:', bookingError);
            // Continuar con nombre por defecto
        }

        console.log('=== VERIFY TOKEN SUCCESS ===');
        console.log('Preparando respuesta con sessionToken y student data...');

        const responseData = {
            success: true,
            sessionToken,
            student: {
                email,
                name: studentName
            }
        };

        console.log('Response data:', JSON.stringify(responseData, null, 2));
        console.log('Enviando respuesta 200...');

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('=== VERIFY TOKEN ERROR ===');
        console.error('Error completo:', error);
        console.error('Stack:', error.stack);
        return res.status(500).json({ error: 'Error al verificar el token' });
    }
});

/**
 * Middleware para validar sesión de estudiante
 */
function requireStudentSession(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.type !== 'student-session') {
            return res.status(401).json({ error: 'Sesión inválida' });
        }

        req.student = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Sesión expirada' });
    }
}

/**
 * Obtener dashboard del estudiante
 */
app.get("/student/dashboard", requireStudentSession, async (req, res) => {
    try {
        const { email } = req.student;

        // Obtener todas las reservas del estudiante
        const bookingsSnapshot = await db.collection('bookings')
            .where('clientEmail', '==', email)
            .orderBy('date', 'desc')
            .get();

        const bookings = bookingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Los paquetes han sido eliminados de la lógica técnica
        const packages = [];

        // Separar clases futuras y pasadas
        const today = new Date().toISOString().split('T')[0];
        const upcomingClasses = bookings.filter(b =>
            b.date >= today && b.status === 'confirmed'
        );
        const pastClasses = bookings.filter(b =>
            b.date < today && b.status === 'confirmed'
        );

        // Obtener nombre del estudiante
        const clientNameDisplay = bookings[0]?.clientName || 'Cliente';

        // Obtener link de Drive (del primer booking confirmado)
        const confirmedBooking = bookings.find(b => b.status === 'confirmed');
        const driveFolder = confirmedBooking?.driveFolder || null;

        return res.status(200).json({
            success: true,
            student: {
                email,
                name: clientNameDisplay
            },
            packages: null,
            upcomingClasses,
            pastClasses,
            driveFolder,
            stats: {
                totalClasses: bookings.filter(b => b.status === 'confirmed').length,
                upcomingCount: upcomingClasses.length,
                pastCount: pastClasses.length
            }
        });

    } catch (error) {
        console.error('Error al obtener dashboard:', error);
        return res.status(500).json({ error: 'Error al cargar tus datos' });
    }
});

/**
 * Cerrar sesión
 */
app.post("/student/logout", requireStudentSession, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split('Bearer ')[1];

        // Eliminar sesión de Firestore
        const sessionsSnapshot = await db.collection('student_sessions')
            .where('sessionToken', '==', token)
            .get();

        const deletePromises = sessionsSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);

        return res.status(200).json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });

    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
});

// Exportar la API
exports.api = functions.https.onRequest(app);
