# MoreMKT — Plataforma Web Oficial
### `morehdmkt.com` · Strategy & Performance

> Plataforma digital completa para la agencia **MoreMKT** de Moreliz Hurtado. Incluye sitio web público con sistema de reservas, pasarela de pagos y panel de administración.

---

## 🌐 URLs en Producción

| Recurso | URL |
|---------|-----|
| Sitio principal | [morehdmkt.com](https://morehdmkt.com) |
| App de servicios | [morehdmkt.com/construccion](https://morehdmkt.com/construccion) |
| Panel admin (login) | [morehdmkt.com/admin/login.html](https://morehdmkt.com/admin/login.html) |
| API Backend | `https://api-hchn7up7oq-uc.a.run.app` |
| Firebase Console | [console.firebase.google.com/project/moremkt-reservas](https://console.firebase.google.com/project/moremkt-reservas) |

---

## 📁 Estructura del Proyecto

```
MoreMKT/
│
├── construccion/               ← SPA Principal (el sitio de servicios)
│   ├── index.html              ← Estructura HTML completa
│   ├── app.css                 ← Design system + estilos (30KB)
│   ├── app.js                  ← Toda la lógica frontend (31KB)
│   └── Fotos/                  ← Imágenes reales de la marca
│
├── admin/                      ← Panel de Administración
│   ├── login.html              ← Página de login
│   ├── dashboard.html          ← Panel principal
│   ├── css/
│   │   └── admin.css           ← Estilos del panel
│   └── js/
│       ├── login.js            ← Lógica de autenticación
│       └── dashboard.js        ← Lógica del panel (horarios, reservas)
│
├── functions/                  ← Backend (Firebase Cloud Functions)
│   ├── index.js                ← API completa con Express (21KB)
│   ├── package.json            ← Dependencias del backend
│   └── .env                    ← Variables de entorno (NO subir a Git)
│
├── SVG/                        ← Logos vectoriales de la marca
├── firebase.json               ← Configuración de Firebase
├── firestore.rules             ← Reglas de seguridad de Firestore
├── .firebaserc                 ← Proyecto de Firebase vinculado
├── .gitignore                  ← Protección de archivos sensibles
├── robots.txt                  ← Protección SEO del panel admin
└── CNAME                       ← Dominio personalizado (morehdmkt.com)
```

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Uso |
|-----------|-----|
| HTML5 + CSS3 Vanilla | Estructura y diseño (sin frameworks) |
| JavaScript ES6+ puro | Toda la lógica de UI y llamadas a API |
| Google Fonts (Montserrat) | Tipografía corporativa |
| Phosphor Icons | Íconos de UI |
| QRCode.js | QR de WhatsApp en footer |
| GitHub Pages | Hosting del sitio estático |

### Backend
| Tecnología | Uso |
|-----------|-----|
| Node.js 22 | Runtime del servidor |
| Express.js | Framework HTTP |
| Firebase Cloud Functions (Gen 2) | Hosting del backend serverless |
| Firebase Firestore | Base de datos |
| bcryptjs | Hash de contraseñas |
| jsonwebtoken | Autenticación JWT del panel admin |
| express-rate-limit | Protección contra fuerza bruta |
| Mercado Pago SDK v2 | Pasarela de pagos (configurada) |

---

## ✅ Funcionalidades Construidas

### Sitio Público (`/construccion`)

- **Tab Publicidad** — 3 packs de servicios con precios, detalles expandibles y sistema de agendado
- **Tab Asesoría** — 4 servicios con modal de reserva integrado (calendario + horarios desde Firebase)
- **Tab Capacitación** — Grid de cursos con lógica "pack 3+1" (3 cursos + mentoría gratis), popup "Muy pronto"
- **Tab Soluciones** — Timeline de proceso + formulario de Diagnóstico Online Gratis
- **Modal de reservas** — Calendario interactivo, slots desde la API, datos del cliente, pago vía MP
- **Fallback a WhatsApp** — Si MP falla, redirige automáticamente con datos prellenados
- **Formulario de diagnóstico** — Guarda el lead en Firestore + abre WhatsApp con mensaje preparado
- **Testimoniales infinitos** — Carousel CSS puro con duplicación
- **Footer completo** — Contacto, redes sociales (LinkedIn, Instagram, WhatsApp), QR, créditos
- **WhatsApp FAB** — Botón flotante con animación de pulso
- **Responsive** — Menú hamburguesa en mobile, grid adaptativo
- **Resultado de pago** — Banner inteligente post-Mercado Pago (aprobado / pendiente / rechazado)

### Panel de Administración (`/admin`)

- **Login seguro** — JWT con expiración de 8 horas, protección contra fuerza bruta
- **Configuración de horarios** — Habilitar días, rangos horarios, duración de sesión
- **Bloqueo de horarios** — Bloquear fechas/horas específicas con motivo
- **Gestión de reservas** — Ver todas las reservas con estado (confirmada/pendiente/cancelada)
- **Configuración de precios** — Actualizar el precio de la asesoría individual desde el panel
- **Cierre de sesión seguro** — Limpia token y redirige al login

### Backend API (Cloud Functions)

| Endpoint | Método | Auth | Descripción |
|---------|--------|------|-------------|
| `/admin/login` | POST | ❌ | Login del administrador |
| `/admin/setup` | POST | ❌ | **DESHABILITADO** (410) |
| `/admin/config` | GET | ✅ JWT | Obtener configuración y horarios |
| `/admin/config/availability` | PUT | ✅ JWT | Actualizar disponibilidad semanal |
| `/admin/config/pricing` | PUT | ✅ JWT | Actualizar precio de asesoría |
| `/admin/blocks` | POST | ✅ JWT | Crear bloqueo de horario |
| `/admin/blocks/:id` | DELETE | ✅ JWT | Eliminar bloqueo |
| `/admin/bookings` | GET | ✅ JWT | Listar reservas |
| `/admin/leads` | GET | ✅ JWT | Ver leads del formulario |
| `/getAvailableSlots` | GET | ❌ | Slots disponibles por fecha |
| `/createBooking` | POST | ❌ | Crear reserva + checkout MP |
| `/mercadopagoWebhook` | POST | ❌ | Webhook de notificaciones MP |
| `/saveLead` | POST | ❌ | Guardar lead de diagnóstico |

---

## 🔐 Seguridad Implementada

| Medida | Detalle |
|--------|---------|
| JWT con clave fuerte | 64 caracteres aleatorios en variable de entorno |
| Rate limiting | 10 intentos login/15min · 5 reservas/hora · 5 leads/hora |
| CORS restringido | Solo acepta peticiones desde `morehdmkt.com` |
| Headers HTTP de seguridad | X-Frame-Options, X-XSS-Protection, X-Content-Type-Options, Referrer-Policy |
| Sanitización de inputs | Todos los datos de usuario se limpian antes de guardar |
| Validación backend | Email, fecha futura, longitud máxima de campos |
| XSS protegido en admin | `escapeHtml()` en todos los datos dinámicos del dashboard |
| 401 → redirect automático | Si la sesión expira, redirige al login sin error |
| Firestore bloqueado | Reglas que deniegan todo acceso directo desde el cliente |
| Setup deshabilitado | El endpoint de creación inicial devuelve 410 permanente |
| Webhook verificado | Mercado Pago: verifica el pago vía API antes de confirmar reservas |
| Body limit 10KB | Previene ataques de payload gigante |
| .gitignore | El `.env` con secretos nunca se sube a GitHub |
| robots.txt | El panel `/admin` no aparece en Google |

---

## 🚀 Cómo Hacer Deploy

### Subir cambios al sitio (GitHub Pages)

```powershell
cd E:\MoreMKT
git add .
git commit -m "descripción del cambio"
git push origin main
```

### Actualizar el backend (Cloud Functions)

```powershell
cd E:\MoreMKT
firebase deploy --only "functions,firestore:rules"
```

### Instalar dependencias nuevas del backend

```powershell
cd E:\MoreMKT\functions
npm install
cd E:\MoreMKT
firebase deploy --only "functions"
```

---

## ⚙️ Variables de Entorno (`functions/.env`)

```env
JWT_SECRET=<clave de 64 caracteres — no cambiar sin redeploy>
MP_ACCESS_TOKEN=<token de producción de Mercado Pago — vacío hasta activar>
```

> ⚠️ **IMPORTANTE**: Este archivo NUNCA debe subirse a GitHub. El `.gitignore` lo protege automáticamente.

---

## 🔑 Acceso al Panel de Administración

- **URL:** https://morehdmkt.com/admin/login.html
- **Email:** `hola@morehdmkt.com`
- **Contraseña:** La que se configuró en el setup inicial

---

## 📦 Lo que Falta Construir

Ver sección **ROADMAP** más abajo.

---

## 🗺️ ROADMAP — Próximas Funcionalidades

### 🔴 Prioritario
| Feature | Descripción |
|---------|-------------|
| **Activar Mercado Pago** | Conseguir el Access Token de producción en mercadopago.com y cargarlo en `functions/.env` |
| **Emails de confirmación** | Cuando se confirma una reserva, enviar email automático al cliente con los detalles (requiere integrar SendGrid o Resend) |
| **Notificación al admin** | Cuando entra una reserva nueva, que le llegue un email o WhatsApp a Moreliz |

### 📊 Analytics & Tracking de Marketing (Pendiente completo)

Todo el ecosistema de medición está sin conectar. Es crítico para una agencia de marketing digital.

#### Google
| Feature | Descripción |
|---------|-------------|
| **Google Analytics 4 (GA4)** | Instalar el tag de GA4 en todas las páginas. Medir sesiones, usuarios, fuentes de tráfico, páginas más vistas y tasa de rebote |
| **Google Tag Manager (GTM)** | Instalar GTM como contenedor central de todos los tags. Permite agregar/modificar pixels sin tocar código |
| **Google Ads — Conversión de reserva** | Disparar el evento de conversión de Google Ads cuando un usuario completa una reserva (pago aprobado o formulario enviado) |
| **Google Ads — Remarketing** | Instalar el pixel de audiencias de Google para poder hacer remarketing a visitantes del sitio |
| **Google Search Console** | Verificar el dominio para monitorear posicionamiento orgánico, errores de indexado y búsquedas que traen tráfico |

#### Meta (Facebook / Instagram)
| Feature | Descripción |
|---------|-------------|
| **Meta Pixel (Pixel de Facebook)** | Instalar el Pixel de Meta en todas las páginas para trackear visitas, leads y compras |
| **Evento `Lead`** | Disparar `fbq('track', 'Lead')` cuando alguien envía el formulario de Diagnóstico Online |
| **Evento `Purchase`** | Disparar `fbq('track', 'Purchase', {value, currency})` cuando se confirma un pago de Mercado Pago |
| **Evento `InitiateCheckout`** | Disparar cuando alguien abre el modal de reserva (indicador de intención alta) |
| **Conversions API (CAPI)** | Enviar eventos de conversión también desde el servidor (backend) para sobrevivir bloqueadores de cookies |
| **Audiencias personalizadas** | Crear audiencias de: visitantes del sitio, personas que iniciaron checkout, clientes que pagaron |

#### TikTok
| Feature | Descripción |
|---------|-------------|
| **TikTok Pixel** | Instalar el pixel para poder pautar en TikTok Ads con datos de comportamiento del sitio |
| **Eventos de conversión TikTok** | `ViewContent`, `Lead`, `PlaceAnOrder` en los mismos puntos que Meta |

#### Configuración recomendada
```
GTM (contenedor central)
 ├── GA4 tag
 ├── Meta Pixel + eventos
 ├── Google Ads conversion
 ├── TikTok Pixel
 └── Remarketing tags
```
> **Nota:** Todo debería gestionarse desde Google Tag Manager para no tocar el código cada vez que se agrega un nuevo pixel.

---

### 🟡 Siguiente fase
| Feature | Descripción |
|---------|-------------|
| **Ver leads en el panel** | Agregar una sección en el dashboard para ver los formularios de Diagnóstico Online recibidos |
| **Cancelar / reprogramar reservas** | Botones en el panel para gestionar el estado de cada reserva |
| **Sección Capacitación completa** | Habilitar la compra real de packs de cursos con MP |
| **Estadísticas en el panel** | Gráficos de reservas por mes, ingresos, tasa de conversión |

### 🟢 Mejoras futuras
| Feature | Descripción |
|---------|-------------|
| **sitemap.xml** | Para mejorar el indexado en Google |
| **Logos de clientes reales** | Reemplazar los testimoniales de ejemplo con logos reales |
| **Recordatorio automático** | Email 24hs antes de la sesión recordando la reserva |
| **Panel de leads** | Gestión de los diagnósticos solicitados (marcar como contactado, agregar notas) |
| **Integración Google Calendar** | Sincronizar las reservas con el calendario de Moreliz |

---

## 👩‍💻 Créditos

- **Agencia:** MoreMKT · [morehdmkt.com](https://morehdmkt.com)
- **Fundadora:** Moreliz Hurtado · [LinkedIn](https://www.linkedin.com/in/moreliz-hurtado/) · [Instagram](https://www.instagram.com/morehd.marketing)
- **Desarrollo:** [Estudio Precinto](https://estudioprecinto.com)
- **© 2026 MoreMKT. Todos los derechos reservados.**
