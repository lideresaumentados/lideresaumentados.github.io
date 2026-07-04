@echo off
cd /d "%~dp0"
echo Publicando cambios en lideresaumentados.github.io...
git pull --rebase origin main
git add -A
git commit -m "Actualizar sitio"
git push origin main
echo.
echo Listo! Los cambios van a aparecer en el sitio en 1-2 minutos.
pause
