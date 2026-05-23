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
    openSoonModal("Esta sección de cursos y armado de packs de capacitación se encuentra actualmente en construcción. ¡Muy pronto podrás seleccionar y comprar tus cursos online!");
  });
}
if(packBtnTop) {
  packBtnTop.addEventListener('click', () => {
    openSoonModal("Esta sección de capacitación y mentorías profesionales se encuentra actualmente en construcción. ¡Muy pronto podrás acceder a toda la oferta formativa de MoreMKT!");
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
const PROJECT_ID = 'moremkt-reservas';
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://localhost:5001/${PROJECT_ID}/us-central1/api`
    : `https://api-hchn7up7oq-uc.a.run.app`;

const modal = document.getElementById('bookingModal');
const modalOverlay = document.getElementById('modalOverlay');
let modalService = '';
let modalPrice = '';
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function openModal(service, detail, price) {
  modalService = detail;
  modalPrice = price || '$70.000 ARS';
  document.getElementById('modal-service-label').textContent = detail;
  
  // Actualizar precio en la vista del modal
  const priceEl = document.getElementById('modal-sum-price');
  if (priceEl) {
    priceEl.textContent = modalPrice;
  }
  
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
        
        // Si el precio es a convenir o gratis, cambiamos el texto del botón para que no mencione "Pagar"
        const isFreeOrCustom = modalPrice.includes('A convenir') || 
                               modalPrice.includes('convenir') || 
                               modalPrice.includes('Gratis') || 
                               modalPrice.includes('gratis');
                               
        if (isFreeOrCustom) {
            btnPay.innerHTML = '📩 Confirmar y Agendar';
        } else {
            btnPay.innerHTML = '💳 Confirmar y Pagar';
        }
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

// --- 7. LÓGICA DE MENÚ HAMBURGUESA EN MÓVIL ---
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const tabsMenu = document.querySelector('.tabs-menu');

  if (hamburger && tabsMenu) {
    hamburger.addEventListener('click', () => {
      tabsMenu.classList.toggle('open');
      hamburger.classList.toggle('active');
      
      // Alternar ícono entre hamburguesa ☰ y cerrar ✕
      if (hamburger.classList.contains('active')) {
        hamburger.textContent = '✕';
      } else {
        hamburger.textContent = '☰';
      }
    });

    // Cerrar el menú automáticamente al hacer clic en cualquier pestaña
    const tabButtons = tabsMenu.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabsMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.textContent = '☰';
      });
    });
  }
});

// --- 8. LÓGICA DE DETALLES DEL PACK (POPUP DINÁMICO) ---
const packDetails = {
  'ventas-ya': {
    title: 'Pack Inicial: Ventas Ya',
    subtitle: 'La base sólida para activar tus conversiones y expandir tu negocio',
    description: '¿Querés empezar a vender online, validar tu mercado y comprobar el poder de la pauta digital en tu negocio? Este plan es ideal para vos. Es el impulso inicial que necesitás para empezar a facturar de forma constante, optimizar tu presupuesto y sentar las bases de tu crecimiento.',
    price: '$350.000 ARS / mes',
    color: '#4B1D61',
    features: [
      '<strong>Estrategia en una plataforma publicitaria:</strong> Nos enfocamos al 100% en la red que mejor se adapte a tu público objetivo (a elegir entre Meta Ads, Google Ads o TikTok Ads).',
      '<strong>Lanzamiento de 3 campañas activas:</strong> Diseñadas estratégicamente para atraer clientes calificados desde el primer día.',
      '<strong>Soporte continuo y transparente:</strong> Comunicación directa y resolución de dudas vía WhatsApp para que nunca estés a ciegas.',
      '<strong>Monitoreo y optimización constante:</strong> Feedback de rendimiento cada 3 días para ajustar lo que sea necesario y maximizar tu inversión.',
      '<strong>Reporte mensual de resultados:</strong> Un análisis limpio, claro y sin tecnicismos para que veas exactamente cómo rinde tu dinero.'
    ],
    bonus: 'Te entregamos una hoja de ruta estratégica para tus primeros 3 meses de pauta, alineada 100% con los objetivos comerciales de tu marca de regalo.'
  },
  'posicionamiento': {
    title: 'Pack de Posicionamiento',
    subtitle: 'Estructura estratégica y automatización para marcas listas para escalar',
    description: 'Ya sabés que el marketing digital funciona, ahora necesitás dar el siguiente paso: dejar de improvisar, organizar tu marca mes a mes y transformar tu comunidad en facturación real. Si crear contenido te está sacando tiempo vital para operar y hacer crecer tu negocio, nosotros nos encargamos de todo. Delegá la estrategia y recuperá el control.',
    price: 'A convenir',
    color: '#F4BA3C',
    features: [
      '<strong>Estrategia Multiplataforma (2 Ads Networks):</strong> Maximizamos tu alcance gestionando campañas en dos plataformas en simultáneo (a elegir entre Meta Ads, Google Ads o TikTok Ads).',
      '<strong>Pauta publicitaria sin límite de campañas:</strong> Creamos y optimizamos todos los anuncios necesarios en base a tus objetivos comerciales, sin techos.',
      '<strong>Gestión Integral de Redes (Community Management):</strong> Planificación, organización y publicación de contenido estratégico para mantener tu comunidad activa y comprometida.',
      '<strong>Diseño de Identidad Estética:</strong> Creación de una línea visual coherente, profesional y alineada a la esencia de tu marca para destacar en el feed.',
      '<strong>Producción de Contenido a la Medida:</strong> Generación de piezas y formatos específicos pensados exclusivamente para cumplir tus metas de posicionamiento y ventas.',
      '<strong>Soporte y Optimización en Tiempo Real:</strong> Monitoreo diario con feedback de rendimiento cada 3 días; Canal de comunicación directo vía WhatsApp para resolver dudas al instante; Reporte mensual detallado con análisis de métricas clave y próximos pasos.'
    ],
    bonus: null
  },
  'producciones': {
    title: 'Pack Producciones',
    subtitle: 'La experiencia premium definitiva: contenido audiovisual de alta gama y pauta estratégica sin límites',
    description: 'Comprendés perfectamente que tus redes sociales son la vidriera principal de tu negocio y que una estética impecable se traduce directamente en clientes de alto valor. Para marcas que no se conforman con lo básico y exigen una atención 100% personalizada, diseñamos esta solución integral. Nos encargamos desde la creación visual en el mundo real hasta la conversión en digital.',
    price: 'A convenir',
    color: '#1D3557',
    features: [
      '<strong>Producción de Contenido Audiovisual:</strong> Dirección de arte, fotografía de producto y rodaje/edición de video en alta calidad para que tu marca se vea costosa y profesional.',
      '<strong>Estrategia Publicitaria Multiplataforma Avanzada:</strong> Gestión y optimización de campañas sin tope en las redes que dominen tu mercado (Meta Ads, Google Ads y TikTok Ads).',
      '<strong>Diseño de Identidad Estética Exclusiva:</strong> Desarrollo visual a medida para garantizar un feed e historias con total coherencia, elegancia y magnetismo.',
      '<strong>Gestión Integral y Community Management:</strong> Planificación, copywriting estratégico, organización de grilla y publicación diaria de los contenidos generados.',
      '<strong>Atención y Soporte de Alta Prioridad:</strong> Canal de comunicación directa vía WhatsApp con respuestas prioritarias; Monitoreo diario con feedback estratégico de rendimiento cada 3 días; Reportes mensuales detallados con análisis de ROI y métricas clave de conversión.'
    ],
    bonus: null
  }
};

const detailsModal = document.getElementById('detailsModal');
const detailsOverlay = document.getElementById('detailsOverlay');

function openDetailsModal(packKey) {
  const pack = packDetails[packKey];
  if (!pack) return;
  
  const contentEl = document.getElementById('details-modal-content');
  if (!contentEl) return;
  
  let featuresHtml = pack.features.map(f => `
    <li style="font-size: 0.88rem; color: #374151; margin-bottom: 0.8rem; display: flex; align-items: flex-start; gap: 10px; line-height: 1.45;">
      <i class="ph ph-check-circle-fill" style="color: ${pack.color}; font-size: 1.1rem; flex-shrink: 0; margin-top: 2px;"></i>
      <span>${f}</span>
    </li>
  `).join('');
  
  let bonusHtml = pack.bonus ? `
    <div style="background: #fdf5df; border: 1px dashed #F4BA3C; border-radius: 12px; padding: 1rem; margin-bottom: 1.8rem; display: flex; gap: 10px; align-items: flex-start;">
      <span style="font-size: 1.3rem; line-height: 1;">🔥</span>
      <p style="font-size: 0.8rem; color: #78350f; line-height: 1.4; margin: 0; font-weight: 600;">
        <strong>Bonus exclusivo:</strong> ${pack.bonus}
      </p>
    </div>
  ` : '';

  contentEl.innerHTML = `
    <div style="text-align: left; padding: 0.5rem 0;">
      <span style="color: ${pack.color}; font-size: 0.72rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; display: inline-block; margin-bottom: 0.5rem; background: ${pack.color}15; padding: 4px 10px; border-radius: 100px;">
        MoreMKT Premium Pack
      </span>
      <h2 style="font-size: 1.8rem; font-weight: 900; color: #111827; margin-bottom: 0.4rem;">${pack.title}</h2>
      <p style="font-size: 0.85rem; font-weight: 600; color: #6b7280; margin-bottom: 1.2rem; line-height: 1.35;">${pack.subtitle}</p>
      
      <p style="font-size: 0.88rem; color: #4b5563; line-height: 1.5; margin-bottom: 1.8rem; background: #f9fafb; padding: 1rem; border-radius: 12px; border: 1px solid #e5e7eb;">
        ${pack.description}
      </p>
      
      <h4 style="font-size: 0.9rem; font-weight: 800; color: #111827; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px;">¿Qué incluye este pack?</h4>
      <ul style="list-style: none; margin-bottom: 1.8rem; padding: 0;">
        ${featuresHtml}
      </ul>
      
      ${bonusHtml}
      
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-top: 1.2rem; border-top: 1px solid #e5e7eb; margin-top: 1.2rem;">
        <div>
          <span style="font-size: 0.75rem; color: #6b7280; display: block; font-weight: 500;">Inversión mensual</span>
          <strong style="font-size: 1.4rem; font-weight: 900; color: #111827;">${pack.price}</strong>
        </div>
        <button class="btn-pay" style="margin-top: 0; width: auto; padding: 12px 30px; background: ${pack.color === '#F4BA3C' ? '#111827' : pack.color}; color: #fff;" onclick="closeDetailsModal(); openModal('publicidad', '${pack.title}', '${pack.price}')">
          📩 Agendar Ahora
        </button>
      </div>
    </div>
  `;
  
  detailsModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetailsModal() {
  detailsModal.classList.remove('open');
  document.body.style.overflow = '';
}

if (detailsOverlay) {
  detailsOverlay.addEventListener('click', closeDetailsModal);
}

// Exponer globales
window.openDetailsModal = openDetailsModal;
window.closeDetailsModal = closeDetailsModal;

// --- 9. MODALES PERSONALIZADOS Y FORMULARIO DE SOLUCIONES ---
const soonModal = document.getElementById('soonModal');
const soonOverlay = document.getElementById('soonOverlay');
const solucionesModal = document.getElementById('solucionesModal');
const solucionesOverlay = document.getElementById('solucionesOverlay');

function openSoonModal(message) {
  const soonMessage = document.getElementById('soon-message');
  if (soonMessage) {
    soonMessage.textContent = message;
  }
  if (soonModal) {
    soonModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeSoonModal() {
  if (soonModal) {
    soonModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

if (soonOverlay) {
  soonOverlay.addEventListener('click', closeSoonModal);
}

function openSolucionesModal() {
  const form = document.getElementById('soluciones-form');
  if (form) form.reset();
  
  if (solucionesModal) {
    solucionesModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeSolucionesModal() {
  if (solucionesModal) {
    solucionesModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

if (solucionesOverlay) {
  solucionesOverlay.addEventListener('click', closeSolucionesModal);
}

function submitSolucionesForm(e) {
  e.preventDefault();
  
  const name = document.getElementById('sol-name').value.trim();
  const phone = document.getElementById('sol-phone').value.trim();
  const email = document.getElementById('sol-email').value.trim();
  const message = document.getElementById('sol-message').value.trim();
  
  if (!name || !phone || !email || !message) {
    alert('Por favor completa todos los campos obligatorios.');
    return;
  }
  
  const waText = encodeURIComponent(
    `¡Hola MoreMKT!\nQuiero solicitar un *Diagnóstico Online Gratis*:\n\n👤 *Nombre:* ${name}\n📱 *WhatsApp:* ${phone}\n📧 *Email:* ${email}\n💬 *Consulta/Tema:* ${message}`
  );
  
  closeSolucionesModal();
  window.open(`https://wa.me/5491176426155?text=${waText}`, '_blank');
}

// Exponer globales
window.openSoonModal = openSoonModal;
window.closeSoonModal = closeSoonModal;
window.openSolucionesModal = openSolucionesModal;
window.closeSolucionesModal = closeSolucionesModal;
window.submitSolucionesForm = submitSolucionesForm;
