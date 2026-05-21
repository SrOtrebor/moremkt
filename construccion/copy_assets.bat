@echo off
title Copiar Ilustraciones MoreMKT
echo =======================================================
echo Copiando ilustraciones premium estilo cartoon de Moreliz...
echo =======================================================
powershell -ExecutionPolicy Bypass -File "%~dp0copy_assets.ps1"
echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause >nul
