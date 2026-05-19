/**
 * Script para inicializar Firestore con datos iniciales
 * Ejecutar una sola vez: node init-firestore.js
 */

const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

async function initializeFirestore() {
    console.log('🚀 Inicializando Firestore...\n');

    try {
        // ============================================
        // 1. CREAR USUARIOS ADMIN
        // ============================================
        console.log('👥 Creando usuarios admin...');

        const admins = [
            {
                email: 'laforcada@gmail.com',
                password: 'admin123',  // CAMBIAR DESPUÉS DEL PRIMER LOGIN
                name: 'Administrador Principal'
            },
            {
                email: 'carlosfiguerero2@gmail.com',
                password: 'carlitos123',  // CAMBIAR DESPUÉS DEL PRIMER LOGIN
                name: 'Carlitos'
            }
        ];

        for (const adminUser of admins) {
            const passwordHash = await bcrypt.hash(adminUser.password, 10);

            await db.collection('admin_users').add({
                email: adminUser.email,
                passwordHash: passwordHash,
                name: adminUser.name,
                role: 'admin',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`  ✅ Usuario creado: ${adminUser.email}`);
            console.log(`     Password temporal: ${adminUser.password}`);
        }

        // ============================================
        // 2. CONFIGURACIÓN DE DISPONIBILIDAD
        // ============================================
        console.log('\n📅 Configurando disponibilidad...');

        const availabilityConfig = {
            weekdays: {
                monday: {
                    enabled: true,
                    timeRanges: [
                        { start: '09:00', end: '12:00' },
                        { start: '16:00', end: '20:00' }
                    ]
                },
                tuesday: {
                    enabled: true,
                    timeRanges: [
                        { start: '09:00', end: '12:00' },
                        { start: '16:00', end: '20:00' }
                    ]
                },
                wednesday: {
                    enabled: true,
                    timeRanges: [
                        { start: '09:00', end: '12:00' },
                        { start: '16:00', end: '20:00' }
                    ]
                },
                thursday: {
                    enabled: true,
                    timeRanges: [
                        { start: '09:00', end: '12:00' },
                        { start: '16:00', end: '20:00' }
                    ]
                },
                friday: {
                    enabled: true,
                    timeRanges: [
                        { start: '09:00', end: '12:00' },
                        { start: '16:00', end: '20:00' }
                    ]
                },
                saturday: { enabled: false, timeRanges: [] },
                sunday: { enabled: false, timeRanges: [] }
            },
            sessionDuration: 60, // minutos
            minDaysAdvance: 1,
            maxDaysAdvance: 30,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'system'
        };

        await db.collection('availability_config').doc('default').set(availabilityConfig);
        console.log('  ✅ Horarios configurados: Lun-Vie 09:00-12:00 y 16:00-20:00');

        // ============================================
        // 3. CONFIGURACIÓN DE PRECIOS
        // ============================================
        console.log('\n💰 Configurando precios...');

        const pricingConfig = {
            individual: 8000,
            pack4: 28000,
            pack8: 52000,
            currency: 'ARS',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'system'
        };

        await db.collection('pricing_config').doc('default').set(pricingConfig);
        console.log('  ✅ Sesión individual: $8,000');
        console.log('  ✅ Pack 4 sesiones: $28,000');
        console.log('  ✅ Pack 8 sesiones: $52,000');

        // ============================================
        // RESUMEN
        // ============================================
        console.log('\n✨ Inicialización completada!\n');
        console.log('📋 PRÓXIMOS PASOS:');
        console.log('1. Inicia sesión en /admin con:');
        console.log('   - laforcada@gmail.com / admin123');
        console.log('   - carlosfiguerero2@gmail.com / carlitos123');
        console.log('2. CAMBIA las contraseñas inmediatamente');
        console.log('3. Ajusta los horarios desde el panel si es necesario');
        console.log('4. Configura las integraciones de Google y Mercado Pago\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        process.exit(1);
    }
}

initializeFirestore();
