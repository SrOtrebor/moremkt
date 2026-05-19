const admin = require('firebase-admin');

// Inicializar Firebase Admin apuntando al emulador
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({
    projectId: 'instalacione-2a21b'
});

const db = admin.firestore();

async function createTestBooking() {
    try {
        // Crear una reserva de prueba
        const bookingData = {
            studentName: 'Juan Pérez',
            studentEmail: 'laforcada@gmail.com', // Usar tu email real para probar
            studentPhone: '+54 9 11 1234-5678',
            subject: 'Introducción al Derecho',
            package: 'individual',
            date: '2026-01-20',
            time: '16:00',
            status: 'confirmed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            driveFolder: 'https://drive.google.com/drive/folders/ejemplo',
            meetLink: 'https://meet.google.com/abc-defg-hij'
        };

        const docRef = await db.collection('bookings').add(bookingData);
        console.log('✅ Reserva de prueba creada con ID:', docRef.id);
        console.log('📧 Email del estudiante:', bookingData.studentEmail);
        console.log('\n🔗 Ahora puedes probar el magic link en:');
        console.log('   http://localhost:5000/mi-cuenta');
        console.log('\n📝 Ingresa el email:', bookingData.studentEmail);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear reserva:', error);
        process.exit(1);
    }
}

createTestBooking();
