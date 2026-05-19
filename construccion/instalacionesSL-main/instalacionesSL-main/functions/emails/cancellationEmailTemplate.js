/**
 * Template de email para cancelación de visita técnica
 */

const cancellationEmailTemplate = (bookingData) => {
    const { clientName, date, time, serviceType } = bookingData;

    // Formatear fecha en español
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visita Cancelada - Instalaciones SL</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #F5F5F5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; font-family: 'Montserrat', sans-serif; color: #FFFFFF; font-size: 28px;">
                                ⚡ Instalaciones SL
                            </h1>
                            <p style="margin: 10px 0 0; color: #FFFFFF; font-size: 14px; opacity: 0.9;">
                                Expertos en Climatización y Electricidad
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Contenido principal -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h2 style="margin: 30px 0 20px; font-family: 'Montserrat', sans-serif; color: #DC2626; font-size: 28px;">
                                ❌ Visita Cancelada
                            </h2>
                            
                            <p style="margin: 0 0 20px; color: #1A1A1A; font-size: 16px; line-height: 1.6;">
                                Hola <strong>${clientName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 30px; color: #1A1A1A; font-size: 16px; line-height: 1.6;">
                                Lamentamos informarte que tu visita técnica ha sido cancelada. A continuación los detalles:
                            </p>
                            
                            <!-- Card con detalles de la visita cancelada -->
                            <div style="margin: 30px 0; padding: 25px; background-color: #FEE2E2; border-radius: 12px; border-left: 4px solid #DC2626;">
                                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #991B1B;">
                                    🔧 ${serviceType}
                                </h3>
                                <div style="margin: 10px 0; font-size: 16px; line-height: 1.8; color: #1A1A1A;">
                                    <div style="margin: 8px 0;">
                                        📅 <strong>Fecha:</strong> ${formattedDate}
                                    </div>
                                    <div style="margin: 8px 0;">
                                        🕐 <strong>Hora:</strong> ${time} hs
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Información sobre próximos pasos -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #F5F5F5; border-radius: 8px; border-left: 4px solid #0066FF;">
                                <p style="margin: 0 0 15px; color: #1A1A1A; font-size: 14px; line-height: 1.6;">
                                    <strong>📌 Próximos pasos:</strong>
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #1A1A1A; font-size: 14px; line-height: 1.8;">
                                    <li>Si tenías un paquete de servicios, tu crédito sigue disponible</li>
                                    <li>Puedes agendar una nueva visita cuando lo desees</li>
                                    <li>Si necesitas asistencia, contactanos por email o teléfono</li>
                                </ul>
                            </div>
                            
                            <!-- Botón para agendar nueva visita -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="https://instalacionessl.com.ar/agendar.html" 
                                           style="display: inline-block; padding: 16px 32px; background-color: #0066FF; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                            📅 Agendar Nueva Visita
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Información de contacto -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #F5F5F5; border-radius: 8px; border-left: 4px solid #FF6B35;">
                                <p style="margin: 0 0 15px; color: #1A1A1A; font-size: 14px; line-height: 1.6;">
                                    <strong>📞 ¿Necesitas ayuda?</strong>
                                </p>
                                <p style="margin: 0; color: #1A1A1A; font-size: 14px; line-height: 1.8;">
                                    📧 Email: <a href="mailto:contacto@instalacionessl.com.ar" style="color: #0066FF; text-decoration: none;">contacto@instalacionessl.com.ar</a><br>
                                    📱 Teléfono: <a href="tel:+5491112345678" style="color: #0066FF; text-decoration: none;">+54 9 11 1234-5678</a>
                                </p>
                            </div>
                            
                            <!-- Mensaje de disculpa -->
                            <p style="margin: 20px 0 0; color: #6B7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                Lamentamos las molestias ocasionadas. Esperamos poder atenderte pronto.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; border-top: 1px solid #E5E7EB; text-align: center;">
                            <p style="margin: 0 0 10px; color: #6B7280; font-size: 14px;">
                                © 2026 Instalaciones SL - Expertos en Climatización
                            </p>
                            <p style="margin: 0; color: #6B7280; font-size: 12px;">
                                <a href="https://instalacionessl.com.ar" style="color: #0066FF; text-decoration: none;">instalacionessl.com.ar</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};

module.exports = cancellationEmailTemplate;
