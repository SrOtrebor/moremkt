# Instalaciones SL - Sistema de Gestión de Visitas Técnicas

Este repositorio contiene el sistema integral de gestión de turnos, pagos y documentación para **Instalaciones SL**. La plataforma permite a los clientes agendar visitas técnicas, realizar pagos vía Mercado Pago y acceder a un portal personal con documentación compartida.

## 🚀 Arquitectura del Proyecto

El proyecto está construido sobre la infraestructura de **Firebase**:
- **Hosting**: Aplicación web SPA y portal administrativo.
- **Functions**: Backend en Node.js (Express) para procesamiento de pagos, integraciones y lógica de negocio.
- **Firestore**: Base de datos NoSQL para reservas, configuraciones y sesiones.
- **Storage/Drive**: Gestión de documentación técnica mediante integración con Google Drive API.

## 🛠️ Tecnologías Principales

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Backend**: Node.js, Firebase Functions 2nd Gen.
- **Integraciones**: 
  - **Mercado Pago API**: Procesamiento de pagos.
  - **Google Calendar API**: Sincronización de agenda técnica.
  - **Google Drive API**: Repositorio de documentos para clientes.

## 📁 Estructura del Repositorio

- `/functions`: Código fuente de las Cloud Functions (API REST).
- `/public`: Archivos estáticos del frontend (Landing, Agendamiento, Admin).
- `/docs`: Documentación detallada de infraestructura y portal.

## 💻 Desarrollo Local

1. Instalar dependencias en la carpeta raíz y en `functions/`:
   ```bash
   npm install
   cd functions && npm install
   ```
2. Configurar variables de entorno en `./functions/.env`.
3. Iniciar emuladores de Firebase:
   ```bash
   firebase emulators:start
   ```

## 📄 Guía para Colaboradores

- **Documentación**: Todo el código nuevo debe incluir JSDoc estándar.
- **Estilo**: Se prefiere JavaScript moderno y limpio, evitando dependencias innecesarias.
- **Branding**: Asegurarse de utilizar los tokens de diseño definidos en `admin.css` y `styles.css`.

---
© 2026 Instalaciones SL. Todos los derechos reservados.
