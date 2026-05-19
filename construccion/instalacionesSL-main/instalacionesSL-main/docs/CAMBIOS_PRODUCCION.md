# Documentación de Cambios - Mercado Pago & Google Calendar

Este documento resume los cambios realizados para la transición a producción y las pruebas de cobro.

## 1. Mercado Pago
- **Configuración de Producción**: Se actualizaron las credenciales en `functions/.env` (`MP_ACCESS_TOKEN` y `MP_PUBLIC_KEY`).
- **Precio de Prueba**: Se modificó temporalmente `functions/index.js` para cobrar **$1** en lugar de $10.000 para facilitar pruebas reales.
- **Webhook**: El webhook está configurado y procesando pagos aprobados correctamente.

## 2. Google Calendar
- **Método de Autenticación**: Se cambió la prioridad a **Service Account** en `functions/services/calendarService.js`.
- **Acceso**: El sistema ahora utiliza la cuenta `instalacionessl@appspot.gserviceaccount.com`. Para que funcione, el calendario principal debe estar compartido con esta cuenta con permisos de edición.
- **Email**: Las notificaciones por correo siguen activas usando SMTP de Gmail.

## 3. Entorno de Despliegue
- **Proyecto**: `instalacione-2a21b`
- **URL**: [https://instalacionessl.com.ar/agendar.html](https://instalacionessl.com.ar/agendar.html)

---
*Nota: Para revertir el precio de prueba a $10.000, modificar la línea `unit_price: 1` por `unit_price: price` en `functions/index.js`.*
