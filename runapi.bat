@echo off
setlocal

set VENV_PATH=.venv
set SCRIPT_PATH=api/main.py

"%VENV_PATH%\Scripts\python.exe" "%SCRIPT_PATH%"

pause