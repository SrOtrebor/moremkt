const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'instalacione-2a21b'
});

const db = admin.firestore();

async function setup() {
    console.log('Configurando Firestore de producción...');

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
    console.log('Disponibilidad guardada');

    const pricingConfig = {
        individual: 10000,
        currency: 'ARS',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'setup-script'
    };

    await db.collection('pricing_config').doc('default').set(pricingConfig);
    console.log('Precios guardados');

    console.log('Firestore listo!');
    process.exit(0);
}

setup().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
