# MoreMkt SPA — Plan de Construcción
## URL Final: morehdmkt.com/construccion

**Estado:** Carpeta creada, listos para escribir código.
**Archivos a crear:** `index.html`, `app.css`, `app.js` en esta misma carpeta.

---

## REGLA #1 — NO TOCAR
- `/index.html` → "Próximamente" en producción. Intacto.
- `/index-dark.html`, `/style.css`, `/style-dark.css` → no modificar.

---

## Stack
- HTML5 + CSS3 Vanilla + JS puro (sin frameworks)
- Google Fonts: **Montserrat** (Bold para títulos, Light/Regular para cuerpo)
- CDN: Phosphor Icons, QRCode.js (para el QR del footer)
- GitHub Pages para deploy automático

---

## Paleta de Colores

| Sección | Color | Hex |
|---|---|---|
| Global dark | Carbón | `#1a1a1a` |
| Global accent | Dorado | `#F4BA3C` |
| Tab Publicidad | Púrpura | `#4B1D61` |
| Tab Asesoría | Esmeralda | `#10B981` |
| Tab Capacitación | Dorado | `#F4BA3C` |
| Tab Soluciones | Cobalto | `#1D4ED8` |
| Fondo general | Blanco roto | `#FAFAFA` |
| Texto principal | Oscuro | `#1a1a1a` |
| Texto secundario | Gris | `#6B7280` |

---

## Estructura de Archivos

```
construccion/
├── index.html      ← SPA principal (toda la estructura HTML)
├── app.css         ← Design system completo + responsivo
├── app.js          ← Tabs, Modal booking, Carousel, QR code
└── PLAN.md         ← Este archivo
```

Assets existentes en `/SVG/`:
- `logo-amari.png` → logo dorado (usar en header sobre fondo oscuro)
- `logo-amari.svg` → logo vectorial
- `logo-full.svg`  → logo completo con tagline "STRATEGY & PERFORMANCE"

---

## Componentes a Construir (en orden)

### 1. Header Sticky
```html
<header class="site-header">
  <div class="header-inner">
    <a href="/" class="logo-link">
      <img src="../SVG/logo-amari.png" alt="MoreMkt" class="logo">
    </a>
    <nav class="tabs-nav" id="tabsNav">
      <button class="tab-btn active" data-tab="publicidad" data-color="#4B1D61">
        💼 Publicidad
      </button>
      <button class="tab-btn" data-tab="asesoria" data-color="#10B981">
        🎯 Asesoría
      </button>
      <button class="tab-btn" data-tab="capacitacion" data-color="#F4BA3C">
        🎓 Capacitación
      </button>
      <button class="tab-btn" data-tab="soluciones" data-color="#1D4ED8">
        🚀 Soluciones
      </button>
    </nav>
    <button class="hamburger" id="hamburger">☰</button>
  </div>
  <!-- Indicador de color de tab activo -->
  <div class="tab-indicator" id="tabIndicator"></div>
</header>
```

**Comportamiento:**
- Desktop: tabs horizontales centrados, indicador de color en borde inferior
- Mobile: hamburger → menú desplegable vertical
- Sticky: `position: sticky; top: 0; z-index: 100`
- Al cambiar tab: el `tab-indicator` anima su color al del tab activo

---

### 2. Hero Section
```html
<section class="hero" id="hero">
  <div class="hero-bg" id="heroBg"></div> <!-- cambia de color con el tab -->
  <div class="hero-content">
    <div class="hero-text">
      <span class="hero-badge" id="heroBadge">Publicidad Digital</span>
      <h1 class="hero-title" id="heroTitle">
        Estrategia de Paid Media<br>con enfoque en <em>resultados</em>
      </h1>
      <p class="hero-sub" id="heroSub">
        Campañas de alto rendimiento para marcas que quieren crecer.
      </p>
      <button class="hero-cta" id="heroCta">Ver planes →</button>
    </div>
    <div class="hero-photo">
      <!-- PNG con fondo transparente de Moreliz (pendiente de asset) -->
      <!-- Placeholder hasta recibir la foto -->
      <div class="hero-photo-placeholder">
        <div class="photo-silhouette"></div>
      </div>
    </div>
  </div>
</section>
```

**Comportamiento JS:**
```js
const heroContent = {
  publicidad: {
    badge: 'Publicidad Digital',
    title: 'Estrategia de Paid Media<br>con enfoque en <em>resultados</em>',
    sub: 'Campañas de alto rendimiento para marcas que quieren crecer.',
    cta: 'Ver planes',
    color: '#4B1D61'
  },
  asesoria: {
    badge: 'Consultoría Estratégica',
    title: 'Tomá decisiones basadas<br>en <em>datos reales</em>',
    sub: 'Asesoramiento personalizado para escalar tu negocio.',
    cta: 'Agendar consulta',
    color: '#10B981'
  },
  capacitacion: {
    badge: 'Formación Profesional',
    title: 'Aprendé marketing digital<br>de forma <em>práctica</em>',
    sub: 'Cursos y mentorías para equipos y profesionales.',
    cta: 'Ver cursos',
    color: '#F4BA3C'
  },
  soluciones: {
    badge: 'Soluciones Digitales',
    title: 'Transformación digital<br><em>end-to-end</em>',
    sub: 'Proyectos de alto impacto con acompañamiento presencial.',
    cta: 'Agendar diagnóstico',
    color: '#1D4ED8'
  }
}
```

---

### 3. Tab: Publicidad (Púrpura #4B1D61)

**3 Pricing Cards:**

```
[BASIC]          [MEDIUM ★ Popular]    [PREMIUM]
$XXX/mes         $XXX/mes              $XXX/mes
─────────        ─────────────         ─────────
✓ Feature 1      ✓ Todo Basic          ✓ Todo Medium
✓ Feature 2      ✓ Feature extra 1     ✓ Feature extra 1
✓ Feature 3      ✓ Feature extra 2     ✓ Feature extra 2
                 ✓ Feature extra 3     ✓ Soporte prioritario
                                       ✓ Gestor dedicado
[Contratar]      [Contratar]           [Contratar]
```

- Card "Medium" → borde púrpura + badge "Más popular" + escala ligeramente mayor
- Hover en todas: `translateY(-8px)` + sombra púrpura
- Botón "Contratar" → placeholder (alerta + texto "Próximamente / Contactar por WhatsApp")

---

### 4. Tab: Asesoría (Esmeralda #10B981)

**Lista de servicios:**
```
🔍 Auditoría de Campañas      → Revisión completa de cuentas activas
📊 Estrategia de Medios       → Plan de medios personalizado
🎯 Optimización de Conversión → CRO y análisis de funnel
📈 Reportes y Métricas        → Dashboard y KPIs customizados
🤝 Consultoría Mensual        → Reuniones periódicas de seguimiento
```

- Cada servicio: ícono + título + descripción corta + precio placeholder
- Botón **"Agendar Asesoría"** → abre `BookingModal` (ver sección Modal)

---

### 5. Tab: Capacitación (Dorado #F4BA3C)

**Cards de cursos (grid 2x2 en desktop, 1 col en mobile):**
```
[Curso 1]  [Curso 2]
[Curso 3]  [Curso 4]
```

Cada card tiene:
- Imagen placeholder (gradient con ícono)
- Título del curso
- Duración (ej. "8 semanas")
- Precio individual
- Checkbox de selección para el pack

**Lógica 3+1 (JS):**
```js
let selectedCourses = 0

checkboxes.forEach(cb => {
  cb.addEventListener('change', () => {
    selectedCourses = document.querySelectorAll('.course-check:checked').length
    if (selectedCourses >= 3) {
      promoBar.classList.add('visible') // banner "¡Mentoría gratis incluida!"
      packBtn.textContent = `Comprar pack (${selectedCourses} cursos + Mentoría)`
    } else {
      promoBar.classList.remove('visible')
      packBtn.textContent = `Comprar pack seleccionado`
    }
  })
})
```

---

### 6. Tab: Soluciones Digitales (Cobalto #1D4ED8)

**Copy high-ticket:**
- Headline impactante sobre transformación digital
- Bullets de valor diferencial
- Precio "A convenir / Desde $XXX"

**Timeline visual del proceso:**
```
[1. DIAGNÓSTICO] ──── [2. PRESUPUESTO] ──── [3. VISITA PRESENCIAL]
  Sesión online          Propuesta a           Implementación
  60 min gratis          medida               con presencia
```

CSS: línea horizontal conectando los 3 nodos (en mobile: vertical)

- Botón **"Agendar Sesión de Diagnóstico"** → abre `BookingModal`

---

### 7. Modal de Booking (Placeholder MP)

```html
<div class="booking-modal" id="bookingModal">
  <div class="modal-overlay" onclick="closeModal()"></div>
  <div class="modal-card">
    <button class="modal-close" onclick="closeModal()">✕</button>
    
    <!-- STEP 1: Resumen del servicio -->
    <div class="modal-step" id="step1">
      <h2>Confirmá tu reserva</h2>
      <div class="service-summary" id="serviceSummary">
        <!-- se llena dinámicamente según botón que disparó -->
      </div>
      <button class="btn-pay" onclick="simulatePay()">
        💳 Pagar con Mercado Pago
      </button>
      <p class="modal-note">Placeholder — integración MP próximamente</p>
    </div>

    <!-- STEP 2: Pago aprobado → calendario desbloqueado -->
    <div class="modal-step hidden" id="step2">
      <div class="payment-success">
        <span class="success-icon">✓</span>
        <h2>¡Pago aprobado!</h2>
        <p>Seleccioná tu fecha y hora:</p>
      </div>
      <div class="calendar-placeholder">
        <!-- Widget de Instalaciones SL irá aquí -->
        <div class="calendar-mock">
          <p>📅 Motor de agenda (Instalaciones SL)</p>
          <p class="calendar-note">Widget a integrar cuando se comparta el código</p>
        </div>
      </div>
    </div>

    <!-- STEP 3: Confirmación -->
    <div class="modal-step hidden" id="step3">
      <span class="success-icon">🎉</span>
      <h2>¡Reserva confirmada!</h2>
      <p>Te enviamos un mail a <strong id="confirmEmail"></strong> con el link de la reunión.</p>
      <button onclick="closeModal()">Cerrar</button>
    </div>
  </div>
</div>
```

**JS `simulatePay()`:**
```js
function simulatePay() {
  // En producción: window.open(MP_CHECKOUT_URL, '_blank')
  // Por ahora: simular aprobación tras 1.5s
  showLoadingState()
  setTimeout(() => {
    goToStep(2) // desbloquear calendario
  }, 1500)
}
```

---

### 8. Social Proof Carousel

```html
<section class="social-proof">
  <p class="proof-label">Empresas que confían en MoreMkt</p>
  <div class="logos-track-wrapper">
    <div class="logos-track" id="logosTrack">
      <!-- logos duplicados para loop infinito -->
      <div class="logo-item"><img src="..." alt="Cliente 1"></div>
      <!-- ... x8 logos placeholder ... -->
    </div>
  </div>
</section>
```

**CSS clave:**
```css
.logos-track {
  display: flex;
  gap: 3rem;
  animation: scroll-logos 20s linear infinite;
  width: max-content;
}
@keyframes scroll-logos {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.logo-item img {
  filter: grayscale(100%) opacity(0.5);
  transition: filter 0.3s ease;
}
.logo-item img:hover {
  filter: grayscale(0%) opacity(1);
}
```

Placeholders: 8 rectángulos grises con texto "CLIENTE X" hasta recibir logos reales.

---

### 9. Footer Corporativo

```html
<footer class="site-footer">
  <div class="footer-grid">
    <div class="footer-brand">
      <img src="../SVG/logo-amari.png" alt="MoreMkt">
      <p>Strategy & Performance</p>
    </div>
    <div class="footer-contact">
      <h4>Contacto</h4>
      <p>📞 11 7642-6155</p>
      <p>✉️ hola@morehdmkt.com</p>
    </div>
    <div class="footer-social">
      <h4>Redes</h4>
      <a href="#" class="social-link">Instagram</a>
      <a href="#" class="social-link">LinkedIn</a>
    </div>
    <div class="footer-qr">
      <h4>Contacto rápido</h4>
      <div id="qrCode"></div>
      <p>Escaneá para contactarnos</p>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© 2025 MoreMkt. Todos los derechos reservados.</p>
  </div>
</footer>
```

**QR JS (qrcode.js CDN):**
```js
new QRCode(document.getElementById("qrCode"), {
  text: "https://wa.me/5491176426155",
  width: 100,
  height: 100,
  colorDark: "#1a1a1a",
  colorLight: "#ffffff"
})
```

---

### 10. WhatsApp FAB

```html
<a href="https://wa.me/5491176426155"
   target="_blank"
   class="whatsapp-fab"
   aria-label="Contactar por WhatsApp">
  <svg><!-- WhatsApp icon SVG --></svg>
</a>
```

```css
.whatsapp-fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  background: #25D366;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(37,211,102,0.4);
  animation: pulse-wa 2s infinite;
  z-index: 999;
}
@keyframes pulse-wa {
  0%, 100% { box-shadow: 0 4px 20px rgba(37,211,102,0.4); }
  50% { box-shadow: 0 4px 30px rgba(37,211,102,0.7); }
}
```

---

## Lógica JS Principal — Tab Switching

```js
const tabs = document.querySelectorAll('.tab-btn')
const panels = document.querySelectorAll('.tab-panel')
const indicator = document.getElementById('tabIndicator')

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab
    const color = tab.dataset.color

    // Actualizar botones
    tabs.forEach(t => t.classList.remove('active'))
    tab.classList.add('active')

    // Actualizar panels
    panels.forEach(p => p.classList.remove('active'))
    document.getElementById(`panel-${target}`).classList.add('active')

    // Actualizar indicador de color
    indicator.style.background = color
    document.documentElement.style.setProperty('--tab-color', color)

    // Actualizar hero
    updateHero(target)
  })
})
```

---

## Notas de Implementación

### Pendiente para siguiente iteración:
1. **Foto de Moreliz**: Reemplazar `.hero-photo-placeholder` con `<img src="moreliz.png">`
2. **Logos de clientes**: Reemplazar placeholders en el carousel
3. **Precios reales**: Actualizar los `$XXX` en pricing cards
4. **Links de redes**: Actualizar `href="#"` en footer
5. **Mercado Pago**: Reemplazar `simulatePay()` con checkout real cuando se comparta el código
6. **Instalaciones SL**: Reemplazar `.calendar-mock` con el widget real

### Detalles técnicos:
- **Animaciones**: `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)` en todos los elementos interactivos
- **Responsivo breakpoints**: 375px (mobile), 768px (tablet), 1024px (desktop), 1440px (wide)
- **Accesibilidad**: `aria-label` en FAB, `role="tablist"` en nav, `aria-selected` en tabs
- **Performance**: Imágenes lazy-load, CSS variables para temas, transiciones GPU-aceleradas

---

## Para continuar desde otra PC

1. Clonar o pullear el repo: `git pull origin main`
2. Abrir `construccion/index.html` en el browser directamente
3. Los archivos a crear son: `index.html`, `app.css`, `app.js` en esta carpeta
4. Este `PLAN.md` tiene toda la estructura y el código base para construir cada componente
