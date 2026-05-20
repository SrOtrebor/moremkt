# MoreMKT - Plataforma Web y Sistema de Reservas

Esta es la plataforma oficial de **MoreMKT** (Estrategia de Paid Media y Performance). El sistema ha evolucionado de una simple Landing Page de "Próximamente" a una Single Page Application (SPA) dinámica con un sistema completo e integrado de reservas automatizadas, pagos online y un panel de administración.

## 🚀 Tecnologías Utilizadas

- **Frontend Core:** HTML5 semántico, CSS3 Vainilla, JavaScript Vainilla (ES6+).
- **Backend / Nube:** Node.js, Express, Firebase Cloud Functions y Firestore Database.
- **Pagos:** Mercado Pago SDK.
- **Estilos Dinámicos:** Animaciones *glassmorphism*, colorimetría dinámica adaptada a la marca y *hover effects* inmersivos.
- **Tipografías e Iconos:** `Outfit` (títulos), `Inter` (cuerpo de texto) e iconos de *Phosphor Icons*.

## 📂 Estructura de Archivos

```
/
├── index.html               # SPA Principal (Landing, Servicios, Promociones)
├── reserva.html             # Interfaz pública de agendamiento de citas
├── style.css                # Sistema de diseño central y variables CSS
├── CONFIGURACION_FIREBASE.md # Guía para el despliegue a la nube y Mercado Pago
│
├── SVG/                     # Recursos gráficos e isotipos de la marca
│
├── js/
│   ├── app.js               # Lógica interactiva de la SPA (Tabs, bundles, colores)
│   └── booking.js           # Lógica del frontend del calendario de reservas
│
├── admin/                   # 🔒 Panel de Administración (Privado)
│   ├── dashboard.html       # Panel de control principal (Horarios, Bloqueos, Lista de citas)
│   ├── login.html           # Inicio de sesión protegido por contraseña
│   ├── css/admin.css        # Estilos específicos del dashboard
│   └── js/
│       ├── dashboard.js     # Lógica de las vistas y gestión administrativa
│       └── login.js         # Lógica de autenticación del administrador
│
└── functions/               # ⚙️ Código del Servidor (Backend)
    ├── package.json         # Dependencias (firebase-admin, mercadopago, jsonwebtoken, etc.)
    └── index.js             # API REST (Rutas de agendamiento, disponibilidad, webhooks, auth)
```

## ✨ Funcionalidades Principales

### 1. Single Page Application (SPA) Dinámica
La navegación en el `index.html` es completamente asíncrona. Los menús de servicios cambian dinámicamente tanto el contenido en pantalla como el color del fondo global para ofrecer una experiencia inmersiva y de alto impacto estético.
También incluye calculadoras de *Bundles* para promocionar la venta de múltiples cursos ("Comprar pack de cursos + Mentoría gratis").

### 2. Sistema de Agendamiento
A través de `reserva.html`, los usuarios pueden:
- Visualizar un calendario inteligente que calcula automáticamente los espacios disponibles en base a los horarios de atención y la duración de las citas configurados.
- Elegir día y hora.
- Introducir su información básica.
- Abonar el monto de forma automática en Mercado Pago, redirigiendo a la pasarela de cobro segura.
- Regresar a la pantalla de éxito (o error) tras la compra.

### 3. Panel de Administración
Un tablero web privado (`/admin`) en el cual el equipo de MoreMKT puede:
- **Gestionar Horarios:** Activar/desactivar días laborables, definir rangos horarios (ej. de 9:00 a 12:00 y de 16:00 a 20:00) y la duración en minutos de cada asesoría.
- **Gestión de Bloqueos:** Añadir y quitar excepciones temporales (ej. feriados o turnos médicos).
- **Consultar Reservas:** Listado consolidado de citas procesadas para control.
- **Ajustar Precios:** Modificar el precio de la asesoría sin tocar el código de la web.

## 🛠️ Despliegue y Configuración

Para poner en producción la base de datos (Firestore), las reglas de seguridad y las Cloud Functions conectadas a Mercado Pago, debes leer detenidamente el documento interno: `CONFIGURACION_FIREBASE.md`. Este detalla el proceso de vinculación usando `firebase-tools` y los tokens de API de Mercado Pago.

## 🎨 Consideraciones de Diseño

Se buscó una estética "Premium":
- **Colores Principales:** Púrpura oscuro `#4c2c5c` a `#23122c` con acentos en dorado `#f6c039`.
- **Interacciones:** Efectos translúcidos (backdrop-filter) que simulan superficies de cristal, transiciones sutiles e indicadores de interfaz limpios para enfocar la atención del usuario sin abrumarlo visualmente.
