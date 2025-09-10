@echo off

:: --- 1. VERIFICAR SI NODE.JS ESTA INSTALADO ---
echo Verificando instalacion de Node.js...
node -v >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo -------------------------------------------------------------------
    echo ADVERTENCIA: Node.js no esta instalado o no se encuentra.
    echo Este programa necesita Node.js para funcionar.
    echo -------------------------------------------------------------------
    echo.
    echo Intentando descargar el instalador de Node.js (LTS)...
    powershell -Command "Write-Host 'Descargando...'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/lts/node-lts-x64.msi' -OutFile 'node-installer.msi'; Write-Host 'Descarga completa.'"
    
    if not exist node-installer.msi (
        echo.
        echo Fallo la descarga. Por favor, instala Node.js manualmente desde https://nodejs.org
        pause
        exit
    )
    
    echo.
    echo Se abrira el instalador. Por favor, completa la instalacion.
    echo Despues de instalar, CIERRA esta ventana y vuelve a ejecutar start.bat.
    start /wait msiexec /i node-installer.msi
    del node-installer.msi
    pause
    exit
)
echo Node.js encontrado.

:: --- 2. INICIAR EL SERVIDOR Y ABRIR LA APP ---
echo.
echo Iniciando servidor de la aplicacion...

:: Limpiar archivo de puerto anterior si existe
if exist backend\.port del backend\.port

:: Inicia el servidor en segundo plano
start "Farmacias Server" node backend/server.js

echo Esperando a que el servidor encuentre un puerto libre...

:waitloop
timeout /t 1 /nobreak >nul
if not exist backend\.port goto waitloop

set /p PORT=<backend\.port
del backend\.port

echo Servidor listo en el puerto %PORT%. Abriendo la aplicacion en el navegador...
start http://localhost:%PORT%