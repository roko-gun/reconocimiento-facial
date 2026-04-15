const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const btnIniciarCamara = document.getElementById('btnIniciarCamara');
const btnCapturar = document.getElementById('btnCapturar');
const btnGuardar = document.getElementById('btnGuardar');
const fotoPreview = document.getElementById('fotoPreview');

let stream = null;
let fotoCapturada = null;

// verificar autentucacion
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debe Iniciar sesion Primero');
        window.location.href = 'login.html';
        return;
    }
});

// Iniciar camara
btnIniciarCamara.addEventListener('click', async function() {
    try {
        // Detener stream anterior si existe
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        await video.play();

        btnIniciarCamara.disabled = true;
        btnCapturar.disabled = false;

        console.log('✅ Camara iniciada correctamente');

    } catch (error) {
        console.error('Error al acceder a la camara:', error);
        alert('No se puede acceder a la camara verifica los permisos.');
        btnIniciarCamara.disabled = false;
        btnCapturar.disabled = true;
    }
});

// capturar foto
btnCapturar.addEventListener('click', function() {
    if (!video.srcObject) {
        alert('Primero debe Iniciar la camara');
        return;
    }

    // configurar el canvas con el tamano del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a base 64
    fotoCapturada = canvas.toDataURL('image/jpeg', 0.9);

    // mostrar preview
    fotoPreview.innerHTML = `
        <div class="mt-3">
            <p class="mb-2">✅ Foto capturada</p>
            <img src="${fotoCapturada}" class="photo-preview" alt="Preview">
        </div>
    `;

    console.log('✅ Foto capturada correctamente');
});

// guardar personal
document.getElementById('registroForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debe iniciar sesion primero');
        window.location.href = 'login.html'
        return;
    }

    if (!fotoCapturada) {
        alert('❌ Debe capturar una foto del rostro primero');
        return;
    }

    const nombre = document.getElementById('nombre').value;
    const cedula = document.getElementById('cedula').value;
    const cargo = document.getElementById('cargo').value;
    const area = document.getElementById('area').value;

    if (!nombre || !cedula || !cargo || !area) {
        alert('❌ Por favor complete todos los campos');
        return;
    }

    // Mostrar Mensaje de carga
    const btnOriginalText = btnGuardar.textContent;
    btnGuardar.textContent = 'Guardando...';
    btnGuardar.disabled = true;

    try {
        // 1. Guardar datos del personal en la base de datos
        const response = await fetch('http://localhost:3000/api/personal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nombre: nombre,
                cedula: cedula,
                cargo: cargo,
                area: area
            })
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);

        if (data.success) {
            // Primero enviatr la  fot de phyton para entrenar el modelo
            console.log('Enviando fota Python...');

            try {
                const fotoResponse = await fetch ('http://localhost:5000/api/capturar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: fotoCapturada,
                        personal_id: data.personal_id
                    })
                });

                const fotoData = await fotoResponse.json();
                console.log('Respuesta de Python:', fotoData);

                if (fotoData.success) {
                    alert(`✅ Personal registrado y modelo facial entrenado!`);
                } else {
                    alert(`⚠️ Personal registrado pero error en reconocimiento facial: ${fotoData.error}`);
                }
            } catch (error) {
                console.error('Error conectando con Python:', error);
                alert(`⚠️ Personal registrado pero servicio Python no disponible`);
            }

            // Limpiar formulario
            document.getElementById('registroForm').reset();
            fotoPreview.innerHTML = '';
            fotoCapturada = null;

            // Detener camara
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                video.srcObject = null;
                stream = null;
            }

            // Resetear botones
            btnIniciarCamara.disabled = false;
            btnCapturar.disabled = true;

        } else {
            alert('❌ Error al registrar:' + data.message);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al conectar con el servidor. El backend esta corriendo?');

    } finally {
        btnGuardar.textContent = btnOriginalText;
        btnGuardar.disabled = false;
    }
});

document.getElementById('logout').addEventListener('click', function(e) {
    e.preventDefault();

    // Detener camara
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
});

// limpiar al cerra la pagina
window.addEventListener('beforeunload', function() {
    if (stream) {
        stream.getTracks().forEach(track.stop());
    }
});