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


// --- 4. MODAL DE RESERVAS (Simplificado con Fallback de WhatsApp) ---
const modal = document.getElementById('bookingModal');
const modalOverlay = document.getElementById('modalOverlay');
let modalService = '';

function openModal(service, detail) {
  modalService = detail;
  document.getElementById('modal-service-label').textContent = detail;
  
  // Limpiar form
  const form = document.getElementById('modal-booking-form');
  if(form) form.reset();
  
  // Check button
  updatePayBtn();
  
  document.querySelectorAll('.modal-step').forEach(s => s.classList.add('hidden'));
  document.getElementById('step1').classList.remove('hidden');
  
  modal.classList.add('open');
  document.body.style.overflow = 'hidden'; // Evitar scroll
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

modalOverlay.addEventListener('click', closeModal);

function updatePayBtn() {
  const btn = document.getElementById('modal-btn-pay');
  const name = document.getElementById('modal-name')?.value.trim();
  const phone = document.getElementById('modal-phone')?.value.trim();
  const email = document.getElementById('modal-email')?.value.trim();
  
  // Simplificamos sin calendario obligatorio por ahora, habilitamos si hay datos de contacto
  if (btn) {
    btn.disabled = !(name && phone && email);
  }
}

['modal-name','modal-phone','modal-email'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updatePayBtn);
});

function submitModalBooking() {
  const name = document.getElementById('modal-name').value;
  const phone = document.getElementById('modal-phone').value;
  const email = document.getElementById('modal-email').value;
  
  // Como no hay backend de firebase todavía, mandamos directo a WhatsApp (Fallback)
  const waText = encodeURIComponent(
    `Hola MoreMKT!\nQuiero agendar:\n📋 *${modalService}*\n\n👤 ${name}\n📱 ${phone}\n📧 ${email}`
  );
  
  // Mostrar paso 3
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step3').classList.remove('hidden');
  
  // Abrir WhatsApp en nueva pestaña
  window.open(`https://wa.me/5491176426155?text=${waText}`, '_blank');
}

// Exponer global
window.openModal = openModal;
window.closeModal = closeModal;
window.submitModalBooking = submitModalBooking;
