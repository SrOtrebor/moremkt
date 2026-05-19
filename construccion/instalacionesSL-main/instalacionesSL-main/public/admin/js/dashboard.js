// Configuración de API
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/instalacione-2a21b/us-central1/api'
    : 'https://us-central1-instalacione-2a21b.cloudfunctions.net/api';

// Estado global
let currentConfig = null;
let currentBlocks = [];
let currentBookings = [];

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('admin_token');
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Mostrar info del usuario
    document.getElementById('user-info').textContent = user.email || 'Admin';

    // Inicializar
    initNavigation();
    initForms();
    loadConfig();

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = 'login.html';
    });
});

// ============================================
// NAVEGACIÓN
// ============================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const sectionId = item.dataset.section;
            if (!sectionId) return; // Permitir navegación a otras páginas

            e.preventDefault();

            // Actualizar nav activo
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Mostrar sección
            sections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(`section-${sectionId}`);
            if (targetSection) targetSection.classList.add('active');

            // Cargar datos según sección
            if (sectionId === 'blocks') {
                loadBlocks();
            } else if (sectionId === 'bookings') {
                loadBookings();
            }
        });
    });
}

// ============================================
// CARGAR CONFIGURACIÓN
// ============================================

async function loadConfig() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE}/admin/config`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar configuración');

        const data = await response.json();
        currentConfig = data;

        // Cargar disponibilidad
        if (data.availability) {
            loadAvailabilityForm(data.availability);
        }

        // Cargar precios
        if (data.pricing) {
            loadPricingForm(data.pricing);
        }

        // Cargar bloqueos
        currentBlocks = data.blocks || [];
        renderBlocks();

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar configuración: ' + error.message);
    }
}

function loadAvailabilityForm(config) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach(day => {
        const dayConfig = config.weekdays[day];
        const checkbox = document.getElementById(`${day}-enabled`);

        checkbox.checked = dayConfig.enabled;

        if (dayConfig.timeRanges && dayConfig.timeRanges.length > 0) {
            // Primer rango
            if (dayConfig.timeRanges[0]) {
                document.getElementById(`${day}-start1`).value = dayConfig.timeRanges[0].start;
                document.getElementById(`${day}-end1`).value = dayConfig.timeRanges[0].end;
            }
            // Segundo rango
            if (dayConfig.timeRanges[1]) {
                document.getElementById(`${day}-start2`).value = dayConfig.timeRanges[1].start;
                document.getElementById(`${day}-end2`).value = dayConfig.timeRanges[1].end;
            }
        }
    });

    document.getElementById('session-duration').value = config.sessionDuration;
    document.getElementById('min-days-advance').value = config.minDaysAdvance;
    document.getElementById('max-days-advance').value = config.maxDaysAdvance;
}

function loadPricingForm(pricing) {
    document.getElementById('price-individual').value = pricing.individual;
}

// ============================================
// FORMULARIOS
// ============================================

function initForms() {
    // Formulario de disponibilidad
    document.getElementById('form-availability').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAvailability();
    });

    // Formulario de bloqueos
    document.getElementById('form-block').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createBlock();
    });

    // Formulario de precios
    document.getElementById('form-pricing').addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePricing();
    });

    // Filtro de reservas
    document.getElementById('btn-filter-bookings').addEventListener('click', () => {
        loadBookings();
    });
}

// ============================================
// GUARDAR DISPONIBILIDAD
// ============================================

async function saveAvailability() {
    try {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const weekdays = {};

        days.forEach(day => {
            const enabled = document.getElementById(`${day}-enabled`).checked;
            const start1 = document.getElementById(`${day}-start1`).value;
            const end1 = document.getElementById(`${day}-end1`).value;
            const start2 = document.getElementById(`${day}-start2`).value;
            const end2 = document.getElementById(`${day}-end2`).value;

            const timeRanges = [];
            if (start1 && end1) {
                timeRanges.push({ start: start1, end: end1 });
            }
            if (start2 && end2) {
                timeRanges.push({ start: start2, end: end2 });
            }

            weekdays[day] = {
                enabled,
                timeRanges
            };
        });

        const configData = {
            weekdays,
            sessionDuration: parseInt(document.getElementById('session-duration').value),
            minDaysAdvance: parseInt(document.getElementById('min-days-advance').value),
            maxDaysAdvance: parseInt(document.getElementById('max-days-advance').value)
        };

        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE}/admin/config/availability`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        });

        if (!response.ok) throw new Error('Error al guardar');

        alert('✅ Configuración guardada correctamente');
        loadConfig();

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al guardar: ' + error.message);
    }
}

// ============================================
// BLOQUEOS
// ============================================

async function createBlock() {
    try {
        const blockData = {
            date: document.getElementById('block-date').value,
            startTime: document.getElementById('block-start').value,
            endTime: document.getElementById('block-end').value,
            reason: document.getElementById('block-reason').value
        };

        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE}/admin/blocks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(blockData)
        });

        if (!response.ok) throw new Error('Error al crear bloqueo');

        alert('✅ Horario bloqueado correctamente');
        document.getElementById('form-block').reset();
        loadConfig();

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
    }
}

async function deleteBlock(blockId) {
    if (!confirm('¿Eliminar este bloqueo?')) return;

    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE}/admin/blocks/${blockId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al eliminar');

        alert('✅ Bloqueo eliminado');
        loadConfig();

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
    }
}

function renderBlocks() {
    const tbody = document.getElementById('blocks-tbody');

    if (currentBlocks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No hay bloqueos activos</td></tr>';
        return;
    }

    tbody.innerHTML = currentBlocks.map(block => `
        <tr>
            <td>${formatDate(block.date)}</td>
            <td>${block.startTime} - ${block.endTime}</td>
            <td>${block.reason || '-'}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteBlock('${block.id}')">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

async function loadBlocks() {
    await loadConfig();
}

// ============================================
// RESERVAS
// ============================================

async function loadBookings() {
    try {
        const status = document.getElementById('filter-status').value;
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;

        const params = new URLSearchParams();
        if (status !== 'all') params.append('status', status);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE}/admin/bookings?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar reservas');

        const data = await response.json();
        currentBookings = data.bookings;
        renderBookings();

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar reservas: ' + error.message);
    }
}

function renderBookings() {
    const tbody = document.getElementById('bookings-tbody');

    if (currentBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">No hay reservas</td></tr>';
        return;
    }

    tbody.innerHTML = currentBookings.map(booking => `
        <tr>
            <td>${formatDate(booking.date)}</td>
            <td>${booking.time}</td>
            <td>${booking.clientName || booking.studentName || '-'}</td>
            <td>${booking.clientEmail || booking.studentEmail || '-'}</td>
            <td>${booking.clientPhone || booking.studentPhone || '-'}</td>
            <td>${booking.serviceType || formatPackage(booking.package) || '-'}</td>
            <td>${booking.address ? (booking.address.street + ' ' + booking.address.streetNumber + ', ' + booking.address.neighborhood) : '-'}</td>
            <td><span class="status-badge status-${booking.status}">${formatStatus(booking.status)}</span></td>
            <td>
                ${booking.status === 'confirmed' ? `
                    <button class="btn btn-danger" onclick="cancelBooking('${booking.id}')">Cancelar</button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

async function cancelBooking(bookingId) {
    if (!confirm('¿Cancelar esta reserva?')) return;

    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE}/admin/bookings/${bookingId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al cancelar');

        alert('✅ Reserva cancelada');
        loadBookings();

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
    }
}

// ============================================
// PRECIOS
// ============================================

async function savePricing() {
    try {
        const pricingData = {
            individual: parseInt(document.getElementById('price-individual').value)
        };

        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE}/admin/config/pricing`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pricingData)
        });

        if (!response.ok) throw new Error('Error al guardar precios');

        alert('✅ Precios actualizados correctamente');
        loadConfig();

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
    }
}

// ============================================
// UTILIDADES
// ============================================

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatPackage(pkg) {
    const map = {
        'individual': 'Individual',
        'pack-4': 'Pack 4',
        'pack-8': 'Pack 8'
    };
    return map[pkg] || pkg;
}

function formatStatus(status) {
    const map = {
        'confirmed': 'Confirmada',
        'pending_payment': 'Pendiente',
        'cancelled': 'Cancelada'
    };
    return map[status] || status;
}

// Exponer funciones globalmente para onclick
window.deleteBlock = deleteBlock;
window.cancelBooking = cancelBooking;
