const { google } = require('googleapis');

/**
 * Obtiene un cliente autenticado de Google Calendar usando Service Account
 * @returns {Promise<google.calendar_v3.Calendar>} Cliente de Google Calendar autenticado
 */
async function getCalendarClient() {
    try {
        // Credenciales de la Service Account desde variables de entorno
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!serviceAccountEmail || !privateKey) {
            throw new Error('Faltan credenciales de Google Service Account en variables de entorno');
        }

        // Crear cliente JWT con las credenciales
        const auth = new google.auth.JWT({
            email: serviceAccountEmail,
            key: privateKey,
            scopes: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events'
            ]
        });

        // Autenticar
        await auth.authorize();

        // Crear y retornar cliente de Calendar
        const calendar = google.calendar({ version: 'v3', auth });

        console.log('✅ Cliente de Google Calendar autenticado exitosamente');
        return calendar;

    } catch (error) {
        console.error('❌ Error al autenticar con Google Calendar:', error.message);
        throw error;
    }
}

module.exports = {
    getCalendarClient
};
