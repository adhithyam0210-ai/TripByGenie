@echo off
title TripByGenie - 28 Automated Verification Tests
echo ========================================================
echo  Running TripByGenie Backend Verification Suite
echo ========================================================
set "PATH=C:\Users\welcome\nodejs\node-v20.18.0-win-x64;%PATH%"
cd /d "%~dp0"
call node test-suite.js
echo.
pause
