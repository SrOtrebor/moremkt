const http = require('http');

// Primero solicitar un magic link
const requestOptions = {
    hostname: 'localhost',
    port: 5001,
    path: '/instalacione-2a21b/us-central1/api/student/request-access',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const requestData = JSON.stringify({
    email: 'laforcada@gmail.com'
});

console.log('Solicitando magic link...\n');

const req = http.request(requestOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        console.log('\n✅ Magic link enviado!');
        console.log('📧 Revisa el email y copia el token de la URL');
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(requestData);
req.end();
