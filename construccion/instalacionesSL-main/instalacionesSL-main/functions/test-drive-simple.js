/**
 * Script de prueba simplificado para Google Drive Service
 * No requiere Firestore, solo prueba la API de Drive
 */

require('dotenv').config();
const { google } = require('googleapis');

// Función para obtener cliente de Drive
function getDriveClient() {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

    if (!privateKey || !serviceAccountEmail) {
        throw new Error('Credenciales de Google Service Account no configuradas');
    }

    const auth = new google.auth.JWT(
        serviceAccountEmail,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/drive']
    );

    return google.drive({ version: 'v3', auth });
}

async function testDriveSimple() {
    console.log('🧪 Probando Google Drive API...\\n');

    const testStudent = {
        studentName: 'Cliente de Prueba',
        studentEmail: 'instalacionessl.ar@gmail.com'
    };

    console.log('📧 Estudiante:', testStudent.studentName);
    console.log('📧 Email:', testStudent.studentEmail);
    console.log('');

    try {
        const drive = getDriveClient();

        // 1. Crear carpeta de prueba
        console.log('1️⃣ Creando carpeta de prueba en Drive...');

        const folderMetadata = {
            name: `Instalaciones SL - ${testStudent.studentName}`,
            mimeType: 'application/vnd.google-apps.folder',
            description: `Carpeta de prueba para ${testStudent.studentName}`
        };

        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id, name, webViewLink'
        });

        const folderId = folder.data.id;
        const folderLink = folder.data.webViewLink;

        console.log('✅ Carpeta creada:');
        console.log('   📁 Nombre:', folder.data.name);
        console.log('   🆔 ID:', folderId);
        console.log('   🔗 Link:', folderLink);
        console.log('');

        // 2. Compartir carpeta con el estudiante
        console.log('2️⃣ Compartiendo carpeta con el estudiante...');

        await drive.permissions.create({
            fileId: folderId,
            requestBody: {
                type: 'user',
                role: 'writer',
                emailAddress: testStudent.studentEmail
            },
            sendNotificationEmail: false
        });

        console.log('✅ Carpeta compartida con:', testStudent.studentEmail);
        console.log('');

        // 3. Agregar documento de bienvenida
        console.log('3️⃣ Agregando documento de bienvenida...');

        const welcomeContent = `
Bienvenido/a ${testStudent.studentName} a Instalaciones SL

Esta es tu carpeta personal de materiales de estudio.

¡Éxitos en tu aprendizaje!
        `.trim();

        const fileMetadata = {
            name: 'Bienvenida - Instrucciones.txt',
            parents: [folderId],
            mimeType: 'text/plain'
        };

        const media = {
            mimeType: 'text/plain',
            body: welcomeContent
        };

        await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });

        console.log('✅ Documento de bienvenida agregado');
        console.log('');

        console.log('🎉 ¡Prueba completada exitosamente!');
        console.log('📂 Abre la carpeta en tu navegador:', folderLink);
        console.log('');
        console.log('✨ El servicio de Google Drive está funcionando correctamente.');
        console.log('');
        console.log('⚠️  NOTA: Esta es una carpeta de prueba.');
        console.log('💡 Puedes eliminarla manualmente desde Google Drive si lo deseas.');

        process.exit(0);

    } catch (error) {
        console.error('\\n❌ Error en la prueba:');
        console.error(error.message);
        console.error('\\n📝 Verifica:');
        console.error('   1. Que el archivo .env tenga GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY');
        console.error('   2. Que la Service Account tenga permisos de Google Drive API');
        console.error('   3. Que Google Drive API esté habilitada en el proyecto');
        process.exit(1);
    }
}

// Ejecutar prueba
testDriveSimple();
