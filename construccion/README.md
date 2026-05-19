# MoreMKT — SPA `/construccion`
## URL Final: `morehdmkt.com/construccion`

> Aplicación web de una sola página (SPA) para la sección comercial de MoreMKT.  
> Construida en **HTML5 + CSS3 Vanilla + JS puro**, sin frameworks externos.

---

## 🗂️ Estructura de Archivos

```
construccion/
├── index.html              ← SPA principal
├── app.css                 ← Design system completo + responsivo
├── app.js                  ← Lógica de tabs, modal, calendario, MP
├── PLAN.md                 ← Plan técnico original (referencia)
├── README.md               ← Este archivo
└── instalacionesSL-main/   ← Proyecto de referencia (no se despliega)
    └── instalacionesSL-main/
        └── public/
            └── js/
                └── booking.js  ← Fuente de la lógica de reserva y MP
```

> ⚠️ **REGLA:** No tocar `/index.html`, `/index-dark.html`, `/style.css`, `/style-dark.css`  
> en la raíz del proyecto. Esos son la landing "Próximamente" en producción.

---

## 🎨 Paleta de Colores

| Tab | Color | Hex |
|---|---|---|
| Publicidad | Púrpura | `#4B1D61` |
| Asesoría | Verde esmeralda | `#2D6A4F` |
| Capacitación | Dorado | `#F4BA3C` |
| Soluciones Digitales | Azul cobalto | `#1D3557` |
| Fondo general | Blanco roto | `#f9f9f9` |
| Texto principal | Carbón | `#1a1a1a` |
| Texto secundario | Gris | `#6B7280` |

---

## 🧩 Componentes Construidos

### 1. Header
- Logo de MoreMKT enlazado a la landing principal (`../`)
- Hamburger menu en mobile

### 2. Solapas tipo carpeta (Folder Tabs)
Diseño inspirado en el patrón clásico de carpetas físicas pero con estética Premium:
- Borde superior redondeado (`border-radius: 12px 12px 0 0`)
- **Degradado inmersivo:** Al activar una solapa, el contenedor inferior hereda su color corporativo y genera un degradado suave hacia el blanco, con bordes unificados.
- Textos y títulos se adaptan al modo oscuro automáticamente para mantener contraste.
- Inactivas: fondo gris claro `#f3f4f6`, texto gris.

### 3. Contenido por Tab

#### 💼 Publicidad
- Título + descripción del servicio (texto en blanco para contrastar con el fondo púrpura).
- **Lista de Precios Minimalista (Filas)**: En lugar de tarjetas (cards), usamos un diseño tabular/horizontal más elegante y corporativo.
- **3 Planes**: Basic, Medium (fila destacada con barra lateral dorada), Premium.
- Cada fila tiene nombre, subtítulo, lista de features horizontal y botón "Agendar".
- El botón abre el **modal de reserva** con el plan preseleccionado.

#### 🎯 Asesoría
- Lista de 4 servicios con ícono + nombre + descripción
- Botón "Agendar Sesión (Pago vía MP)" → abre modal

#### 🎓 Capacitación
- **Lógica 3+1**: seleccioná 3 o más cursos → se muestra banner "Mentoría gratis incluida"
- 4 course cards con checkbox de selección
- Botón dinámico que actualiza el texto según la selección
- Al clickear con cursos seleccionados → abre modal

#### 🚀 Soluciones Digitales
- Headline + descripción de propuesta de valor
- **Timeline visual** de 3 pasos: Diagnóstico → Presupuesto → Implementación
- Botón "Agendar Diagnóstico Gratuito" → abre modal

### 4. Imagen "sobresaliente" por Tab
Cada tab tiene un placeholder de imagen que sobresale hacia arriba (`margin-top: -70px`).  
Cuando llegue la foto de Moreliz, reemplazar el `div.photo-placeholder` por:
```html
<img src="ruta/a/foto.png" alt="Moreliz Pérez - MoreMKT">
```

### 5. Modal de Reserva con Calendario Real
Adaptado del proyecto **Instalaciones SL** (`booking.js`). Flujo completo:

```
[Abrís modal]
     ↓
[Paso 1] Calendario interactivo + selección de horario + formulario de datos
     ↓
[Validación] nombre + email + teléfono + fecha + hora
     ↓
[POST] → /createBookingMP en Firebase Cloud Functions
     ↓
[Éxito]  → Redirige a checkout de Mercado Pago (init_point)
[Error]  → Fallback: abre WhatsApp con los datos pre-completados en el mensaje
     ↓
[Al volver de MP] → Detecta ?status=approved|pending|failure en la URL
                 → Muestra banner de resultado en el top de la página
```

**Variables de entorno a configurar:**
```javascript
// En app.js — línea 5
const MOREMKT_API = 'https://us-central1-TU_PROYECTO.cloudfunctions.net/api';
```

**Slots de horarios disponibles** (actualmente estáticos):
```javascript
// En app.js — función renderModalSlots()
const DEFAULT_SLOTS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00'];
```
→ Reemplazar con llamada a `/getAvailableSlots?date=YYYY-MM-DD` cuando esté el backend.

### 6. Social Proof Carousel
- Banda oscura con logos de clientes en movimiento infinito (CSS animation)
- 8 placeholders "CLIENTE X" → reemplazar con logos reales cuando se tengan

### 7. Footer
- Logo, datos de contacto, redes sociales, QR de WhatsApp (generado con QRCode.js)

### 8. WhatsApp FAB
- Botón flotante verde con animación de pulso
- Enlaza directo a `wa.me/5491176426155`

---

## ⚙️ Stack Técnico

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura semántica |
| CSS3 Vanilla | Design system, animaciones, responsivo |
| JavaScript ES6+ | Tabs, calendario, modal, validaciones |
| Google Fonts (Montserrat) | Tipografía |
| QRCode.js (CDN) | Generación del QR en el footer |
| Firebase Cloud Functions | Backend de reservas + Mercado Pago (pendiente) |
| Mercado Pago Checkout Pro | Pasarela de pago (pendiente de conectar) |

---

## 🔌 Integración con Mercado Pago

La lógica está construida siguiendo el patrón del proyecto **Instalaciones SL**. El backend debe exponer:

### `POST /createBookingMP`
**Body:**
```json
{
  "service": "publicidad",
  "detail": "Plan Medium — Estrategia Integral",
  "name": "Juan García",
  "email": "juan@empresa.com",
  "phone": "11 1234-5678",
  "message": "Quiero información sobre el plan medium",
  "date": "2025-06-15",
  "time": "10:00"
}
```
**Response:**
```json
{
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?..."
}
```

### `GET /getAvailableSlots?date=YYYY-MM-DD`
**Response:**
```json
{
  "slots": ["09:00", "10:00", "14:00", "16:00"]
}
```

Al volver de Mercado Pago, redirigir a:
```
https://morehdmkt.com/construccion/?status=approved
https://morehdmkt.com/construccion/?status=pending
https://morehdmkt.com/construccion/?status=failure
```

---

## 📋 Pendientes

| Tarea | Estado |
|---|---|
| Foto de Moreliz (PNG con fondo transparente) | ⏳ Pendiente de asset |
| Logos de clientes reales para el carousel | ⏳ Pendiente |
| Precios reales en la lista de planes | ⏳ Pendiente de definición |
| Links de Instagram y LinkedIn | ⏳ Pendiente |
| Backend Firebase: endpoint `/createBookingMP` | ⏳ Pendiente |
| Backend Firebase: endpoint `/getAvailableSlots` | ⏳ Pendiente |
| Integración real de Mercado Pago | ⏳ Requiere backend |
| CNAME / deploy en GitHub Pages | ⏳ Cuando esté listo el contenido |

---

## 🚀 Cómo visualizar localmente

Simplemente abrir `construccion/index.html` directamente en el navegador.  
No requiere servidor local para funcionar en modo preview.

> Para probar el flujo completo de Mercado Pago necesitás el backend de Firebase activo.  
> Sin backend, el modal cae automáticamente al **fallback de WhatsApp**.

---

## 📞 Datos de contacto del proyecto

| Campo | Valor |
|---|---|
| WhatsApp | `+54 9 11 7642-6155` |
| Email | `hola@morehdmkt.com` |
| Dominio | `morehdmkt.com` |
| GitHub | `SrOtrebor/moremkt` |
