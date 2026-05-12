@echo off
REM ============================================================
REM ParçaBizden — Windows Scraper Kurulum Scripti
REM ============================================================
REM Kullanım: scripts\scrape klasöründe çift tıkla VEYA cmd'de
REM           ".\setup_windows.bat" yaz.
REM ============================================================

echo.
echo === ParcaBizden Scraper Windows Kurulum ===
echo.

REM Python kurulu mu?
where python >nul 2>nul
if errorlevel 1 (
    echo [HATA] Python bulunamadi. Once kur:
    echo        https://www.python.org/downloads/windows/
    echo        Kurulumda "Add Python to PATH" isaretli olsun.
    pause
    exit /b 1
)

echo [1/4] Python suruyumu kontrol ediliyor...
python --version

echo.
echo [2/4] Sanal ortam (.venv) olusturuluyor...
if exist .venv (
    echo       Zaten var, atlandi.
) else (
    python -m venv .venv
    if errorlevel 1 (
        echo [HATA] venv olusturulamadi.
        pause
        exit /b 1
    )
)

echo.
echo [3/4] Bagimliliklar yukleniyor...
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo [HATA] pip install basarisiz.
    pause
    exit /b 1
)

echo.
echo [4/4] Playwright Chromium tarayicisi indiriliyor (~120 MB)...
playwright install chromium

echo.
echo === Kurulum tamamlandi ===
echo.
echo Calistirmak icin:
echo   run_windows.bat
echo veya manuel:
echo   .venv\Scripts\activate
echo   python parts_scraper.py --site otoparcasan --start-url https://otoparcasan.com/yedek-parca
echo.
pause
