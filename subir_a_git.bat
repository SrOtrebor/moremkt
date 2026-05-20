@echo off
echo Subiendo los cambios a Git...
git add .
git commit -m "Implementar sistema de reservas, eliminar credenciales y actualizar documentacion"
git push
echo.
echo Proceso finalizado. Presiona cualquier tecla para salir.
pause
