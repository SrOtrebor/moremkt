/**
 * Servicio de Google Drive para gestión de carpetas de estudiantes
 * Usa OAuth (igual que Calendar) en lugar de Service Account
 */

const { google } = require('googleapis');
const admin = require('firebase-admin');

/**
 * Obtener cliente de Drive autenticado con OAuth
 */
async function getDriveClient() {
    try {
        const db = admin.firestore();
        const tokensDoc = await db.collection('calendar_oauth_tokens').doc('default').get();

        if (!tokensDoc.exists) {
            throw new Error('OAuth no está conectado. Conecta Google Calendar primero desde el panel de admin.');
        }

        const tokens = tokensDoc.data();

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH_CLIENT_ID,
            process.env.GOOGLE_OAUTH_CLIENT_SECRET,
            process.env.GOOGLE_OAUTH_REDIRECT_URI
        );

        oauth2Client.setCredentials(tokens);

        // Refrescar token si está expirado
        if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            await db.collection('calendar_oauth_tokens').doc('default').update(credentials);
            oauth2Client.setCredentials(credentials);
        }

        return google.drive({ version: 'v3', auth: oauth2Client });
    } catch (error) {
        console.error('❌ Error al obtener cliente de Drive:', error.message);
        throw error;
    }
}

/**
 * Crear carpeta para un estudiante en Google Drive
 * @param {Object} studentData - Datos del estudiante
 * @param {string} studentData.studentName - Nombre del estudiante
 * @param {string} studentData.studentEmail - Email del estudiante
 * @param {string} studentData.bookingId - ID de la reserva
 * @returns {Promise<Object>} - Información de la carpeta creada
 */
async function createStudentFolder(studentData) {
    try {
        const { studentName, studentEmail, bookingId } = studentData;
        const drive = getDriveClient();

        // Nombre de la carpeta: "Estudiante - Nombre"
        const folderName = `Instalaciones SL - ${studentName}`;

        // Verificar si ya existe una carpeta para este estudiante
        const existingFolder = await findStudentFolder(studentEmail);
        if (existingFolder) {
            console.log('✅ Carpeta ya existe para:', studentEmail);
            return existingFolder;
        }

        // Crear carpeta
        const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            description: `Carpeta de materiales para ${studentName} (${studentEmail})`
        };

        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id, name, webViewLink'
        });

        const folderId = folder.data.id;
        const folderLink = folder.data.webViewLink;

        console.log('✅ Carpeta creada:', folderName);
        console.log('📁 ID:', folderId);
        console.log('🔗 Link:', folderLink);

        // Compartir carpeta con el estudiante (editor)
        await drive.permissions.create({
            fileId: folderId,
            requestBody: {
                type: 'user',
                role: 'writer',
                emailAddress: studentEmail
            },
            sendNotificationEmail: false
        });

        console.log('✅ Carpeta compartida con:', studentEmail);

        // Guardar referencia en Firestore
        const db = admin.firestore();
        await db.collection('student_folders').doc(studentEmail).set({
            studentName,
            studentEmail,
            folderId,
            folderLink,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: bookingId
        });

        return {
            folderId,
            folderLink,
            folderName
        };

    } catch (error) {
        console.error('❌ Error al crear carpeta de Drive:', error);
        throw error;
    }
}

/**
 * Buscar carpeta existente de un estudiante
 * @param {string} studentEmail - Email del estudiante
 * @returns {Promise<Object|null>} - Información de la carpeta o null
 */
async function findStudentFolder(studentEmail) {
    try {
        const db = admin.firestore();
        const folderDoc = await db.collection('student_folders').doc(studentEmail).get();

        if (folderDoc.exists) {
            const data = folderDoc.data();
            return {
                folderId: data.folderId,
                folderLink: data.folderLink,
                folderName: data.folderName || `Instalaciones SL - ${data.studentName}`
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Error al buscar carpeta:', error);
        return null;
    }
}

/**
 * Obtener o crear carpeta para un estudiante
 * @param {Object} studentData - Datos del estudiante
 * @returns {Promise<Object>} - Información de la carpeta
 */
async function getOrCreateStudentFolder(studentData) {
    // Primero intentar buscar carpeta existente
    const existingFolder = await findStudentFolder(studentData.studentEmail);

    if (existingFolder) {
        console.log('📁 Usando carpeta existente para:', studentData.studentEmail);
        return existingFolder;
    }

    // Si no existe, crear nueva
    console.log('📁 Creando nueva carpeta para:', studentData.studentEmail);
    return await createStudentFolder(studentData);
}

/**
 * Agregar archivo de bienvenida a la carpeta del estudiante
 * @param {string} folderId - ID de la carpeta
 * @param {string} studentName - Nombre del estudiante
 */
async function addWelcomeDocument(folderId, studentName) {
    try {
        const drive = getDriveClient();

        const welcomeContent = `
Bienvenido/a ${studentName} a Instalaciones SL

Esta es tu carpeta personal de materiales de estudio.

Aquí podrás:
- Subir tus trabajos prácticos para corrección
- Acceder a material técnico compartido por la administración
- Guardar apuntes y recursos de las clases

Instrucciones:
1. Sube tus trabajos en formato Google Docs o PDF
2. Nombra los archivos claramente (ej: "TP1 - Introducción al Derecho")
3. El personal técnico revisará y comentará directamente en los documentos

¡Éxitos en tu aprendizaje!

---
Instalaciones SL - Servicios Técnicos y Climatización
https://instalacionessl.com.ar
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

    } catch (error) {
        console.error('⚠️ Error al agregar documento de bienvenida:', error.message);
        // No fallar si esto falla
    }
}

module.exports = {
    createStudentFolder,
    findStudentFolder,
    getOrCreateStudentFolder,
    addWelcomeDocument
};
