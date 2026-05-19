const https = require('https');
const path = require('path');
const os = require('os');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Leer el token de Firebase CLI
const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens.access_token;

const PROJECT_ID = 'instalacione-2a21b';
const COLLECTION = 'admin_users';

async function makeRequest(method, path, body) {
    return new Promise(async (resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'firestore.googleapis.com',
            path: path,
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(responseData) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function createAdmin() {
    const email = 'instalacionessl.ar@gmail.com';
    const password = 'Admin2024!';
    const name = 'Administrador';

    console.log('\n🔐 Creando usuario admin en Firestore (via REST API)...\n');

    // Primero buscar si ya existe
    const queryPath = `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
    const queryBody = {
        structuredQuery: {
            from: [{ collectionId: COLLECTION }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'email' },
                    op: 'EQUAL',
                    value: { stringValue: email }
                }
            },
            limit: 1
        }
    };

    const queryResult = await makeRequest('POST', queryPath, queryBody);

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    const now = new Date().toISOString();
    const docBody = {
        fields: {
            name: { stringValue: name },
            email: { stringValue: email },
            passwordHash: { stringValue: passwordHash },
            role: { stringValue: 'admin' },
            createdAt: { timestampValue: now }
        }
    };

    // Verificar si ya existe
    const docs = queryResult.data;
    if (docs && docs[0] && docs[0].document) {
        // Ya existe, actualizar contraseña
        const docName = docs[0].document.name;
        console.log('⚠️  Ya existe un admin con ese email. Actualizando contraseña...');
        const updatePath = `/v1/${docName}?updateMask.fieldPaths=passwordHash&updateMask.fieldPaths=name`;
        const updateResult = await makeRequest('PATCH', updatePath, {
            fields: {
                passwordHash: { stringValue: passwordHash },
                name: { stringValue: name }
            }
        });
        if (updateResult.status === 200) {
            console.log('✅ Contraseña actualizada correctamente!');
        } else {
            console.log('❌ Error al actualizar:', JSON.stringify(updateResult.data, null, 2));
        }
    } else {
        // Crear nuevo
        const createPath = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`;
        const createResult = await makeRequest('POST', createPath, docBody);
        if (createResult.status === 200) {
            console.log('✅ Usuario admin creado con éxito!');
        } else {
            console.log('❌ Error al crear:', JSON.stringify(createResult.data, null, 2));
            return;
        }
    }

    console.log('\n📧 Email:', email);
    console.log('🔑 Contraseña: Admin2024!');
    console.log('\n🔗 Iniciá sesión en: https://instalacionessl.com.ar/admin/login.html\n');
}

createAdmin().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
