@echo off
title TripByGenie - Full Platform
echo ========================================================
echo  Starting TripByGenie (Backend :5000 + Frontend :3000)
echo ========================================================
set "PATH=C:\Users\welcome\nodejs\node-v20.18.0-win-x64;%PATH%"
cd /d "%~dp0"
call npm start
pause
