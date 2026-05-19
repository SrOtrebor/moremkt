/**
 * Script de prueba para Google Calendar Integration
 * 
 * Este script prueba la creación de un evento en Google Calendar con Google Meet
 * 
 * Uso:
 * 1. Asegúrate de tener el archivo .env configurado
 * 2. Ejecuta: node test-calendar.js
 */

require('dotenv').config();
const { createCalendarEvent, deleteCalendarEvent } = require('./services/calendarService');

async function testCalendarIntegration() {
    console.log('🧪 Iniciando prueba de integración con Google Calendar...\n');

    try {
        // Datos de prueba
        const testBooking = {
            id: 'test-booking-' + Date.now(),
            studentName: 'Cliente de Prueba',
            studentEmail: 'info@instalacionessl.com.ar',
            subject: 'Derecho Constitucional',
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana a esta hora
            duration: 60
        };

        console.log('📅 Datos de la reserva de prueba:');
        console.log(JSON.stringify(testBooking, null, 2));
        console.log('\n');

        // Crear evento
        console.log('⏳ Creando evento en Google Calendar...');
        const result = await createCalendarEvent(testBooking);

        console.log('\n✅ ¡Evento creado exitosamente!');
        console.log('📋 ID del evento:', result.eventId);
        console.log('📹 Link de Google Meet:', result.meetLink);
        console.log('🔗 Link del calendario:', result.htmlLink);

        // Preguntar si eliminar el evento de prueba
        console.log('\n⚠️  Este es un evento de prueba.');
        console.log('💡 Puedes verificarlo en tu Google Calendar:');
        console.log('   https://calendar.google.com');

        console.log('\n🗑️  Eliminando evento de prueba en 5 segundos...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        await deleteCalendarEvent(result.eventId);
        console.log('✅ Evento de prueba eliminado correctamente');

        console.log('\n🎉 ¡Prueba completada exitosamente!');
        console.log('✨ La integración con Google Calendar está funcionando correctamente.');

    } catch (error) {
        console.error('\n❌ Error en la prueba:');
        console.error(error.message);
        console.error('\n📝 Verifica:');
        console.error('   1. Que el archivo .env tenga las credenciales correctas');
        console.error('   2. Que el calendario esté compartido con la Service Account');
        console.error('   3. Que Google Calendar API esté habilitada');
        process.exit(1);
    }
}

// Ejecutar prueba
testCalendarIntegration();
