/* ========================================
   MoreMKT SPA — app.js
   Lógica de Tabs dinámicos y Modal
   ======================================== */

// --- 1. LÓGICA DE TABS DINÁMICOS Y FONDO DEGRADADO ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const heroBg = document.getElementById('heroBg');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const bgColor = btn.getAttribute('data-color');
    
    // 1. Quitar activo de todos
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // 2. Activar clickeado
    btn.classList.add('active');
    document.getElementById(targetId).classList.add('active');
    
    // 3. Cambiar color del Hero Background
    if (heroBg && bgColor) {
      heroBg.style.backgroundColor = bgColor;
    }
  });
});



// --- 2. LÓGICA DE CURSOS (Capacitación) ---
const checkboxes = document.querySelectorAll('.course-check');
const promoBar = document.getElementById('promoBar');
const packBtn = document.getElementById('packBtn');
const packBtnTop = document.getElementById('packBtnTop');

function updateCoursePack() {
  const count = document.querySelectorAll('.course-check:checked').length;
  
  if (count >= 3) {
    if(promoBar) promoBar.style.display = 'block';
    if(packBtn) packBtn.textContent = `Comprar pack (${count} cursos + Mentoría gratis 🎁)`;
  } else {
    if(promoBar) promoBar.style.display = 'none';
    if(packBtn) packBtn.textContent = count > 0 ? `Comprar pack (${count} seleccionados)` : 'Seleccioná al menos un curso';
  }
}

checkboxes.forEach(cb => cb.addEventListener('change', updateCoursePack));

if(packBtn) {
  packBtn.addEventListener('click', () => {
    const count = document.querySelectorAll('.course-check:checked').length;
    if (count === 0) return;
    openModal('capacitacion', `Pack de ${count} cursos seleccionados`);
  });
}
if(packBtnTop) {
  packBtnTop.addEventListener('click', () => {
    // Scroll abajo hacia los cursos o abrir modal
    document.querySelector('.overlap-cards-container').scrollIntoView({behavior: 'smooth'});
  });
}

// Ocultar promo bar por defecto
if(promoBar) promoBar.style.display = 'none';


// --- 3. QR CODE DE CONTACTO ---
if (typeof QRCode !== 'undefined' && document.getElementById('qrCode')) {
  new QRCode(document.getElementById('qrCode'), {
    text: "https://wa.me/5491176426155",
    width: 100, height: 100,
    colorDark: '#ffffff', colorLight: '#111827' // QR Invertido para fondo oscuro de footer
  });
}


// --- 4. MODAL DE RESERVAS DINÁMICO (Firebase + Mercado Pago) ---
const PROJECT_ID = 'TU-PROJECT-ID';
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://localhost:5001/${PROJECT_ID}/us-central1/api`
    : `https://us-central1-${PROJECT_ID}.cloudfunctions.net/api`;

const modal = document.getElementById('bookingModal');
const modalOverlay = document.getElementById('modalOverlay');
let modalService = '';
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function openModal(service, detail) {
  modalService = detail;
  document.getElementById('modal-service-label').textContent = detail;
  
  // Limpiar form
  const form = document.getElementById('modal-booking-form');
  if(form) form.reset();
  
  // Reiniciar selección
  selectedDate = null;
  selectedTime = null;
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  
  renderCalendar(currentMonth, currentYear);
  updateSummary();
  
  // Mostrar paso 1
  document.querySelectorAll('.modal-step').forEach(s => s.classList.add('hidden'));
  document.getElementById('step1').classList.remove('hidden');
  
  modal.classList.add('open');
  document.body.style.overflow = 'hidden'; // Evitar scroll
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', closeModal);
}

function renderCalendar(month, year) {
    const calendarGrid = document.getElementById('modal-calendar');
    if (!calendarGrid) return;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    let html = `
        <div class="calendar-header">
            <button type="button" class="btn-prev">&lt;</button>
            <div style="font-weight: 700; color: var(--carbon);">${monthNames[month]} ${year}</div>
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

    const prevBtn = calendarGrid.querySelector('.btn-prev');
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            currentMonth--;
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            renderCalendar(currentMonth, currentYear);
        };
    }

    const nextBtn = calendarGrid.querySelector('.btn-next');
    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            currentMonth++;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            renderCalendar(currentMonth, currentYear);
        };
    }

    calendarGrid.querySelectorAll('.day.clickable').forEach(el => {
        el.onclick = (e) => {
            calendarGrid.querySelectorAll('.day.selected').forEach(s => s.classList.remove('selected'));
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
    const slotsGrid = document.getElementById('modal-slots');
    if (!slotsGrid) return;
    slotsGrid.innerHTML = '<p style="color: #6b7280; font-size: 0.85rem; text-align: center; width: 100%;">Cargando horarios...</p>';

    try {
        if (PROJECT_ID === 'TU-PROJECT-ID') {
            throw new Error("Demo Mode");
        }
        const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const response = await fetch(`${API_URL}/getAvailableSlots?date=${dateStr}`);

        if (!response.ok) throw new Error('Error al obtener horarios');

        const data = await response.json();
        const slots = data.slots || [];

        if (slots.length === 0) {
            slotsGrid.innerHTML = '<p style="color: #6b7280; font-size: 0.85rem; text-align: center; width: 100%;">No hay horarios disponibles.</p>';
            return;
        }

        slotsGrid.innerHTML = slots.map(time => `
            <div class="slot-btn ${selectedTime === time ? 'selected' : ''}" data-time="${time}">${time}</div>
        `).join('');

        slotsGrid.querySelectorAll('.slot-btn').forEach(el => {
            el.onclick = (e) => {
                slotsGrid.querySelectorAll('.slot-btn.selected').forEach(s => s.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedTime = e.target.dataset.time;
                updateSummary();
            };
        });

    } catch (error) {
        console.warn("Firebase offline or TU-PROJECT-ID not configured. Loading premium mock slots for testing.");
        // Hermoso Mock de Horarios para que el usuario pruebe e interactúe sin depender de Firebase
        const mockSlots = ["09:00", "10:30", "12:00", "14:30", "16:00", "17:30"];
        slotsGrid.innerHTML = `
            <div class="slots-grid">
                ${mockSlots.map(time => `<div class="slot-btn ${selectedTime === time ? 'selected' : ''}" data-time="${time}">${time}</div>`).join('')}
            </div>
        `;

        slotsGrid.querySelectorAll('.slot-btn').forEach(el => {
            el.onclick = (e) => {
                slotsGrid.querySelectorAll('.slot-btn.selected').forEach(s => s.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedTime = e.target.dataset.time;
                updateSummary();
            };
        });
    }
}

function updateSummary() {
    const summaryDate = document.getElementById('modal-sum-date');
    const summaryTime = document.getElementById('modal-sum-time');
    const btnPay = document.getElementById('modal-btn-pay');
    
    if (selectedDate) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        if (summaryDate) summaryDate.textContent = selectedDate.toLocaleDateString('es-ES', options);
    } else {
        if (summaryDate) summaryDate.textContent = 'Sin seleccionar';
    }

    if (summaryTime) summaryTime.textContent = selectedTime || 'Sin seleccionar';

    // Validar habilitación de botón de pago
    const name = document.getElementById('modal-name')?.value.trim();
    const phone = document.getElementById('modal-phone')?.value.trim();
    const email = document.getElementById('modal-email')?.value.trim();

    if (btnPay) {
        btnPay.disabled = !(selectedDate && selectedTime && name && phone && email);
    }
}

['modal-name','modal-phone','modal-email'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateSummary);
});

async function submitModalBooking() {
  if (!selectedDate || !selectedTime) {
      alert('Por favor selecciona fecha y hora para tu cita.');
      return;
  }

  const name = document.getElementById('modal-name').value.trim();
  const phone = document.getElementById('modal-phone').value.trim();
  const email = document.getElementById('modal-email').value.trim();

  if (!name || !email || !phone) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
  }
  
  const dateStr = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

  const formData = {
      name: name,
      email: email,
      phone: phone,
      date: dateStr,
      time: selectedTime,
      service: modalService
  };

  const btnPay = document.getElementById('modal-btn-pay');
  const originalText = btnPay.innerHTML;
  btnPay.textContent = 'Procesando...';
  btnPay.disabled = true;

  // Mostrar step 2 ("Redirigiendo...")
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');

  try {
      if (PROJECT_ID === 'TU-PROJECT-ID') {
          throw new Error("Demo Mode");
      }
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
      console.warn("Firebase not set up or offline. Redirecting to WhatsApp fallback booking.");
      
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const friendlyDate = selectedDate.toLocaleDateString('es-ES', options);
      const waText = encodeURIComponent(
        `¡Hola MoreMKT!\nQuiero agendar una sesión:\n📋 *Servicio:* ${modalService}\n📅 *Fecha:* ${friendlyDate}\n🕐 *Horario:* ${selectedTime} hs\n\n👤 *Nombre:* ${name}\n📱 *WhatsApp:* ${phone}\n📧 *Email:* ${email}`
      );
      
      // Mostrar paso 3 ("¡Solicitud enviada!")
      document.getElementById('step2').classList.add('hidden');
      document.getElementById('step3').classList.remove('hidden');
      
      const step3Title = document.querySelector('#step3 h2');
      if (step3Title) {
          step3Title.textContent = '¡Solicitud enviada por WhatsApp!';
      }
      
      // Abrir enlace de WhatsApp en pestaña nueva
      window.open(`https://wa.me/5491176426155?text=${waText}`, '_blank');
      
      // Restaurar el botón del modal por si se vuelve a abrir
      btnPay.innerHTML = originalText;
      btnPay.disabled = false;
  }
}

// --- 5. LÓGICA DE FEEDBACK DE PAGO (MERCADO PAGO) ---
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const banner = document.getElementById('payment-result-banner');

    if (status && banner) {
        let title = '';
        let message = '';
        let typeClass = '';
        let icon = '';

        if (status === 'approved') {
            title = '¡Pago Confirmado!';
            message = 'Tu reserva ha sido registrada correctamente. Te enviamos un correo con los detalles de la sesión y el enlace de acceso.';
            typeClass = 'approved';
            icon = '✓';
        } else if (status === 'pending') {
            title = 'Pago en Proceso';
            message = 'Tu pago está pendiente de acreditación. En cuanto se confirme, te enviaremos el mail con la confirmación de la cita.';
            typeClass = 'pending';
            icon = '⏳';
        } else {
            title = 'Pago Rechazado';
            message = 'Hubo un problema al procesar tu pago. Por favor, vuelve a intentarlo desde la sección correspondiente.';
            typeClass = 'failure';
            icon = '✕';
        }

        banner.innerHTML = `
            <div class="mp-banner ${typeClass}">
                <div class="mp-banner-icon">${icon}</div>
                <div class="mp-banner-content">
                    <h4>${title}</h4>
                    <p>${message}</p>
                </div>
                <button class="mp-banner-close" onclick="this.parentElement.remove()">✕</button>
            </div>
        `;
        
        banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

// Exponer global
window.openModal = openModal;
window.closeModal = closeModal;
window.submitModalBooking = submitModalBooking;

// --- 6. EFECTO INTERACTIVO 3D TILT EN TARJETAS ---
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.overlap-card');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // Posición X dentro de la tarjeta
      const y = e.clientY - rect.top;  // Posición Y dentro de la tarjeta
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calcular ángulos de inclinación (máximo 12 grados de flexión)
      const rotateX = ((centerY - y) / centerY) * 12;
      const rotateY = ((x - centerX) / centerX) * 12;
      
      // Determinar la transformación base según la jerarquía de la tarjeta
      let baseTransform = '';
      if (card.classList.contains('featured')) {
        baseTransform = 'scale(1.05) translateZ(35px) translateY(-5px)';
      } else {
        baseTransform = 'translateZ(25px) translateY(-8px)';
      }
      
      // Aplicar rotaciones 3D dinámicas
      card.style.transform = `${baseTransform} rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      
      // Desplazar el marco de cristal trasero (::after) en dirección contraria para Parallax
      const offsetAfterX = -rotateY * 1.5;
      const offsetAfterY = rotateX * 1.5;
      card.style.setProperty('--after-x', `${offsetAfterX}px`);
      card.style.setProperty('--after-y', `${offsetAfterY}px`);
    });
    
    card.addEventListener('mouseleave', () => {
      // Restaurar los valores y alineación de abanico original de forma fluida
      card.style.transform = '';
      card.style.setProperty('--after-x', '8px');
      card.style.setProperty('--after-y', '8px');
    });
  });
});
