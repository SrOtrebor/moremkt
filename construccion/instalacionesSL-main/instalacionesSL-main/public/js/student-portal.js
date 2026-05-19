// Configuración de API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/instalacione-2a21b/us-central1/api'
    : 'https://us-central1-instalacione-2a21b.cloudfunctions.net/api';

// Estado global
let sessionToken = null;
let studentData = null;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay token en la URL (magic link)
    const urlParams = new URLSearchParams(window.location.search);
    const magicToken = urlParams.get('token');

    if (magicToken) {
        verifyMagicLink(magicToken);
    } else {
        // Verificar si hay sesión activa
        const savedToken = localStorage.getItem('student_session_token');
        if (savedToken) {
            sessionToken = savedToken;
            loadDashboard();
        } else {
            showLoginView();
        }
    }

    // Event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
});

// ============================================
// VIEWS
// ============================================

function showLoginView() {
    document.getElementById('login-view').style.display = 'block';
    document.getElementById('dashboard-view').style.display = 'none';
}

function showDashboardView() {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';
}

// ============================================
// LOGIN
// ============================================

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const btnLogin = document.getElementById('btn-login');
    const messageEl = document.getElementById('login-message');

    // Deshabilitar botón
    btnLogin.disabled = true;
    btnLogin.textContent = 'Enviando...';

    try {
        const response = await fetch(`${API_URL}/student/request-access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(messageEl, data.message, 'success');
            document.getElementById('email').value = '';
        } else {
            showMessage(messageEl, data.error || 'Error al enviar el link', 'error');
        }

    } catch (error) {
        console.error('Error:', error);
        showMessage(messageEl, 'Error de conexión. Intenta nuevamente.', 'error');
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Enviar Link de Acceso';
    }
}

// ============================================
// MAGIC LINK VERIFICATION
// ============================================

async function verifyMagicLink(token) {
    try {
        console.log('Verificando magic link token...');

        const response = await fetch(`${API_URL}/student/verify-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);

        if (response.ok) {
            // Guardar sesión
            sessionToken = data.sessionToken;
            studentData = data.student;
            localStorage.setItem('student_session_token', sessionToken);

            // Limpiar URL
            window.history.replaceState({}, document.title, '/mi-cuenta');

            // Cargar dashboard
            loadDashboard();
        } else {
            console.error('Error del servidor:', data);
            alert(data.error || 'Link inválido o expirado. Por favor, solicita un nuevo link.');
            showLoginView();
        }

    } catch (error) {
        console.error('Error de red:', error);
        alert('Error de conexión. Por favor, verifica que los emuladores estén corriendo.');
        showLoginView();
    }
}

// ============================================
// DASHBOARD
// ============================================

async function loadDashboard() {
    showDashboardView();

    try {
        const response = await fetch(`${API_URL}/student/dashboard`, {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Sesión expirada
                localStorage.removeItem('student_session_token');
                alert('Tu sesión expiró. Por favor, ingresa nuevamente.');
                showLoginView();
                return;
            }
            throw new Error('Error al cargar datos');
        }

        const data = await response.json();
        renderDashboard(data);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar tus datos');
    }
}

function renderDashboard(data) {
    // Nombre y email del estudiante
    document.getElementById('student-name').textContent = data.student.name;
    document.getElementById('student-email').textContent = data.student.email;

    // Paquete (si existe)
    if (data.packages) {
        const packageEl = document.getElementById('package-summary');
        packageEl.style.display = 'block';

        document.getElementById('package-type').textContent =
            data.packages.packageType === 'pack-4' ? 'Paquete 4 Clases' : 'Paquete 8 Clases';
        document.getElementById('package-total').textContent = data.packages.totalClasses;
        document.getElementById('package-used').textContent = data.packages.usedClasses;
        document.getElementById('package-remaining').textContent = data.packages.remainingClasses;
    }

    // Link de Drive
    if (data.driveFolder) {
        const driveLink = document.getElementById('drive-link');
        driveLink.href = data.driveFolder;
        driveLink.style.display = 'flex';
    }

    // Próximas clases
    renderUpcomingClasses(data.upcomingClasses);

    // Historial
    renderPastClasses(data.pastClasses);
}

function renderUpcomingClasses(classes) {
    const container = document.getElementById('upcoming-classes');

    if (classes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3>No tienes clases programadas</h3>
                <p>Agenda tu próxima sesión para continuar aprendiendo</p>
                <a href="agendar.html" class="btn btn-primary">Agendar Clase</a>
            </div>
        `;
        return;
    }

    container.innerHTML = classes.map(classItem => `
        <div class="class-item upcoming">
            <div class="class-info">
                <div class="class-date">${formatDate(classItem.date)}</div>
                <div class="class-time">⏰ ${classItem.time}</div>
                ${classItem.subject ? `<div class="class-subject">📚 ${classItem.subject}</div>` : ''}
            </div>
            <div class="class-actions">
                ${classItem.meetLink ?
            `<a href="${classItem.meetLink}" target="_blank" class="btn btn-primary btn-sm">
                        Unirse a Meet
                    </a>` :
            `<span class="text-secondary text-sm">Link disponible 24hs antes</span>`
        }
            </div>
        </div>
    `).join('');
}

function renderPastClasses(classes) {
    const container = document.getElementById('past-classes');

    if (classes.length === 0) {
        container.innerHTML = `
            <p class="text-secondary text-center">No tienes clases completadas aún</p>
        `;
        return;
    }

    container.innerHTML = classes.map(classItem => `
        <div class="class-item">
            <div class="class-info">
                <div class="class-date">${formatDate(classItem.date)}</div>
                <div class="class-time">⏰ ${classItem.time}</div>
                ${classItem.subject ? `<div class="class-subject">📚 ${classItem.subject}</div>` : ''}
            </div>
            <div class="class-actions">
                <span class="text-success text-sm font-semibold">✓ Completada</span>
            </div>
        </div>
    `).join('');
}

// ============================================
// LOGOUT
// ============================================

async function handleLogout() {
    if (!confirm('¿Seguro que quieres cerrar sesión?')) {
        return;
    }

    try {
        await fetch(`${API_URL}/student/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }

    // Limpiar sesión local
    localStorage.removeItem('student_session_token');
    sessionToken = null;
    studentData = null;

    // Volver al login
    showLoginView();
}

// ============================================
// UTILIDADES
// ============================================

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';

    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-AR', options);
}
