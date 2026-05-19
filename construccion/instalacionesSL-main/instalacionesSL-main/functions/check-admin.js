const path = require('path');
const os = require('os');
const fs = require('fs');
const https = require('https');

// Leer el token de Firebase CLI
const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens.access_token;

const PROJECT_ID = 'instalacione-2a21b';

function makeRequest(method, urlPath, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'firestore.googleapis.com',
            path: urlPath,
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
                try { resolve({ status: res.statusCode, data: JSON.parse(responseData) }); }
                catch (e) { resolve({ status: res.statusCode, data: responseData }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function checkAdmin() {
    const queryPath = `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
    const queryBody = {
        structuredQuery: {
            from: [{ collectionId: 'admin_users' }],
            limit: 10
        }
    };

    const result = await makeRequest('POST', queryPath, queryBody);

    if (result.data && Array.isArray(result.data)) {
        const docs = result.data.filter(r => r.document);
        console.log(`\n📋 Encontré ${docs.length} usuario(s) admin:\n`);
        docs.forEach(r => {
            const d = r.document.fields;
            console.log('--- Usuario ---');
            console.log('Email:', d.email?.stringValue);
            console.log('Nombre:', d.name?.stringValue);
            console.log('Role:', d.role?.stringValue);
            console.log('Hash (primeros 20 chars):', d.passwordHash?.stringValue?.substring(0, 20) + '...');
            console.log('');
        });
    } else {
        console.log('Respuesta:', JSON.stringify(result, null, 2));
    }
}

checkAdmin().catch(err => console.error('Error:', err.message));
