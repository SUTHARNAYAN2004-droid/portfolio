@echo off
echo.
echo  ========================================
echo     WoodCraft Portfolio - Internet Share
echo  ========================================
echo.
echo  Step 1: Starting local server...
start "Portfolio Server" cmd /c "node server.js"
timeout /t 2 /nobreak > nul

echo  Step 2: Creating internet tunnel...
echo.
echo  Ek public link milega niche - use WhatsApp pe bhejo!
echo  Press Ctrl+C to stop sharing.
echo.
ngrok http 3000
pause
