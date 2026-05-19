/**
 * Script para cargar configuración inicial en Firestore de producción
 * Usa el service account que ya está configurado en el proyecto
 */
const admin = require('firebase-admin');
require('dotenv').config();

// Usar el service account del proyecto (ya configurado en las variables de entorno)
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: 'instalacione-2a21b',
        clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : ''
    })
});

const db = admin.firestore();

async function setup() {
    console.log('Iniciando configuración de Firestore...');

    // Configuración de disponibilidad
    const availabilityConfig = {
        weekdays: {
            sunday: { enabled: false },
            monday: { enabled: true, timeRanges: [{ start: '09:00', end: '18:00' }] },
            tuesday: { enabled: true, timeRanges: [{ start: '09:00', end: '18:00' }] },
            wednesday: { enabled: true, timeRanges: [{ start: '09:00', end: '18:00' }] },
            thursday: { enabled: true, timeRanges: [{ start: '09:00', end: '18:00' }] },
            friday: { enabled: true, timeRanges: [{ start: '09:00', end: '18:00' }] },
            saturday: { enabled: true, timeRanges: [{ start: '09:00', end: '14:00' }] }
        },
        sessionDuration: 60,
        minDaysAdvance: 1,
        maxDaysAdvance: 30,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'setup-script'
    };

    await db.collection('availability_config').doc('default').set(availabilityConfig);
    console.log('✅ Disponibilidad configurada (Lun-Vie 9-18hs, Sab 9-14hs, sesiones de 60 min)');

    // Configuración de precios
    await db.collection('pricing_config').doc('default').set({
        individual: 10000,
        currency: 'ARS',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'setup-script'
    });
    console.log('✅ Precio configurado: $10.000 ARS');

    console.log('\n🎉 ¡Firestore configurado correctamente! El sistema ya puede mostrar horarios.');
    process.exit(0);
}

setup().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
