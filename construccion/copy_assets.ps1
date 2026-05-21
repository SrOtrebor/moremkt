# Script de automatización para copiar las ilustraciones premium de Moreliz al proyecto
$brainDir = "C:\Users\ra_la\.gemini\antigravity-ide\brain\e1be73ef-bc63-4cb4-b7e5-b3351e18983d"
$destDir = "E:\MoreMKT\construccion\Fotos"

# Asegurar que la carpeta de destino exista
if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir
}

Write-Host "Copiando ilustraciones generadas desde el directorio de recursos..." -ForegroundColor Cyan

Copy-Item "$brainDir\avatar_publicidad_1779331247517.png" -Destination "$destDir\avatar_publicidad.png" -Force
Copy-Item "$brainDir\avatar_asesoria_1779331266673.png" -Destination "$destDir\avatar_asesoria.png" -Force
Copy-Item "$brainDir\avatar_capacitacion_1779331282294.png" -Destination "$destDir\avatar_capacitacion.png" -Force
Copy-Item "$brainDir\avatar_soluciones_1779331298525.png" -Destination "$destDir\avatar_soluciones.png" -Force

Write-Host "¡Éxito! Las ilustraciones se han copiado correctamente en '$destDir'." -ForegroundColor Green
Write-Host "Ya puedes eliminar este script si lo deseas." -ForegroundColor Yellow
