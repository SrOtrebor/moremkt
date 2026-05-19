# Portal de Clientes - Instalaciones SL

## 📋 Descripción

Portal web para clientes de Instalaciones SL que permite acceder a su información de servicios, documentos y gestión de visitas mediante autenticación con magic link (sin contraseña).

## ✨ Características Implementadas

### Autenticación
- **Magic Link**: Sistema de autenticación sin contraseña
- Envío de emails automático vía Gmail
- Tokens JWT con expiración de 15 minutos
- Sesiones persistentes de 30 días en Firestore
- Logout con limpieza de sesión

### Dashboard del Cliente
- Saludo personalizado con nombre del cliente
- Acceso rápido a las carpetas de documentación compartida
- Visualización de próximas visitas coordinadas
- Historial de servicios completados

### Diseño UI
- Interfaz moderna y minimalista
- Diseño responsive adaptado a móviles
- Branding de Instalaciones SL en todos los componentes

## 🏗️ Arquitectura

### Backend (Firebase Functions)

**Endpoints principales:**
- `POST /student/request-access`: Genera link de acceso
- `POST /student/verify-token`: Valida sesión
- `GET /student/dashboard`: Retorna datos del perfil
- `POST /student/logout`: Cierra sesión

### Frontend (SPA)
- `public/mi-cuenta.html`: Contenedor principal
- `public/js/student-portal.js`: Lógica de integración con Firebase

## 📧 Configuración de Email

**Servicio:** Gmail SMTP (Instalaciones SL)
- **Cuenta:** instalacionessl.ar@gmail.com
- **Autenticación:** App Password

## 📁 Estructura de Archivos

```
instalaciones-sl/
├── functions/
│   ├── index.js                    # Endpoints del portal
│   └── emails/
│       └── magicLinkTemplate.js    # Template de email
├── public/
│   ├── mi-cuenta.html              # Portal del cliente
│   ├── css/
│   │   └── student-portal.css      # Estilos del portal
│   ├── js/
│   │   └── student-portal.js       # Lógica del frontend
│   └── assets/
│       └── logos/
│           ├── Instalaciones-SL-Logo.svg
│           └── Instalaciones-SL-Iso.svg
└── firebase.json                   # Configuración de hosting
```

## 🚀 Próximos Pasos

- [ ] Integración avanzada con Mercado Pago para presupuestos dinámicos.
- [ ] Automatización de reportes técnicos post-visita.
- [ ] Sistema de notificaciones vía WhatsApp Business API.

---

**Última actualización:** 2026-03-23
