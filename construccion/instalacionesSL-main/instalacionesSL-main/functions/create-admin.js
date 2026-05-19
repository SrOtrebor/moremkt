require('dotenv').config();
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Inicializar Firebase Admin para emuladores
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'instalacione-2a21b'
    });
}

// Configurar para usar emulador de Firestore SOLO si la variable está definida
// Para usar en PRODUCCIÓN: ejecuta con USE_PRODUCTION=true node create-admin.js
if (process.env.USE_PRODUCTION !== 'true') {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    console.log('🔧 Usando EMULADOR local (localhost:8080)');
} else {
    console.log('🌐 Usando PRODUCCIÓN (Firestore real)');
}

const db = admin.firestore();

// Crear interfaz para input del usuario
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
    try {
        console.log('\n🔐 Crear Usuario Administrador\n');

        // Solicitar datos
        const name = await question('Nombre completo: ');
        const email = await question('Email: ');
        const password = await question('Contraseña: ');

        if (!name || !email || !password) {
            console.error('❌ Todos los campos son requeridos');
            rl.close();
            return;
        }

        // Verificar si el email ya existe
        const existingUser = await db.collection('admin_users')
            .where('email', '==', email)
            .limit(1)
            .get();

        if (!existingUser.empty) {
            console.error(`❌ Ya existe un usuario con el email: ${email}`);
            rl.close();
            return;
        }

        // Hashear contraseña
        console.log('\n🔒 Hasheando contraseña...');
        const passwordHash = await bcrypt.hash(password, 10);

        // Crear usuario en Firestore
        console.log('💾 Guardando usuario en Firestore...');
        const userRef = await db.collection('admin_users').add({
            name: name,
            email: email,
            passwordHash: passwordHash,
            role: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('\n✅ Usuario administrador creado exitosamente!\n');
        console.log('📧 Email:', email);
        console.log('👤 Nombre:', name);
        console.log('🆔 ID:', userRef.id);
        console.log('\n🔗 Puedes iniciar sesión en: http://localhost:5000/admin/login.html\n');

        rl.close();
    } catch (error) {
        console.error('\n❌ Error al crear usuario:', error.message);
        rl.close();
    }
}

// Ejecutar
createAdminUser();
