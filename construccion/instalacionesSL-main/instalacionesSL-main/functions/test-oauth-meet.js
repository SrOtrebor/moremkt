/**
 * Script de prueba para OAuth y Google Meet
 * Este script verifica si OAuth está conectado y crea un evento con Meet
 */

require('dotenv').config();
const admin = require('firebase-admin');
const { createCalendarEvent } = require('./services/calendarService');
const { isOAuthConnected } = require('./services/googleOAuth');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}

async function testOAuthAndMeet() {
    console.log('🧪 Probando OAuth y Google Meet...\n');

    try {
        // 1. Verificar si OAuth está conectado
        console.log('1️⃣ Verificando conexión OAuth...');
        const connected = await isOAuthConnected();

        if (!connected) {
            console.log('\n⚠️  OAuth NO está conectado.');
            console.log('📝 Para conectar OAuth:');
            console.log('   1. Abre http://127.0.0.1:5000/admin/conectar-calendar.html');
            console.log('   2. Haz clic en "Conectar Google Calendar"');
            console.log('   3. Autoriza la aplicación con tu cuenta de Google');
            console.log('   4. Vuelve a ejecutar este script\n');
            process.exit(0);
        }

        console.log('✅ OAuth está conectado\n');

        // 2. Crear evento de prueba con Google Meet
        console.log('2️⃣ Creando evento de prueba con Google Meet...');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(15, 0, 0, 0); // 3 PM mañana

        const bookingData = {
            id: 'test-' + Date.now(),
            studentName: 'Estudiante de Prueba',
            studentEmail: 'test@example.com',
            subject: 'Derecho Civil',
            dateTime: tomorrow,
            duration: 60
        };

        const result = await createCalendarEvent(bookingData);

        console.log('\n✅ ¡Evento creado exitosamente!');
        console.log('📋 ID del evento:', result.eventId);
        console.log('🔗 Link del calendario:', result.htmlLink);

        if (result.meetLink) {
            console.log('📹 Link de Google Meet:', result.meetLink);
            console.log('\n🎉 ¡Google Meet está funcionando correctamente!');
        } else {
            console.log('\n⚠️  No se generó link de Google Meet');
            console.log('   Esto puede pasar si OAuth no está configurado correctamente');
        }

        // 3. Preguntar si eliminar el evento
        console.log('\n❓ ¿Deseas eliminar el evento de prueba?');
        console.log('   (Presiona Ctrl+C para cancelar, o espera 5 segundos para eliminar)');

        await new Promise(resolve => setTimeout(resolve, 5000));

        const { deleteCalendarEvent } = require('./services/calendarService');
        await deleteCalendarEvent(result.eventId);
        console.log('✅ Evento eliminado\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testOAuthAndMeet();
