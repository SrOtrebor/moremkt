/**
 * Template de email para Magic Link
 */

const magicLinkTemplate = (studentName, magicLink, expirationMinutes = 15) => {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accedé a tu cuenta - Instalaciones SL</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #F3F2E2;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);">
                    <!-- Header con logo -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="margin: 0; font-family: 'Montserrat', sans-serif; color: #1B465E; font-size: 24px;">
                                ⚡ Instalaciones SL
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Contenido principal -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h2 style="margin: 0 0 20px; font-family: 'Montserrat', sans-serif; color: #1B465E; font-size: 28px;">
                                Accede a tu cuenta
                            </h2>
                            
                            <p style="margin: 0 0 20px; color: #1A1A1A; font-size: 16px; line-height: 1.6;">
                                Hola <strong>${studentName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 30px; color: #1A1A1A; font-size: 16px; line-height: 1.6;">
                                Hacé click en el siguiente botón para acceder a tus clases y documentos:
                            </p>
                            
                            <!-- Botón CTA -->
                            <table role="presentation" style="width: 100%;">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${magicLink}" 
                                           style="display: inline-block; padding: 16px 32px; background-color: #1B465E; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                            Acceder a Mi Cuenta
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Información adicional -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #F3F2E2; border-radius: 8px; border-left: 4px solid #A6BDCB;">
                                <p style="margin: 0 0 15px; color: #1A1A1A; font-size: 14px; line-height: 1.6;">
                                    <strong>Una vez dentro, podrás:</strong>
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #1A1A1A; font-size: 14px; line-height: 1.8;">
                                    <li>Ver todas tus clases (pasadas y futuras)</li>
                                    <li>Acceder a los links de Google Meet</li>
                                    <li>Ver tu carpeta personal de Drive</li>
                                    <li>Consultar el estado de tu paquete</li>
                                    <li>Agendar nuevas clases</li>
                                </ul>
                            </div>
                            
                            <!-- Advertencia de seguridad -->
                            <p style="margin: 20px 0 0; color: #6B7280; font-size: 13px; line-height: 1.6;">
                                ⚠️ Este link expira en <strong>${expirationMinutes} minutos</strong>. 
                                Si no solicitaste este acceso, ignora este email.
                            </p>
                            
                            <!-- Link alternativo -->
                            <p style="margin: 15px 0 0; color: #6B7280; font-size: 12px; line-height: 1.6;">
                                Si el botón no funciona, copia y pega este link en tu navegador:<br>
                                <a href="${magicLink}" style="color: #3B687E; word-break: break-all;">${magicLink}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; border-top: 1px solid #A6BDCB; text-align: center;">
                            <p style="margin: 0 0 10px; color: #6B7280; font-size: 14px;">
                                © 2026 Instalaciones SL - Expertos en Climatización
                            </p>
                            <p style="margin: 0; color: #6B7280; font-size: 12px;">
                                <a href="https://instalacionessl.com.ar" style="color: #3B687E; text-decoration: none;">instalacionessl.com.ar</a>
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

module.exports = magicLinkTemplate;
