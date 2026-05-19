const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxhZm9yY2FkYUBnbWFpbC5jb20iLCJ0eXBlIjoibWFnaWMtbGluayIsImlhdCI6MTc2ODUyMDMxMywiZXhwIjoxNzY4NTIxMjEzfQ.T24ZS2n100Ev0fAKz8z5o2FlU4eLo9iwT5d4RdDRb5s';

const requestOptions = {
    hostname: 'localhost',
    port: 5001,
    path: '/instalacione-2a21b/us-central1/api/student/verify-token',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const requestData = JSON.stringify({ token });

console.log('Verificando token...\n');

const req = http.request(requestOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        console.log('\nResponse Body:');
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.write(requestData);
req.end();
