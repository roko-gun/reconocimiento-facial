// chatbot.js - Eliminado el require que causaba error

// Integracion chatbot
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendChat');

// configuracion del chatbot
const CHATBOT_API_URL = 'http://localhost:3000/api/chatbot'; //URL de la API de CHATBOT

// Funcion para agregar mensaje al chat
function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message text-end' : 'bot-message'}`;
    messageDiv.style.marginBottom = '10px';
    messageDiv.style.padding = '8px 12px';
    messageDiv.style.borderRadius = '10px';
    messageDiv.style.backgroundColor = isUser ? '#007bff' : '#e9ecef';
    messageDiv.style.color = isUser ? 'white' : 'black';  // CORREGIDO: = en lugar de -
    messageDiv.style.maxWidth = '80%';
    messageDiv.style.marginLeft = isUser ? 'auto' : '0';

    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Funcion para enviar mensaje Chatbot
async function sendMessageToChatbot(message) {  // CORREGIDO: nombre de función
    try {
        // contexto del sistema para ciertas consultas
        const context = {
            tipo: 'consulta_registros',
            fecha: new Date().toISOString().split('T')[0]
        };

        const response = await fetch(CHATBOT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                message: message,
                context: context
            })
        });

        const data = await response.json();

        if (data.success) {  // CORREGIDO: success en lugar de succes
            addMessage(data.response);

            // si la respuesta incluye datos de registros, mostrarlos en formato tabla
            if (data.registros && data.registros.length > 0) {
                mostrarRegistrosEnChat(data.registros);
            }
        } else {
            addMessage('Lo siento, no pude procesar tu solicitud en este momento.');
        }
    } catch (error) {
        console.error('Error: ', error);
        addMessage('Error de conexion con el chatbot');
    }
}

// funcion para mostrar registros en el chat
function mostrarRegistrosEnChat(registros) {
    const tablaHTML = `
        <div style="overflow-x: auto; margin-top: 10px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background-color: #667eea; color: white;">
                        <th style="padding: 5px;">Nombre</th>
                        <th style="padding: 5px;">Ingreso</th>
                        <th style="padding: 5px;">Salida</th>
                    </tr>
                </thead>
                <tbody>
                    ${registros.map(r => `
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 5px;">${r.nombre}</td>
                            <td style="padding: 5px;">${r.ingreso || 'N/A'}</td>
                            <td style="padding: 5px;">${r.salida || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    messageDiv.style.marginBottom = '10px';
    messageDiv.style.padding = '8px 12px';
    messageDiv.style.borderRadius = '10px';
    messageDiv.style.backgroundColor = '#e9ecef';
    messageDiv.style.maxWidth = '80%';
    messageDiv.innerHTML = tablaHTML;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// evento de enviar mensajes
if (sendButton) {
    sendButton.addEventListener('click', function() {
        const message = chatInput.value.trim();
        if (message) {
            addMessage(message, true);
            sendMessageToChatbot(message);
            chatInput.value = '';
        }
    });
}

// evento de enter en el input
if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
}

// Mensaje de Bienvenida al abrir el modal
const chatbotModal = document.getElementById('chatbotModal');
if (chatbotModal) {
    chatbotModal.addEventListener('shown.bs.modal', function() {
        if (chatMessages.children.length === 0) {
            addMessage('¡Hola! Soy tu asistente Virtual. Puedo ayudarte con:');
            addMessage('• Consultar registros del día');
            addMessage('• Buscar personal específico');
            addMessage('• Generar reportes rápidos');
            addMessage('¿En qué puedo ayudarte?');
        }
    });
}

// Funciones auxiliares para el chatbot
async function obtenerRegistrosDelDia() {
    const token = localStorage.getItem('token');
    const hoy = new Date().toISOString().split('T')[0];

    try {
        const response = await fetch(`http://localhost:3000/api/registros/dia?fecha=${hoy}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function obtenerPersonalDentro() {  // CORREGIDO: nombre consistente
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:3000/api/registros/dentro', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function buscarPersonal(nombre) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`http://localhost:3000/api/personal/buscar?nombre=${encodeURIComponent(nombre)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}