const ExcelJS = require('exceljs');

async function exportarRegistros(registros) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registros');

    // Definir las columnas
    worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Cedula', key: 'cedula', width: 15 },
            { header: 'Cargo', key: 'cargo', width: 20 },
            { header: 'Area', key: 'area', width: 20 },
            { header: 'Fecha Ingreso', key: 'fecha_ingreso', width: 15 },
            { header: 'Hora Ingreso', key: 'hora_ingreso', width: 15 },
            { header: 'Fecha Salida', key: 'fecha_salida', width: 15 },
            { header: 'Hora Salida', key: 'hora_salida', width: 15 },
            { header: 'Estado', key: 'estado', width: 10 }
    ];

    // Estilo para el encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667EEA' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // agregar datos
    registros.forEach(reg => {
        const fechaIngreso = new Date(reg.fecha_ingreso);
        const fechaSalida = reg.fecha_salida ? new Date(reg.fecha_salida) : null;

        worksheet.addRow({
            id: reg.id,
            nombre: reg.Personal ? reg.Personal.nombre : '',
            cedula: reg.Personal ? reg.Personal.cedula : '',
            cargo: reg.Personal ? reg.Personal.cargo : '',
            area: reg.Personal ? reg.Personal.area : '',
            fecha_ingreso: fechaIngreso.toLocaleDateString(),
            hora_ingreso: fechaIngreso.toLocaleTimeString(),
            fecha_salida: fechaSalida ? fechaSalida.toLocaleDateString() : '',
            hora_salida: fechaSalida ? fechaSalida.toLocaleTimeString() : '',
            estado: fechaSalida ? 'SALIDA' : 'INGRESO'
        });
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

module.exports = { exportarRegistros };