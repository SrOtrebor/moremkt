/**
 * Script de prueba para el sistema de emails
 * Prueba el envío de emails de confirmación y cancelación
 */

require('dotenv').config();
const admin = require('firebase-admin');
const confirmationEmailTemplate = require('./emails/confirmationEmailTemplate');
const cancellationEmailTemplate = require('./emails/cancellationEmailTemplate');
const nodemailer = require('nodemailer');

// Configurar Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'info@instalacionessl.com.ar',
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
    }
});

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}

async function testEmails() {
    console.log('🧪 Probando sistema de emails...\\n');

    // Datos de prueba
    const testBookingData = {
        studentName: 'Cliente de Prueba',
        studentEmail: process.env.TEST_EMAIL || 'info@instalacionessl.com.ar',
        date: '2026-01-25',
        time: '16:00',
        subject: 'Introducción al Derecho',
        meetLink: 'https://meet.google.com/abc-defg-hij',
        driveFolder: 'https://drive.google.com/drive/folders/ejemplo'
    };

    console.log('📧 Email de destino:', testBookingData.studentEmail);
    console.log('');

    try {
        // 1. Probar email de confirmación
        console.log('1️⃣ Probando email de confirmación...');
        const confirmationHtml = confirmationEmailTemplate(testBookingData);

        await transporter.sendMail({
            from: `"Instalaciones SL" <${process.env.EMAIL_USER || 'info@instalacionessl.com.ar'}>`,
            to: testBookingData.studentEmail,
            subject: `✅ Clase Confirmada - ${testBookingData.subject} - ${testBookingData.date}`,
            html: confirmationHtml
        });

        console.log('✅ Email de confirmación enviado correctamente');
        console.log('');

        // Esperar 2 segundos antes del siguiente email
        console.log('⏳ Esperando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Probar email de cancelación
        console.log('2️⃣ Probando email de cancelación...');
        const cancellationHtml = cancellationEmailTemplate(testBookingData);

        await transporter.sendMail({
            from: `"Instalaciones SL" <${process.env.EMAIL_USER || 'instalacionessl.ar@gmail.com'}>`,
            to: testBookingData.studentEmail,
            subject: `❌ Clase Cancelada - ${testBookingData.subject} - ${testBookingData.date}`,
            html: cancellationHtml
        });

        console.log('✅ Email de cancelación enviado correctamente');
        console.log('');

        console.log('🎉 ¡Prueba completada exitosamente!');
        console.log('📬 Revisa tu bandeja de entrada:', testBookingData.studentEmail);
        console.log('');
        console.log('✨ El sistema de emails está funcionando correctamente.');

        process.exit(0);

    } catch (error) {
        console.error('\\n❌ Error en la prueba:');
        console.error(error.message);
        console.error('\\n📝 Verifica:');
        console.error('   1. Que el archivo .env tenga EMAIL_USER y EMAIL_PASSWORD');
        console.error('   2. Que la contraseña de aplicación de Gmail sea correcta');
        console.error('   3. Que Gmail permita aplicaciones menos seguras');
        process.exit(1);
    }
}

// Ejecutar prueba
testEmails();
