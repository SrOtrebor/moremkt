// Configuración de API
// REEMPLAZAR 'TU-PROJECT-ID' con el ID de tu proyecto de Firebase
const PROJECT_ID = 'TU-PROJECT-ID';
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://localhost:5001/${PROJECT_ID}/us-central1/api`
    : `https://us-central1-${PROJECT_ID}.cloudfunctions.net/api`;

document.addEventListener('DOMContentLoaded', () => {
    let selectedDate = null;
    let selectedTime = null;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    const calendarGrid = document.getElementById('calendar-wrapper');
    const slotsGrid = document.getElementById('slots-grid');
    const bookingForm = document.getElementById('booking-form');
    const summaryDate = document.getElementById('summary-date');
    const summaryTime = document.getElementById('summary-time');
    const btnPay = document.getElementById('btn-pay');

    renderCalendar(currentMonth, currentYear);
    updateSummary();

    function renderCalendar(month, year) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        let html = `
            <div class="calendar-header">
                <button type="button" class="btn-prev">&lt;</button>
                <div style="font-weight: 500; color: var(--text-primary);">${monthNames[month]} ${year}</div>
                <button type="button" class="btn-next">&gt;</button>
            </div>
            <div class="calendar-days">
                <div class="day-name">Dom</div><div class="day-name">Lun</div><div class="day-name">Mar</div><div class="day-name">Mié</div>
                <div class="day-name">Jue</div><div class="day-name">Vie</div><div class="day-name">Sáb</div>
        `;

        for (let i = 0; i < firstDay; i++) {
            html += `<div class="day empty" style="background: transparent; border: none;"></div>`;
        }

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

        document.querySelector('.btn-prev').onclick = () => {
            currentMonth--;
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            renderCalendar(currentMonth, currentYear);
        };

        document.querySelector('.btn-next').onclick = () => {
            currentMonth++;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            renderCalendar(currentMonth, currentYear);
        };

        document.querySelectorAll('.day.clickable').forEach(el => {
            el.onclick = (e) => {
                document.querySelectorAll('.day.selected').forEach(s => s.classList.remove('selected'));
                e.target.classList.add('selected');

                const [y, m, d] = e.target.dataset.date.split('-').map(Number);
                selectedDate = new Date(y, m - 1, d);
                selectedTime = null;

                renderTimeSlots(selectedDate);
                updateSummary();
            };
        });
    }

    async function renderTimeSlots(date) {
        slotsGrid.innerHTML = '<p style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">Cargando horarios...</p>';

        try {
            // Se usa el formato local YYYY-MM-DD
            const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            const response = await fetch(`${API_URL}/getAvailableSlots?date=${dateStr}`);

            if (!response.ok) throw new Error('Error al obtener horarios');

            const data = await response.json();
            const slots = data.slots || [];

            if (slots.length === 0) {
                slotsGrid.innerHTML = '<p style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">No hay horarios disponibles.</p>';
                return;
            }

            slotsGrid.innerHTML = slots.map(time => `
                <div class="slot-btn ${selectedTime === time ? 'selected' : ''}" data-time="${time}">${time}</div>
            `).join('');

            document.querySelectorAll('.slot-btn').forEach(el => {
                el.onclick = (e) => {
                    document.querySelectorAll('.slot-btn.selected').forEach(s => s.classList.remove('selected'));
                    e.target.classList.add('selected');
                    selectedTime = e.target.dataset.time;
                    updateSummary();
                };
            });

        } catch (error) {
            console.error(error);
            slotsGrid.innerHTML = '<p style="color: #ef4444; font-size: 0.9rem;">Error al cargar horarios.</p>';
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

        if (selectedDate && selectedTime) {
            btnPay.disabled = false;
        } else {
            btnPay.disabled = true;
        }
    }

    bookingForm.onsubmit = async (e) => {
        e.preventDefault();

        if (!selectedDate || !selectedTime) {
            alert('Por favor selecciona fecha y hora para tu cita.');
            return;
        }

        const name = document.getElementById('full-name').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!name || !email) {
            alert('Por favor completa todos los campos.');
            return;
        }
        
        const dateStr = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

        const formData = {
            name: name,
            email: email,
            date: dateStr,
            time: selectedTime
        };

        btnPay.textContent = 'Procesando...';
        btnPay.disabled = true;
        bookingForm.style.opacity = '0.6';
        bookingForm.style.pointerEvents = 'none';

        try {
            const response = await fetch(`${API_URL}/createBooking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error al crear la reserva');
            }

            if (result.init_point) {
                btnPay.textContent = 'Redirigiendo...';
                window.location.href = result.init_point;
            } else {
                throw new Error('No se recibió el link de pago.');
            }

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al procesar reserva. Intentá nuevamente.');
            btnPay.textContent = 'Pagar con Mercado Pago';
            btnPay.disabled = false;
            bookingForm.style.opacity = '1';
            bookingForm.style.pointerEvents = 'auto';
        }
    };
});
