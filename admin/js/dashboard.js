// Configuración de API
const PROJECT_ID = 'moremkt-reservas';
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://localhost:5001/${PROJECT_ID}/us-central1/api`
    : `https://api-hchn7up7oq-uc.a.run.app`;

let currentConfig = null;
let currentBlocks = [];
let currentBookings = [];

// ============================================
// SEGURIDAD: Escape de HTML para prevenir XSS
// ============================================
function escapeHtml(str) {
    if (str === null || str === undefined) return '-';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================
// SEGURIDAD: Manejo de sesión expirada (401)
// ============================================
function handleUnauthorized(response) {
    if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = 'login.html';
        return true;
    }
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('admin_token');
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-info').textContent = user.email || 'Admin';

    initNavigation();
    initForms();
    loadConfig();

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = 'login.html';
    });
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const sectionId = item.dataset.section;
            if (!sectionId) return;

            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(`section-${sectionId}`);
            if (targetSection) targetSection.classList.add('active');

            if (sectionId === 'blocks') loadBlocks();
            else if (sectionId === 'bookings') loadBookings();
        });
    });
}

async function loadConfig() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE}/admin/config`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (handleUnauthorized(response)) return;
        if (!response.ok) throw new Error('Error al cargar configuración');

        const data = await response.json();
        currentConfig = data;

        if (data.availability) loadAvailabilityForm(data.availability);
        if (data.pricing) loadPricingForm(data.pricing);

        currentBlocks = data.blocks || [];
        renderBlocks();

    } catch (error) {
        console.error('Error al cargar configuración.');
        alert('Error al cargar configuración. Recargá la página.');
    }
}

function loadAvailabilityForm(config) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach(day => {
        const dayConfig = config.weekdays[day];
        if(!dayConfig) return;
        const checkbox = document.getElementById(`${day}-enabled`);
        checkbox.checked = dayConfig.enabled;

        if (dayConfig.timeRanges && dayConfig.timeRanges.length > 0) {
            if (dayConfig.timeRanges[0]) {
                document.getElementById(`${day}-start1`).value = dayConfig.timeRanges[0].start;
                document.getElementById(`${day}-end1`).value = dayConfig.timeRanges[0].end;
            }
            if (dayConfig.timeRanges[1]) {
                document.getElementById(`${day}-start2`).value = dayConfig.timeRanges[1].start;
                document.getElementById(`${day}-end2`).value = dayConfig.timeRanges[1].end;
            }
        }
    });

    document.getElementById('session-duration').value = config.sessionDuration || 60;
}

function loadPricingForm(pricing) {
    document.getElementById('price-individual').value = pricing.individual || 10000;
}

function initForms() {
    document.getElementById('form-availability').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAvailability();
    });

    document.getElementById('form-block').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createBlock();
    });

    document.getElementById('form-pricing').addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePricing();
    });
}

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
            if (start1 && end1) timeRanges.push({ start: start1, end: end1 });
            if (start2 && end2) timeRanges.push({ start: start2, end: end2 });

            weekdays[day] = { enabled, timeRanges };
        });

        const configData = {
            weekdays,
            sessionDuration: parseInt(document.getElementById('session-duration').value)
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

        if (handleUnauthorized(response)) return;
        if (!response.ok) throw new Error('Error al guardar');

        alert('✅ Configuración guardada correctamente');
        loadConfig();

    } catch (error) {
        console.error('Error al guardar disponibilidad.');
        alert('❌ Error al guardar la configuración.');
    }
}

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

        if (handleUnauthorized(response)) return;
        if (!response.ok) throw new Error('Error al crear bloqueo');

        alert('✅ Horario bloqueado correctamente');
        document.getElementById('form-block').reset();
        loadConfig();

    } catch (error) {
        console.error('Error al crear bloqueo.');
        alert('❌ Error al crear el bloqueo.');
    }
}

async function deleteBlock(blockId) {
    if (!confirm('¿Eliminar este bloqueo?')) return;

    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE}/admin/blocks/${blockId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (handleUnauthorized(response)) return;
        if (!response.ok) throw new Error('Error al eliminar');

        alert('✅ Bloqueo eliminado');
        loadConfig();

    } catch (error) {
        console.error('Error al eliminar bloqueo.');
        alert('❌ Error al eliminar el bloqueo.');
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
            <td>${escapeHtml(formatDate(block.date))}</td>
            <td>${escapeHtml(block.startTime)} - ${escapeHtml(block.endTime)}</td>
            <td>${escapeHtml(block.reason)}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteBlock('${escapeHtml(block.id)}')">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

async function loadBlocks() {
    await loadConfig();
}

async function loadBookings() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE}/admin/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (handleUnauthorized(response)) return;
        if (!response.ok) throw new Error('Error al cargar reservas');

        const data = await response.json();
        currentBookings = data.bookings;
        renderBookings();

    } catch (error) {
        console.error('Error al cargar reservas.');
        alert('Error al cargar las reservas. Recargá la página.');
    }
}

function renderBookings() {
    const tbody = document.getElementById('bookings-tbody');

    if (currentBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No hay reservas</td></tr>';
        return;
    }

    tbody.innerHTML = currentBookings.map(booking => `
        <tr>
            <td>${escapeHtml(formatDate(booking.date))}</td>
            <td>${escapeHtml(booking.time)}</td>
            <td>${escapeHtml(booking.clientName)}</td>
            <td>${escapeHtml(booking.clientEmail)}</td>
            <td><span class="status-badge status-${escapeHtml(booking.status)}">${formatStatus(booking.status)}</span></td>
        </tr>
    `).join('');
}

async function savePricing() {
    try {
        const pricingData = {
            individual: parseInt(document.getElementById('price-individual').value)
        };

        if (isNaN(pricingData.individual) || pricingData.individual < 0) {
            alert('❌ Ingresá un precio válido.');
            return;
        }

        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE}/admin/config/pricing`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pricingData)
        });

        if (handleUnauthorized(response)) return;
        if (!response.ok) throw new Error('Error al guardar precios');

        alert('✅ Precios actualizados correctamente');
        loadConfig();

    } catch (error) {
        console.error('Error al guardar precios.');
        alert('❌ Error al actualizar los precios.');
    }
}

function formatDate(dateStr) {
    // Add offset correction so UTC date parsing works well across timezones
    const date = new Date(dateStr + 'T12:00:00Z');
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatStatus(status) {
    const map = {
        'confirmed': 'Confirmada',
        'pending_payment': 'Pendiente',
        'cancelled': 'Cancelada'
    };
    return map[status] || status;
}

window.deleteBlock = deleteBlock;
