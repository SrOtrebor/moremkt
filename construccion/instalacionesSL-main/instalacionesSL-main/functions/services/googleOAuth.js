const { google } = require('googleapis');
const admin = require('firebase-admin');

// Obtener instancia de Firestore (admin ya está inicializado en index.js)
function getDb() {
    return admin.firestore();
}

/**
 * Determina la redirect URI según el entorno
 * @param {string} baseUrl - URL base de la aplicación
 * @returns {string} Redirect URI apropiada
 */
function getRedirectUri(baseUrl) {
    // Detectar si es entorno local (localhost o 127.0.0.1)
    const isLocal = baseUrl && (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1'));
    return isLocal
        ? 'http://localhost:5000/admin/calendar/callback'
        : 'https://instalacionessl.com.ar/admin/calendar/callback';
}

/**
 * Genera la URL de autorización de Google OAuth
 * @param {string} baseUrl - URL base de la aplicación (para determinar redirect URI)
 * @returns {string} URL para redireccionar al usuario
 */
function getAuthUrl(baseUrl) {
    const redirectUri = getRedirectUri(baseUrl);

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirectUri
    );

    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/drive.file' // Permiso para crear y gestionar archivos en Drive
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Necesario para obtener refresh_token
        scope: scopes,
        prompt: 'consent' // Forzar pantalla de consentimiento para obtener refresh_token
    });

    console.log('🔗 URL de autorización generada para:', redirectUri);
    return authUrl;
}

/**
 * Maneja el callback de OAuth y guarda los tokens
 * @param {string} code - Código de autorización de Google
 * @param {string} baseUrl - URL base para determinar redirect URI
 * @returns {Promise<void>}
 */
async function handleOAuthCallback(code, baseUrl) {
    try {
        const redirectUri = getRedirectUri(baseUrl);

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH_CLIENT_ID,
            process.env.GOOGLE_OAUTH_CLIENT_SECRET,
            redirectUri
        );

        console.log('🔍 DEBUG - Redirect URI usada:', redirectUri);
        console.log('🔍 DEBUG - Base URL recibida:', baseUrl);
        console.log('🔍 DEBUG - Client ID:', process.env.GOOGLE_OAUTH_CLIENT_ID);

        // Intercambiar código por tokens
        const { tokens } = await oauth2Client.getToken(code);

        console.log('✅ Tokens obtenidos exitosamente');
        console.log('Access Token:', tokens.access_token ? 'Presente' : 'Ausente');
        console.log('Refresh Token:', tokens.refresh_token ? 'Presente' : 'Ausente');

        // Guardar tokens en Firestore
        const db = getDb();
        await db.collection('calendar_oauth_tokens').doc('default').set({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
            token_type: tokens.token_type,
            scope: tokens.scope,
            updatedAt: Date.now()
        });

        console.log('✅ Tokens guardados en Firestore');

    } catch (error) {
        console.error('❌ Error en handleOAuthCallback:', error.message);
        throw new Error(`Error al procesar autorización: ${error.message}`);
    }
}

/**
 * Obtiene un cliente OAuth autenticado de Google Calendar
 * Refresca automáticamente el access_token si expiró
 * @param {string} baseUrl - URL base para determinar redirect URI (opcional)
 * @returns {Promise<google.calendar_v3.Calendar>}
 */
async function getOAuthClient(baseUrl = 'https://instalacionessl.com.ar') {
    try {
        // Obtener tokens de Firestore
        const db = getDb();
        const tokensDoc = await db.collection('calendar_oauth_tokens').doc('default').get();

        if (!tokensDoc.exists) {
            throw new Error('No hay tokens OAuth guardados. Conecta Google Calendar primero.');
        }

        const tokens = tokensDoc.data();
        const redirectUri = getRedirectUri(baseUrl);

        // Crear cliente OAuth
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH_CLIENT_ID,
            process.env.GOOGLE_OAUTH_CLIENT_SECRET,
            redirectUri
        );

        // Configurar tokens
        oauth2Client.setCredentials({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
            token_type: tokens.token_type,
            scope: tokens.scope
        });

        // Configurar auto-refresh
        oauth2Client.on('tokens', async (newTokens) => {
            console.log('🔄 Tokens refrescados automáticamente');

            // Actualizar tokens en Firestore
            const db = getDb();
            await db.collection('calendar_oauth_tokens').doc('default').update({
                access_token: newTokens.access_token,
                expiry_date: newTokens.expiry_date,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        // Crear cliente de Calendar
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        console.log('✅ Cliente OAuth de Google Calendar autenticado');
        return calendar;

    } catch (error) {
        console.error('❌ Error al obtener cliente OAuth:', error.message);
        throw error;
    }
}

/**
 * Verifica si hay tokens OAuth guardados
 * @returns {Promise<boolean>}
 */
async function isOAuthConnected() {
    try {
        const db = getDb();
        const tokensDoc = await db.collection('calendar_oauth_tokens').doc('default').get();
        return tokensDoc.exists;
    } catch (error) {
        console.error('Error al verificar conexión OAuth:', error);
        return false;
    }
}

/**
 * Desconecta OAuth eliminando los tokens
 * @returns {Promise<void>}
 */
async function disconnectOAuth() {
    try {
        const db = getDb();
        await db.collection('calendar_oauth_tokens').doc('default').delete();
        console.log('✅ OAuth desconectado correctamente');
    } catch (error) {
        console.error('❌ Error al desconectar OAuth:', error.message);
        throw error;
    }
}

module.exports = {
    getAuthUrl,
    handleOAuthCallback,
    getOAuthClient,
    isOAuthConnected,
    disconnectOAuth
};
