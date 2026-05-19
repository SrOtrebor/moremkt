/**
 * Script de prueba para Google Drive Service
 * Prueba la creación de carpetas para estudiantes
 */

require('dotenv').config();
const admin = require('firebase-admin');
const { getOrCreateStudentFolder, addWelcomeDocument } = require('./services/driveService');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}

async function testDriveService() {
    console.log('🧪 Probando servicio de Google Drive...\\n');

    // Datos de prueba
    const testStudent = {
        studentName: 'Cliente de Prueba',
        studentEmail: 'instalacionessl.ar@gmail.com',
        bookingId: 'test-booking-' + Date.now()
    };

    console.log('📧 Estudiante:', testStudent.studentName);
    console.log('📧 Email:', testStudent.studentEmail);
    console.log('');

    try {
        // 1. Crear o obtener carpeta
        console.log('1️⃣ Creando/obteniendo carpeta de Drive...');
        const folderData = await getOrCreateStudentFolder(testStudent);

        console.log('✅ Carpeta obtenida/creada:');
        console.log('   📁 Nombre:', folderData.folderName);
        console.log('   🆔 ID:', folderData.folderId);
        console.log('   🔗 Link:', folderData.folderLink);
        console.log('');

        // 2. Agregar documento de bienvenida
        console.log('2️⃣ Agregando documento de bienvenida...');
        await addWelcomeDocument(folderData.folderId, testStudent.studentName);
        console.log('✅ Documento de bienvenida agregado');
        console.log('');

        // 3. Verificar que se puede obtener la carpeta existente
        console.log('3️⃣ Verificando que se puede obtener carpeta existente...');
        const existingFolder = await getOrCreateStudentFolder(testStudent);

        if (existingFolder.folderId === folderData.folderId) {
            console.log('✅ Carpeta existente obtenida correctamente');
        } else {
            console.log('⚠️ Se creó una carpeta nueva en lugar de usar la existente');
        }
        console.log('');

        console.log('🎉 ¡Prueba completada exitosamente!');
        console.log('📂 Abre la carpeta en tu navegador:', folderData.folderLink);
        console.log('');
        console.log('✨ El servicio de Google Drive está funcionando correctamente.');

        process.exit(0);

    } catch (error) {
        console.error('\\n❌ Error en la prueba:');
        console.error(error.message);
        console.error('\\n📝 Verifica:');
        console.error('   1. Que el archivo .env tenga GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY');
        console.error('   2. Que la Service Account tenga permisos de Google Drive API');
        console.error('   3. Que Google Drive API esté habilitada en el proyecto');
        console.error('\\nStack trace:');
        console.error(error.stack);
        process.exit(1);
    }
}

// Ejecutar prueba
testDriveService();
