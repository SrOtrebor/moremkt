// Configuración de API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/instalacione-2a21b/us-central1/api'
    : 'https://us-central1-instalacione-2a21b.cloudfunctions.net/api';

document.addEventListener('DOMContentLoaded', () => {
    // === State Management ===
    let selectedDate = null;
    let selectedTime = null;
    let selectedPackage = 'individual';
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    const prices = {
        'individual': 10000
    };

    // === DOM Elements ===
    const calendarGrid = document.getElementById('calendar-wrapper');
    const slotsGrid = document.getElementById('slots-grid');
    const bookingForm = document.getElementById('booking-form');
    const summaryDate = document.getElementById('summary-date');
    const summaryTime = document.getElementById('summary-time');
    const summaryPrice = document.getElementById('summary-price');
    const btnPay = document.getElementById('btn-pay');
    const packageSelect = document.getElementById('package');

    // === Initialization ===
    renderCalendar(currentMonth, currentYear);
    updateSummary();

    // === Functions ===

    function renderCalendar(month, year) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        let html = `
            <div class="calendar-header">
                <button type="button" class="btn-prev">&lt;</button>
                <div class="calendar-month">${monthNames[month]} ${year}</div>
                <button type="button" class="btn-next">&gt;</button>
            </div>
            <div class="calendar-days">
                <div class="day-name">Dom</div><div class="day-name">Lun</div><div class="day-name">Mar</div><div class="day-name">Mié</div>
                <div class="day-name">Jue</div><div class="day-name">Vie</div><div class="day-name">Sáb</div>
        `;

        // Empty slots for start of month
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="day empty"></div>`;
        }

        // Days of month
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const isPast = dateObj < today;
            const isSelected = selectedDate && dateObj.toDateString() === selectedDate.toDateString();

            html += `
                <div class="day ${isPast ? 'disabled' : 'clickable'} ${isSelected ? 'selected' : ''}" 
                     data-date="${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}">
                    ${day}
                </div>
            `;
        }

        html += `</div>`;
        calendarGrid.innerHTML = html;

        // Add Listeners
        document.querySelector('.btn-prev').onclick = () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar(currentMonth, currentYear);
        };

        document.querySelector('.btn-next').onclick = () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar(currentMonth, currentYear);
        };

        document.querySelectorAll('.day.clickable').forEach(el => {
            el.onclick = (e) => {
                document.querySelectorAll('.day.selected').forEach(s => s.classList.remove('selected'));
                e.target.classList.add('selected');

                const [y, m, d] = e.target.dataset.date.split('-').map(Number);
                selectedDate = new Date(y, m - 1, d);
                selectedTime = null; // Reset time when date changes

                renderTimeSlots(selectedDate);
                updateSummary();
            };
        });
    }

    async function renderTimeSlots(date) {
        // Mostrar loader
        slotsGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Cargando horarios disponibles...</div>';

        try {
            // Formatear fecha para la API (YYYY-MM-DD)
            const dateStr = date.toISOString().split('T')[0];

            // Llamar al backend para obtener slots disponibles
            const response = await fetch(`${API_URL.replace('/createBooking', '')}/getAvailableSlots?date=${dateStr}`);

            if (!response.ok) {
                throw new Error('Error al obtener horarios');
            }

            const data = await response.json();
            const slots = data.slots || [];

            if (slots.length === 0) {
                slotsGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No hay horarios disponibles para esta fecha</div>';
                return;
            }

            // Renderizar slots disponibles
            slotsGrid.innerHTML = slots.map(time => `
                <div class="slot-btn ${selectedTime === time ? 'selected' : ''}" data-time="${time}">${time}</div>
            `).join('');

            // Agregar event listeners
            document.querySelectorAll('.slot-btn').forEach(el => {
                el.onclick = (e) => {
                    document.querySelectorAll('.slot-btn.selected').forEach(s => s.classList.remove('selected'));
                    e.target.classList.add('selected');
                    selectedTime = e.target.dataset.time;
                    updateSummary();
                };
            });

        } catch (error) {
            console.error('Error al cargar horarios:', error);
            slotsGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--danger-color);">Error al cargar horarios. Por favor intenta de nuevo.</div>';
        }
    }

    function updateSummary() {
        if (selectedDate) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            summaryDate.textContent = selectedDate.toLocaleDateString('es-ES', options);
        } else {
            summaryDate.textContent = 'Selecciona una fecha';
        }

        summaryTime.textContent = selectedTime || 'Selecciona un horario';

        const price = prices[selectedPackage];
        summaryPrice.textContent = `$${price.toLocaleString('es-AR')}`;

        // Enable/Disable button
        if (selectedDate && selectedTime) {
            btnPay.disabled = false;
        } else {
            btnPay.disabled = true;
        }
    }

    // === Event Listeners ===

    // Package selection is now fixed to 'individual'
    // packageSelect.onchange = (e) => { ... };

    bookingForm.onsubmit = async (e) => {
        e.preventDefault();

        // Validar fecha y hora
        if (!selectedDate || !selectedTime) {
            showErrorMessage('Datos incompletos', 'Por favor selecciona fecha y hora para tu visita técnica.');
            return;
        }

        // Validar campos obligatorios
        const name = document.getElementById('full-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const serviceType = document.getElementById('service-type').value;
        const street = document.getElementById('street').value.trim();
        const streetNumber = document.getElementById('street-number').value.trim();
        const neighborhood = document.getElementById('neighborhood').value.trim();

        if (!name || !email || !phone || !serviceType || !street || !streetNumber || !neighborhood) {
            showErrorMessage('Datos incompletos', 'Por favor completa todos los campos obligatorios del formulario.');
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showErrorMessage('Email inválido', 'Por favor ingresa un email válido.');
            return;
        }

        // Validar formato de teléfono (mínimo 8 dígitos)
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 8) {
            showErrorMessage('Teléfono inválido', 'Por favor ingresa un número de teléfono válido.');
            return;
        }

        const formData = {
            name: name,
            email: email,
            phone: phone,
            serviceType: document.getElementById('service-type').value,
            problemDescription: document.getElementById('problem-description').value,
            address: {
                street: document.getElementById('street').value,
                streetNumber: document.getElementById('street-number').value,
                floor: document.getElementById('floor').value,
                neighborhood: document.getElementById('neighborhood').value,
                betweenStreets: document.getElementById('between-streets').value
            },
            packageType: selectedPackage,
            date: selectedDate.toISOString().split('T')[0],
            time: selectedTime
        };

        console.log('Enviando reserva al servidor:', formData);

        // Show loading state con spinner
        btnPay.innerHTML = '<span class="spinner"></span> Procesando...';
        btnPay.disabled = true;
        bookingForm.style.opacity = '0.6';
        bookingForm.style.pointerEvents = 'none';

        try {
            // URL de la Cloud Function
            // Detecta automáticamente si estamos en desarrollo o producción
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const API_URL = isLocalhost
                ? 'http://localhost:5001/instalacione-2a21b/us-central1/api/createBooking'
                : 'https://us-central1-instalacione-2a21b.cloudfunctions.net/api/createBooking';

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear la reserva');
            }

            const result = await response.json();
            console.log('Reserva creada:', result);

            // Redirigir al checkout de Mercado Pago
            if (result.init_point) {
                showSuccessMessage('¡Reserva lista!', 'Te estamos redirigiendo al pago seguro...');
                setTimeout(() => {
                    window.location.href = result.init_point;
                }, 1500);
            } else {
                throw new Error('No se recibió el link de pago. Intentá de nuevo.');
            }

        } catch (error) {
            console.error('Error al procesar reserva:', error);
            showErrorMessage('Error al procesar la reserva', error.message || 'Por favor intentá nuevamente.');
            btnPay.innerHTML = '💳 Ir a Pagar';
            btnPay.disabled = false;
            bookingForm.style.opacity = '1';
            bookingForm.style.pointerEvents = 'auto';
        }
    };
});

// ============================================
// FUNCIONES HELPER - MENSAJES
// ============================================

/**
 * Mostrar mensaje de éxito
 */
function showSuccessMessage(title, message) {
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">✅</div>
            <div class="notification-text">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Mostrar mensaje de error
 */
function showErrorMessage(title, message) {
    const notification = document.createElement('div');
    notification.className = 'notification notification-error';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">❌</div>
            <div class="notification-text">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto-remover después de 8 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 8000);
}
