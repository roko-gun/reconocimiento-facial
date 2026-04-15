const sequelize = require('./config/database');
const Usuario = require('./models/Usuario');
const bcrypt = require('bcryptjs');

async function crearUsuario() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a la base de datos');
        
        const email = 'admin@sistema.com';
        const password = 'adso3070411';
        
        // Encriptar contraseña correctamente
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        console.log('📝 Hash generado:', hashedPassword);
        console.log('📏 Longitud del hash:', hashedPassword.length);
        
        // Buscar si ya existe
        let usuario = await Usuario.findOne({ where: { email } });
        
        if (usuario) {
            // Actualizar
            usuario.password = hashedPassword;
            await usuario.save();
            console.log('✅ Usuario actualizado correctamente');
        } else {
            // Crear nuevo
            usuario = await Usuario.create({
                nombre: 'Administrador',
                email: email,
                password: password,  // El hook beforeCreate lo encriptará
                rol: 'admin',
                activo: true
            });
            console.log('✅ Usuario creado correctamente');
        }
        
        console.log('\n📋 CREDENCIALES:');
        console.log(`   Email: ${email}`);
        console.log(`   Contraseña: ${password}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

crearUsuario();