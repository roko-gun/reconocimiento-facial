localStorage.removeItem('token');
localStorage.removeItem('usuario');

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // mostrar mensaje de carga
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Iniciando sesion...';
    submitBtn.disabled = true;

    try { 
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Guardar token y datos del usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    } finally {
        //restaurar boton
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// verificar si ya hay sesion activa
//document.addEventListener('DOMContentLoaded', function() {
  //  const token = localStorage.getItem('token');
    //if (token) {
        // opcional: verificar si el token sigue siendo valido
      //  window.location.href = 'dashboard.html';
    //}
//});