const bcrypt = require('bcryptjs');

async function generateHashes() {
    console.log('\n🔐 Generando hashes de contraseñas para producción\n');

    const users = [
        {
            name: 'Administrador',
            email: 'admin@instalacionessl.com.ar',
            password: 'InstalacionesSL2024*'
        },
        {
            name: 'Roberto Laforcada',
            email: 'laforcada@gmail.com',
            password: 'InstalacionesSL2025*'
        }
    ];

    for (const user of users) {
        const hash = await bcrypt.hash(user.password, 10);
        console.log(`\n👤 ${user.name}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔒 Password Hash:`);
        console.log(hash);
        console.log('\n' + '='.repeat(80));
    }

    console.log('\n✅ Copia estos hashes y úsalos en Firebase Console\n');
}

generateHashes();
