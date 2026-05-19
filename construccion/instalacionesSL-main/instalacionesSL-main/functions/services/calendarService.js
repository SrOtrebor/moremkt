const { getOAuthClient } = require('./googleOAuth');
const { getCalendarClient } = require('./googleAuth');

/**
 * Obtiene un cliente de Calendar (intenta OAuth primero, luego Service Account)
 * @returns {Promise<google.calendar_v3.Calendar>}
 */
async function getCalendar() {
    try {
        // Se prioriza el uso de Service Account para mayor estabilidad en servidor
        console.log('📅 Usando Service Account para Google Calendar');
        const calendar = await getCalendarClient();
        return {
            calendar,
            calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
            useOAuth: false
        };
    } catch (serviceAccountError) {
        console.log('⚠️ Fallback: Intentando autenticación vía OAuth2');
        const calendar = await getOAuthClient();
        return { calendar, calendarId: 'primary', useOAuth: true };
    }
}

/**
 * Crea un evento en Google Calendar para una visita técnica
 * @param {Object} bookingData - Datos de la reserva
 * @param {string} bookingData.id - ID de la reserva
 * @param {string} bookingData.clientName - Nombre del cliente
 * @param {string} bookingData.clientEmail - Email del cliente
 * @param {string} bookingData.clientPhone - Teléfono del cliente
 * @param {string} bookingData.serviceType - Tipo de servicio (Instalación/Mantenimiento/Carga de Gas)
 * @param {string} bookingData.problemDescription - Descripción del problema/equipo
 * @param {Object} bookingData.address - Dirección del cliente
 * @param {string} bookingData.address.street - Calle
 * @param {string} bookingData.address.streetNumber - Altura
 * @param {string} bookingData.address.floor - Piso/Depto (opcional)
 * @param {string} bookingData.address.neighborhood - Barrio/Localidad
 * @param {string} bookingData.address.betweenStreets - Entre calles (opcional)
 * @param {Date} bookingData.dateTime - Fecha y hora de inicio
 * @param {number} bookingData.duration - Duración en minutos (default: 60)
 * @returns {Promise<{eventId: string, htmlLink: string}>}
 */
async function createCalendarEvent(bookingData) {
    try {
        const { calendar, calendarId } = await getCalendar();

        // Calcular fecha de fin (duración por defecto: 60 minutos)
        const startTime = new Date(bookingData.dateTime);
        const endTime = new Date(startTime.getTime() + (bookingData.duration || 60) * 60000);

        // Construir dirección completa para el campo location
        const addressParts = [
            `${bookingData.address.street} ${bookingData.address.streetNumber}`,
            bookingData.address.floor ? `Piso ${bookingData.address.floor}` : null,
            bookingData.address.neighborhood
        ].filter(Boolean);

        const fullAddress = addressParts.join(', ');

        // Construir descripción detallada
        let description = `🔧 VISITA TÉCNICA - ${bookingData.serviceType}\n\n`;
        description += `📋 DATOS DEL CLIENTE:\n`;
        description += `Nombre: ${bookingData.clientName}\n`;
        description += `Email: ${bookingData.clientEmail}\n`;
        description += `Teléfono: ${bookingData.clientPhone}\n\n`;
        description += `📍 DIRECCIÓN:\n`;
        description += `${bookingData.address.street} ${bookingData.address.streetNumber}\n`;
        if (bookingData.address.floor) {
            description += `Piso/Depto: ${bookingData.address.floor}\n`;
        }
        description += `Barrio: ${bookingData.address.neighborhood}\n`;
        if (bookingData.address.betweenStreets) {
            description += `Entre calles: ${bookingData.address.betweenStreets}\n`;
        }
        description += `\n🛠️ DETALLES DEL SERVICIO:\n`;
        description += `${bookingData.problemDescription || 'Sin detalles adicionales'}\n\n`;
        description += `ID de Reserva: ${bookingData.id}`;

        // Configurar el evento
        const event = {
            summary: `${bookingData.serviceType} - ${bookingData.clientName}`,
            description: description,
            location: fullAddress, // ⭐ Campo location para Google Maps/Waze
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'America/Argentina/Buenos_Aires'
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'America/Argentina/Buenos_Aires'
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 día antes
                    { method: 'popup', minutes: 60 }        // 1 hora antes
                ]
            },
            colorId: '9' // Azul para visitas técnicas
        };

        // Crear el evento (SIN conferenceData - no se genera Google Meet)
        const response = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
            sendUpdates: 'none'
        });

        const createdEvent = response.data;

        console.log('✅ Evento de visita técnica creado en Google Calendar:', createdEvent.id);
        console.log('📍 Dirección:', fullAddress);

        return {
            eventId: createdEvent.id,
            htmlLink: createdEvent.htmlLink
        };

    } catch (error) {
        console.error('❌ Error al crear evento en Calendar:', error.message);
        throw new Error(`No se pudo crear el evento en Google Calendar: ${error.message}`);
    }
}

/**
 * Actualiza un evento existente en Google Calendar
 * @param {string} eventId - ID del evento a actualizar
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object>}
 */
async function updateCalendarEvent(eventId, updates) {
    try {
        const { calendar, calendarId } = await getCalendar();

        // Obtener el evento actual
        const currentEvent = await calendar.events.get({
            calendarId: calendarId,
            eventId: eventId
        });

        // Preparar actualizaciones
        const updatedEvent = { ...currentEvent.data };

        if (updates.dateTime) {
            const startTime = new Date(updates.dateTime);
            const endTime = new Date(startTime.getTime() + (updates.duration || 60) * 60000);

            updatedEvent.start = {
                dateTime: startTime.toISOString(),
                timeZone: 'America/Argentina/Buenos_Aires'
            };
            updatedEvent.end = {
                dateTime: endTime.toISOString(),
                timeZone: 'America/Argentina/Buenos_Aires'
            };
        }

        if (updates.serviceType) {
            updatedEvent.summary = `${updates.serviceType} - ${updates.clientName || 'Cliente'}`;
        }

        if (updates.address) {
            const addressParts = [
                `${updates.address.street} ${updates.address.streetNumber}`,
                updates.address.floor ? `Piso ${updates.address.floor}` : null,
                updates.address.neighborhood
            ].filter(Boolean);

            updatedEvent.location = addressParts.join(', ');
        }

        // Actualizar el evento
        const response = await calendar.events.update({
            calendarId: calendarId,
            eventId: eventId,
            resource: updatedEvent,
            sendUpdates: 'none'
        });

        console.log('✅ Evento actualizado en Google Calendar:', eventId);
        return response.data;

    } catch (error) {
        console.error('❌ Error al actualizar evento en Calendar:', error.message);
        throw new Error(`No se pudo actualizar el evento: ${error.message}`);
    }
}

/**
 * Cancela y elimina un evento de Google Calendar
 * @param {string} eventId - ID del evento a eliminar
 * @returns {Promise<void>}
 */
async function deleteCalendarEvent(eventId) {
    try {
        const { calendar, calendarId } = await getCalendar();

        await calendar.events.delete({
            calendarId: calendarId,
            eventId: eventId,
            sendUpdates: 'none'
        });

        console.log('✅ Evento eliminado de Google Calendar:', eventId);

    } catch (error) {
        console.error('❌ Error al eliminar evento de Calendar:', error.message);
        throw new Error(`No se pudo eliminar el evento: ${error.message}`);
    }
}

/**
 * Obtiene los detalles de un evento
 * @param {string} eventId - ID del evento
 * @returns {Promise<Object>}
 */
async function getEventDetails(eventId) {
    try {
        const { calendar, calendarId } = await getCalendar();

        const response = await calendar.events.get({
            calendarId: calendarId,
            eventId: eventId
        });

        return response.data;

    } catch (error) {
        console.error('❌ Error al obtener evento de Calendar:', error.message);
        throw new Error(`No se pudo obtener el evento: ${error.message}`);
    }
}

module.exports = {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getEventDetails
};
