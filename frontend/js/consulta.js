console.log('=== CONSULTA.JS CARGADO ===');

let tablaRegistros;

// Función para formatear fecha
function formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString();
}

function formatearHora(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleTimeString();
}

// Función principal para cargar registros
async function cargarRegistros() {
    console.log('=== 1. INICIANDO CARGA DE REGISTROS ===');
    const token = localStorage.getItem('token');
    console.log('Token existe:', !!token);
    
    if (!token) {
        console.log('No hay token, redirigiendo a login');
        window.location.href = 'login.html';
        return;
    }

    try {
        console.log('2. Haciendo fetch a /api/registros');
        const response = await fetch('http://localhost:3000/api/registros', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('3. Response status:', response.status);

        const data = await response.json();
        console.log('4. Datos recibidos:', data);
        console.log('5. data.success:', data.success);
        console.log('6. data.registros:', data.registros);
        console.log('7. Cantidad de registros:', data.registros ? data.registros.length : 0);

        if (data.success && data.registros && data.registros.length > 0) {
            console.log('8. Hay registros, procediendo a llenar tabla');
            
            const tbody = document.querySelector('#tablaRegistros tbody');
            console.log('9. tbody encontrado:', !!tbody);
            
            if (tbody) {
                tbody.innerHTML = '';
                
                data.registros.forEach((reg, index) => {
                    console.log(`10. Procesando registro ${index}:`, reg.id);
                    const row = tbody.insertRow();
                    row.insertCell(0).textContent = reg.id;
                    row.insertCell(1).textContent = reg.Personal ? reg.Personal.nombre : 'N/A';
                    row.insertCell(2).textContent = reg.Personal ? reg.Personal.cedula : 'N/A';
                    row.insertCell(3).textContent = reg.Personal ? reg.Personal.cargo : 'N/A';
                    row.insertCell(4).textContent = reg.Personal ? reg.Personal.area : 'N/A';
                    row.insertCell(5).textContent = formatearFecha(reg.fecha_ingreso);
                    row.insertCell(6).textContent = formatearHora(reg.fecha_ingreso);
                    row.insertCell(7).textContent = formatearFecha(reg.fecha_salida);
                    row.insertCell(8).textContent = formatearHora(reg.fecha_salida);
                    row.insertCell(9).innerHTML = `<span class="badge ${reg.fecha_salida ? 'bg-success' : 'bg-primary'}">${reg.fecha_salida ? 'SALIDA' : 'INGRESO'}</span>`;
                });
                
                console.log('11. Tabla llenada, registros mostrados:', data.registros.length);
                
                // Inicializar DataTable
                if (tablaRegistros) {
                    tablaRegistros.destroy();
                }
                tablaRegistros = $('#tablaRegistros').DataTable({
                    language: { url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/es-ES.json' },
                    order: [[0, 'desc']]
                });
                console.log('12. DataTable inicializada correctamente');
                
                // Llenar select de personal
                const personalSet = new Set();
                data.registros.forEach(reg => {
                    if (reg.Personal && reg.Personal.id) {
                        personalSet.add(JSON.stringify({
                            id: reg.Personal.id,
                            nombre: reg.Personal.nombre
                        }));
                    }
                });
                
                const selectPersonal = document.getElementById('filtroPersonal');
                if (selectPersonal) {
                    selectPersonal.innerHTML = '<option value="">Todos</option>';
                    personalSet.forEach(personalStr => {
                        const personal = JSON.parse(personalStr);
                        selectPersonal.innerHTML += `<option value="${personal.id}">${personal.nombre}</option>`;
                    });
                    console.log('13. Select de personal llenado con', personalSet.size, 'opciones');
                }
            } else {
                console.error('ERROR: No se encontró el elemento tbody');
            }
        } else {
            console.warn('14. No hay registros o data.success es false');
            const tbody = document.querySelector('#tablaRegistros tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="10" class="text-center">No hay registros disponibles</td></tr>';
            }
        }
        
    } catch (error) {
        console.error('❌ ERROR EN CARGA:', error);
        alert('Error al cargar los registros: ' + error.message);
    }
}

// Exportar a Excel
document.getElementById('exportarExcel')?.addEventListener('click', async function() {
    console.log('Exportando a Excel...');
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/api/registros/exportar', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registros_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('✅ Exportacion completada');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al exportar a Excel');
    }
});

// Aplicar filtros
document.getElementById('aplicarFiltros')?.addEventListener('click', function() {
    console.log('Aplicando filtros...');
    if (!tablaRegistros) {
        console.warn('⚠️ tablaRegistros NO está inicializada aún');
        return;
    }
    // ... resto del código de filtros
});

// Limpiar filtros
document.getElementById('limpiarFiltros')?.addEventListener('click', function() {
    console.log('Limpiando filtros...');
    if (!tablaRegistros) {
        console.warn('⚠️ tablaRegistros NO está inicializada aún');
        return;
    }
    // ... resto del código
});

// Cerrar sesión
document.getElementById('logout')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'login.html';
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Iniciando carga...');
    cargarRegistros();
});