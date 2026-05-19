// Configuración de API
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/instalacione-2a21b/us-central1/api'
    : 'https://us-central1-instalacione-2a21b.cloudfunctions.net/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const btnLogin = document.getElementById('btn-login');
    const errorMessage = document.getElementById('error-message');

    // Si ya hay sesión, redirigir al dashboard
    const token = localStorage.getItem('admin_token');
    if (token) {
        window.location.href = 'dashboard.html';
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Ocultar mensaje de error
        errorMessage.style.display = 'none';

        // Mostrar loading
        btnLogin.disabled = true;
        btnLogin.textContent = 'Iniciando sesión...';

        try {
            const response = await fetch(`${API_BASE}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            // Guardar token y datos del usuario
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_user', JSON.stringify(data.user));

            // Redirigir al dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('Error en login:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
            btnLogin.disabled = false;
            btnLogin.textContent = 'Iniciar Sesión';
        }
    });
});
