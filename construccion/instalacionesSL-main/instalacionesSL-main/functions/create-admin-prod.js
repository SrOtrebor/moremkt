require('dotenv').config();
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Usar las credenciales del service account que están en el .env
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: 'instalacione-2a21b',
            clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: process.env.GOOGLE_PRIVATE_KEY
                ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
                : ''
        })
    });
}

const db = admin.firestore();

async function createAdmin() {
    const email = 'instalacionessl.ar@gmail.com';
    const password = 'Admin2024!';
    const name = 'Administrador';

    console.log('\n🔐 Creando usuario administrador en PRODUCCIÓN...\n');

    // Verificar si ya existe
    const existingUser = await db.collection('admin_users')
        .where('email', '==', email)
        .limit(1)
        .get();

    if (!existingUser.empty) {
        console.log(`⚠️  Ya existe un usuario con el email: ${email}`);
        console.log('🔄 Actualizando contraseña...');
        const passwordHash = await bcrypt.hash(password, 10);
        await existingUser.docs[0].ref.update({ passwordHash, name });
        console.log('✅ Contraseña actualizada correctamente');
    } else {
        const passwordHash = await bcrypt.hash(password, 10);
        const userRef = await db.collection('admin_users').add({
            name,
            email,
            passwordHash,
            role: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Usuario admin creado con éxito!');
        console.log('🆔 ID:', userRef.id);
    }

    console.log('\n📧 Email:', email);
    console.log('🔑 Contraseña: Admin2024!');
    console.log('\n🔗 Iniciá sesión en: https://instalacionessl.com.ar/admin/login.html\n');
    process.exit(0);
}

createAdmin().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
