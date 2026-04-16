@echo off
echo Starting Standalone AI Caption Studio...
echo.
echo NOTE: AI Web Workers require a local HTTP server to bypass browser security.
echo We are spinning up a lightweight Python server for you instantly.
echo.
start http://127.0.0.1:8000
python -m http.server 8000
pause
