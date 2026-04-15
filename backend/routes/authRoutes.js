const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Login 

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }

        // Verificar si esta activo
        if (!usuario.activo) {
            return res.json({
                success: false,
                message: 'Usuario inactivo'
            });
        }

        // verificar contrasena
        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) {
            return res.json({ 
                success: false, 
                message: 'Contraseña incorrecta' 
            });
        }

        // Generar token
        const token = jwt.sign(
            { 
                id: usuario.id, 
                email: usuario.email, 
                rol: usuario.rol 
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.log('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor' 
        });
    }
});

// Veririfcar token para mantener sesion
router.get('/verificar', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.json({ success: false, message: 'No hay token' });
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const usuario = await Usuario.findByPk(verified.id, {
            attributes: ['id', 'nombre', 'email', 'rol']
        });

        if (!usuario) {
            return res.json({ success: false, message: 'Usuario no existe'});
        }

        res.json({ success: true, usuario });

    } catch (error) {
        res.json({ success: false, message: 'Token invalido' });
    }
});

module.exports = router;