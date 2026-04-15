let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let stream = null;
let personaReconocida = null;

// Verificar autenticacion
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Mostrar Nombre del usuario
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    document.getElementById('userName').textContent = usuario.nombre || 'Administrador';

    // Cargar estadisticas
    cargarEstadisticas();
});

// cargar estadisticas
async function cargarEstadisticas() {
    const token = localStorage.getItem('token');

    try {
        // Total Personal
        const personalResponse = await fetch('http://localhost:3000/api/personal', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const personalData = await personalResponse.json();
        document.getElementById('totalPersonal').textContent = personalData.personal?.length || 0;

        // personal dentro
        const dentroResponse = await fetch('http://localhost:3000/api/registros/dentro', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dentroData = await dentroResponse.json();
        document.getElementById('personalDentro').textContent = dentroData.registros?.length || 0;

        // Registros hoy
        const hoy = new Date().toISOString().split('T')[0];
        const registrosResponse = await fetch(`http://localhost:3000/api/registros/dia?fecha=${hoy}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const registrosData = await registrosResponse.json();

        let ingresos = 0;
        let salidas = 0;

        if (registrosData.registros) {
            registrosData.registros.forEach(reg => {
                if (reg.fecha_salida) {
                    salidas++;
                } else {
                    ingresos++;
                }
            });
        }

        document.getElementById('ingresosHoy').textContent = ingresos;
        document.getElementById('salidasHoy').textContent = salidas;
    
    } catch (error) {
        console.error('Error cargando estadisticas:', error);
    }
}

// Iniciar camara
document.getElementById('iniciarCamara').addEventListener('click', async function() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.play();

            document.getElementById('iniciarCamara').disabled = true;
            document.getElementById('reconocerRostro').disabled = false;

        } catch (error) {
            console.error('Error al acceder a la camara:', error);
            alert("No se pudo acceder a la camara");
        }
    }
});

// Reconocer rostro 
document.getElementById('reconocerRostro').addEventListener('click', async function() {
    if (!stream) {
        alert('Primero debe iniciar la camara');
        return;
    }

    // Capturar Frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);


    //Convertir a base64
    const imageData = canvas.toDataURL('image/jpeg');

    const mensajeDiv = document.getElementById('mensajeReconocimiento');
    mensajeDiv.innerHTML = '<div class="alert alert-info">Reconociendo rostro...</div>';

    try {
        const response = await fetch('http://localhost:5000/api/reconocer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });

        const data = await response.json();
        console.log('Respuesta Python:', data);

        if (data.success) {
            //Buscar informacion del personal
            const token = localStorage.getItem('token');
            const personalResponse = await fetch(`http://localhost:3000/api/personal/${data.personal_id}`,{
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (personalResponse.ok) {
                const personalData = await personalResponse.json();
                console.log('Datos completos del personal:', personalData);

                let persona = null;
                if (personalData.personal) {
                    persona = personalData.personal;
                } else if (personalData.success && personalData.personal) {
                    persona = personalData.personal;
                } else {
                    persona = personalData;
                }

                console.log('Persona extraida:', persona);

                if (persona && persona.nombre) {
                    personaReconocida = persona;

                    document.getElementById('personaNombre').textContent = persona.nombre;
                    document.getElementById('personaDetalles').innerHTML = `
                        <strong>Cedula:</strong> ${persona.cedula}<br>
                        <strong>Cargo:</strong> ${persona.cargo}<br>
                        <strong>Area:</strong> ${persona.area}
                    `;

                    document.getElementById('infoReconocimiento').style.display = 'block';
                    mensajeDiv.innerHTML = `<div class="alert alert-success"> ✅ Rostro reconocido con ${Math.round(data.confidence)}% de confianza</div>`;
                } else {
                    mensajeDiv.innerHTML = '<div class="alert alert-warning">⚠️ Personal encontrado pero datos incompletos</div>';
                }
            
            } else {
                const errorText = await personalResponse.text();
                console.error('Error en fetch personal:', errorText);
                mensajeDiv.innerHTML = '<div class="alert alert-warning">Personal no encontrado en BD</div>';
            }
        } else {
            mensajeDiv.innerHTML = '<div class="alert alert-warning"> ❌ Rostro no reconocido</div>';
            document.getElementById('infoReconocimiento').style.display = 'none';
        }

    } catch (error) {
        console.error('Error Detallado', error);
        mensajeDiv.innerHTML = '<div class="alert alert-danger">❌ Error al conectar con el servicio de reconocimiento</div>';
    }
});

// Registar ingreso
document.getElementById('registrarIngreso').addEventListener('click', async function() {
    if (!personaReconocida) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:3000/api/registros/ingreso', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ personal_id: personaReconocida.id })
        }); const data = await response.json();

        if (data.success) {
            alert(`Ingreso registrado para ${personaReconocida.nombre}`);
            document.getElementById('infoReconocimiento').style.display = 'none';
            cargarEstadisticas(); // Actualizar estadisticas
        } else {
            alert('Error: ' + data.message);
        }

    } catch (error) {
        console.error('Error: ', error);
        alert('Error al registrar ingreso');
    }
});

// registrar Salida 
document.getElementById('registrarSalida').addEventListener('click', async function() {
    if (!personaReconocida) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:3000/api/registros/salida', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ personal_id: personaReconocida.id })
        });

        const data = await response.json();

        if (data.success) {
            alert(`Salida registrada para ${personaReconocida.nombre}`);
            document.getElementById('infoReconocimiento').style.display = 'none';
            cargarEstadisticas(); // Actualizar estadisticas
        } else {
            alert('Error: ' + data.message);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Error al registrar la salida');
    }
});

// Cerrar sesion
document.getElementById('logout').addEventListener('click', function(e) {
    e.preventDefault();

    // Detener si esta activa
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    localStorage.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
});

// Limpiar al salir de la pagina 
window.addEventListener('beforeunload', function() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});
