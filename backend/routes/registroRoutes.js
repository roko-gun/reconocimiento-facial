const  express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Registro = require('../models/Registro');
const Personal = require('../models/Personal');
const authMiddleware = require('../middleware/authMiddleware');
const excelExporter = require('../utils/excelExporter');

router.use(authMiddleware);

//registrar ingreso
router.post('/ingreso', async (req, res) => {
    try {
        const { personal_id, observaciones } = req.body;
        
        // verificar si el personal existe y esta activo
        const personal = await Personal.findByPk(personal_id);
        if (!personal || !personal.activo) {
            return res.json({
                success: false,
                message: 'Personal no existe o esta inactivo'
            });
        }

        // Verificar si ya tiene un ingreso sin salida
        const ingresoActivo = await Registro.findOne({
            where: {
                personal_id,
                fecha_salida: null
            }
        });

        if (ingresoActivo) {
            return res.json({
                success: false,
                message: 'El personal ya tiene un registro activo'
            });
        }


        const registro = await Registro.create({
            personal_id,
            fecha_ingreso: new Date(),
            tipo: 'ingreso',
            observaciones: observaciones || 'Ingreso por reconocimiento facial'
        });

        res.json({ 
            success: true, 
            registro,
            message: 'Ingreso registrado exitosamente'
         });

    } catch (error) {
        console.error('Error', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Registrar la salida
router.post('/salida', async (req, res) => {
    try {
        const { personal_id, observaciones } = req.body;
                
        const registro = await Registro.findOne ({
            where: {
                personal_id,
                fecha_salida: null
            }
        });

        if (!registro) {
            return res.json({
                success: false,
                message: 'No hay ingreso activo para este personal'
            });
        }

        registro.fecha_salida = new Date();
        registro.tipo = 'salida';
        registro.observaciones = registro.observaciones
            ? `${registro.observaciones} | Salida: ${observaciones || 'Salida por reconocimiento facial'}`
            : `Salida: ${observaciones || 'Salida por reconocimiento facial'}`;

        await registro.save();

        res.json({ 
            success: true, 
            registro,
            message: 'Salida registrada exitosamente' 
        });
        
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Obtener todos los registros 
router.get('/', async (req, res) => {
    try {
        const registros = await Registro.findAll({
            include: [{
                model: Personal,
                attributes: ['id', 'nombre', 'cedula', 'cargo', 'area']
            }],
            order: [['fecha_ingreso', 'DESC']]
        });
        res.json({ success: true, registros });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Obtener registros del dia
router.get('/dia', async (req, res) => {
    try {
        const { fecha } = req.query;
        const fechaBuscar = fecha ? new Date(fecha) : new Date();

        const fechaInicio = new Date(fecha);
        fechaInicio.setHours(0, 0, 0, 0);

        const fechaFin = new Date(fechaBuscar);
        fechaFin.setHours(23, 59, 59, 999);

        const registros = await Registro.findAll({
            where: {
                fecha_ingreso: {
                    [Op.between]: [fechaInicio, fechaFin]
                }
            },
            include: [{
                model: Personal,
                attributes: ['id', 'nombre', 'cedula', 'cargo', 'area']
            }],
            order: [['fecha_ingreso', 'DESC']]
        });
        
        res.json({ success: true, registros });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Obtener personal dentro
router.get('/dentro', async (req, res) => {
    try {
        const registros = await Registro.findAll({
            where: { fecha_salida: null},
            include: [{
                model: Personal,
                attributes: ['id', 'nombre', 'cedula', 'cargo', 'area']
            }],
            order: [['fecha_ingreso', 'ASC']]
        });

        res.json({ success: true, registros });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Exportar Excel
router.get('/exportar', async (req, res) => {
    try {
        const registros = await Registro.findAll({
            include: [{
                model: Personal,
                attributes: ['id', 'nombre', 'cedula', 'cargo', 'area']
            }],
            order: [['fecha_ingreso', 'DESC']]
        });

        const excelBuffer = await excelExporter.exportarRegistros(registros);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=registros.xlsx');
        res.setHeader('Content-Length', excelBuffer.length);
        res.send(excelBuffer);

    } catch (error) {
        console.error('Error exportando', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;