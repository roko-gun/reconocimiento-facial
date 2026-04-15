const express = require('express');
const router = express.Router();
const Personal = require('../models/Personal');
const authMiddleware = require('../middleware/authMiddleware');

// todasl rutas requieren autenticacion
router.use(authMiddleware);

// Obtener todo el personal
router.get('/', async (req, res) => {
    try {
        const personal = await Personal.findAll({
            where: { activo: true },
            order: [['nombre', 'ASC']]
        });
        res.json({ success: true, personal });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Obtener personal por ID
router.get('/:id', async (req, res) => {
    try {
        const personal = await Personal.findByPk(req.params.id);
        if (!personal) {
            return res.json({ 
                success: false, 
                message: 'Personal no encontrado' 
            });
        }
        res.json({ success: true, personal });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Crear Nuevo personal
router.post('/', async (req, res) => {
    try {
        const { nombre, cedula, cargo, area } = req.body;

        // verificar si ya existe la cedula del usuario
        const existe = await Personal.findOne({ where: { cedula } });
        if (existe) {
            return res.json({
                success: false,
                message: 'ya existe un registro con esta cedula'
            });
        }

        const personal = await Personal.create({
            nombre,
            cedula,
            cargo,
            area,
            activo: true
        });

        res.json({
            success: true,
            personal_id: personal.id,
            message: 'Personal Registrado exitosamente'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Actualizar personal
router.put('/:id', async (req, res) => {
    try {
        const personal = await Personal.findByPk(req.params.id);
        if (!personal) {
            return res.json({
                success: false,
                message: 'Personal no encontrado'
            });
        }

        await personal.update(req.body);
        res.json({
            success: true,
            personal,
            message: 'Personal actualizado correctamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Eliminar personal o desactivar
router.delete('/:id', async (req, res) => {
    try {
        const personal = await Personal.findByPk(req.params.id);
        if (!personal) {
            return res.json({
                success: false,
                message: 'Personal no encontrado'
            });
        }

        await personal.update({ activo: false });
        res.json({
            success: true,
            message: 'Personal desactivado exitosamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    } 
});

module.exports = router;