const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/database');
const Usuario = require('./models/Usuario');
const Personal = require('./models/Personal');
const Registro = require('./models/Registro');
const { start } = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos (fotos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// configurar relaciones
Personal.hasMany(Registro, { foreignKey: 'personal_id' });
Registro.belongsTo(Personal, { foreignKey: 'personal_id' });

// Rutas 
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/personal', require('./routes/personalRoutes'));
app.use('/api/registros', require('./routes/registroRoutes'));

// Ruta de prueba básica
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Servidor de Reconocimiento Facial funcionando',
        database: process.env.DB_NAME || 'face_staff',
        status: 'online',
        timestamp: new Date().toISOString(),
    });
});

// Ruta de prueba para verificar API
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ API funcionando correctamente',
        serverTime: new Date().toISOString()
    });
});

// Ruta para probra conexion a BD
app.get('/api/test-db', async (req, res) => {
    try {
        const personal = await Personal.findAll({ limit: 5 });
        res.json({
            success: true,
            message: 'Conexion a BD exitosa',
            data: personal
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Middleware para manejar errores 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.url}`
    });
});

// Sincronizar modelos con BD
sequelize.sync({ alter: false })
    .then(() => {
        console.log('✅ Modelos sincronizados con la basede datos');

        return Usuario.findOrCreate({
            where: { email: 'admin@sistema.com' },
            defaults: {
                nombre: 'Administrador',
                email: 'admin@sistema.com',
                password: 'adso3070411',
                rol: 'admin',
                activo: true
            }
        });
    })
    .then(([Usuario, created]) => {
        if (created) {
            console.log('✅ Usuario administrador creado');
        } else {
            console.log('✅ Usuario administrador ya existe');
        }

        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════╗
║   🚀 SERVICIO DE RECONOCIMIENTO FACIAL             ║
╠════════════════════════════════════════════════════╣
║   Servidor: http://localhost:${PORT}               ║
║   Base de datos: ${process.env.DB_NAME}            ║
║   Estado: ✅ Conectado                             ║
╚════════════════════════════════════════════════════╝
            `);
        });
    })
    .catch(err => {
        console.error('❌ Error al conectar con la base de datos:', err.message);
    });

