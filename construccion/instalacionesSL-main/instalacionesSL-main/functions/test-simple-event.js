/**
 * Script de prueba simple para Google Calendar (sin Meet)
 */

require('dotenv').config();
const { getCalendarClient } = require('./services/googleAuth');

async function testSimpleEvent() {
    console.log('🧪 Probando creación de evento simple (sin Meet)...\n');

    try {
        const calendar = await getCalendarClient();
        const calendarId = process.env.GOOGLE_CALENDAR_ID;

        const event = {
            summary: 'Prueba - Evento Simple',
            description: 'Este es un evento de prueba sin Google Meet',
            start: {
                dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                timeZone: 'America/Argentina/Buenos_Aires'
            },
            end: {
                dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
                timeZone: 'America/Argentina/Buenos_Aires'
            }
        };

        console.log('⏳ Creando evento...');
        const response = await calendar.events.insert({
            calendarId: calendarId,
            resource: event
        });

        console.log('\n✅ ¡Evento creado exitosamente!');
        console.log('📋 ID del evento:', response.data.id);
        console.log('🔗 Link:', response.data.htmlLink);

        console.log('\n🗑️  Eliminando evento de prueba...');
        await calendar.events.delete({
            calendarId: calendarId,
            eventId: response.data.id
        });

        console.log('✅ Evento eliminado');
        console.log('\n🎉 ¡La autenticación funciona correctamente!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

testSimpleEvent();
