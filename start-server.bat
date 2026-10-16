@echo off
:loop
cd /d "c:\Users\user\Downloads\Premium Preschool Website"
npm run dev
timeout /t 3 /nobreak
goto loop
