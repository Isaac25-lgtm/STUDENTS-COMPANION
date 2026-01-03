@echo off
echo ============================================
echo DATA ANALYSIS LAB - BACKEND STARTUP
echo ============================================
echo.

REM Check if virtual environment exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    
    echo Installing dependencies...
    pip install -r requirements.txt
)

echo.
echo Starting Flask server...
echo.

python run.py

pause

