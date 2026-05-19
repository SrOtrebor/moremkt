/**
 * Template de email para confirmación de visita técnica
 */

const confirmationEmailTemplate = (bookingData) => {
    const { clientName, date, time, serviceType, address, driveFolder } = bookingData;

    // Formatear fecha en español
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Construir dirección completa
    const fullAddress = `${address.street} ${address.streetNumber}${address.floor ? `, ${address.floor}` : ''}, ${address.neighborhood}`;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visita Confirmada - Instalaciones SL</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #F5F5F5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);">
                    <!-- Header con logo -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0066FF 0%, #00D4FF 100%); border-radius: 12px 12px 0 0;">
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
                            <h2 style="margin: 30px 0 20px; font-family: 'Montserrat', sans-serif; color: #0066FF; font-size: 28px;">
                                ✅ ¡Tu visita está confirmada!
                            </h2>
                            
                            <p style="margin: 0 0 20px; color: #1A1A1A; font-size: 16px; line-height: 1.6;">
                                Hola <strong>${clientName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 30px; color: #1A1A1A; font-size: 16px; line-height: 1.6;">
                                Tu visita técnica ha sido confirmada exitosamente. Nuestro técnico matriculado estará en tu domicilio en la fecha y hora indicadas.
                            </p>
                            
                            <!-- Card con detalles de la visita -->
                            <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%); border-radius: 12px; color: #FFFFFF;">
                                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600;">
                                    🔧 ${serviceType}
                                </h3>
                                <div style="margin: 10px 0; font-size: 16px; line-height: 1.8;">
                                    <div style="margin: 8px 0;">
                                        📅 <strong>Fecha:</strong> ${formattedDate}
                                    </div>
                                    <div style="margin: 8px 0;">
                                        🕐 <strong>Hora:</strong> ${time} hs
                                    </div>
                                    <div style="margin: 8px 0;">
                                        ⏱️ <strong>Duración estimada:</strong> 60 minutos
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Dirección destacada -->
                            <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #FF6B35 0%, #FF8555 100%); border-radius: 12px; color: #FFFFFF;">
                                <h3 style="margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                                    📍 Dirección de la Visita
                                </h3>
                                <p style="margin: 0; font-size: 18px; font-weight: 500; line-height: 1.6;">
                                    ${fullAddress}
                                </p>
                                ${address.betweenStreets ? `
                                <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                    Entre calles: ${address.betweenStreets}
                                </p>
                                ` : ''}
                            </div>
                            
                            <!-- Carpeta de Drive -->
                            ${driveFolder ? `
                            <div style="margin: 30px 0; padding: 20px; background-color: #F5F5F5; border-radius: 8px; border-left: 4px solid #0066FF;">
                                <p style="margin: 0 0 10px; color: #1A1A1A; font-size: 14px;">
                                    <strong>📁 Tu Carpeta Personal en Drive:</strong>
                                </p>
                                <p style="margin: 0; font-size: 14px;">
                                    <a href="${driveFolder}" style="color: #0066FF; text-decoration: none;">
                                        Acceder a mi carpeta →
                                    </a>
                                </p>
                                <p style="margin: 10px 0 0; color: #6B7280; font-size: 12px;">
                                    Aquí encontrarás presupuestos, garantías y documentación de tu servicio.
                                </p>
                            </div>
                            ` : ''}
                            
                            <!-- Instrucciones -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #F5F5F5; border-radius: 8px; border-left: 4px solid #FF6B35;">
                                <p style="margin: 0 0 15px; color: #1A1A1A; font-size: 14px; line-height: 1.6;">
                                    <strong>📝 Importante antes de la visita:</strong>
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #1A1A1A; font-size: 14px; line-height: 1.8;">
                                    <li>Asegúrate de tener acceso al área donde se realizará el trabajo</li>
                                    <li>Si es posible, despeja la zona de trabajo</li>
                                    <li>Ten a mano la documentación del equipo (si aplica)</li>
                                    <li>El técnico llevará todos los materiales necesarios</li>
                                </ul>
                            </div>
                            
                            <!-- Garantía -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #E8F5E9; border-radius: 8px; border-left: 4px solid #4CAF50;">
                                <p style="margin: 0; color: #1A1A1A; font-size: 14px; line-height: 1.6;">
                                    ✅ <strong>Trabajos Garantizados</strong> - Técnicos Matriculados - Atención Profesional
                                </p>
                            </div>
                            
                            <!-- Recordatorio -->
                            <p style="margin: 20px 0 0; color: #6B7280; font-size: 13px; line-height: 1.6;">
                                💡 <strong>Recordatorio:</strong> Si necesitas reprogramar la visita, contactanos con al menos 24 horas de anticipación.
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

module.exports = confirmationEmailTemplate;
