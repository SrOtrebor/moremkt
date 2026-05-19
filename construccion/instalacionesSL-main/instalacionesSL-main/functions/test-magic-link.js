// Test del endpoint verify-token
const fetch = require('node-fetch');

async function testVerifyToken() {
    // Primero, solicitar un magic link
    console.log('1. Solicitando magic link...');
    const requestResponse = await fetch('http://localhost:5001/instalacione-2a21b/us-central1/api/student/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'laforcada@gmail.com' })
    });

    const requestData = await requestResponse.json();
    console.log('Respuesta:', requestData);

    if (!requestResponse.ok) {
        console.error('Error al solicitar magic link');
        return;
    }

    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Ahora necesitamos extraer el token del email (simulado)
    // En realidad, el token está en el link del email
    console.log('\n2. Para probar, genera un token manualmente...');
    console.log('Revisa el email y copia el token de la URL');
}

testVerifyToken().catch(console.error);
