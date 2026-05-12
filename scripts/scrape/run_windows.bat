@echo off
REM ============================================================
REM ParcaBizden — Windows Scraper Calistirma
REM ============================================================
REM Default: otoparcasan, jitter 2-5sn, max-depth 4
REM Ozellestirmek istersen asagidaki satirlari duzenle.
REM ============================================================

setlocal

REM Sanal ortam kontrol
if not exist .venv\Scripts\activate.bat (
    echo [HATA] .venv yok. Once setup_windows.bat'i calistir.
    pause
    exit /b 1
)

echo === ParcaBizden Scraper baslatiliyor ===
echo.
echo Durdurmak icin: Ctrl+C
echo Daha sonra "run_windows.bat resume" ile devam edebilirsin.
echo.

call .venv\Scripts\activate.bat

REM Resume modu mu?
if "%1"=="resume" (
    echo Mod: RESUME — kaldigi yerden devam ediyor.
    python parts_scraper.py --site otoparcasan --resume --jitter 2,5
) else (
    echo Mod: FRESH START — yeni scraping.
    python parts_scraper.py ^
        --site otoparcasan ^
        --start-url https://otoparcasan.com/yedek-parca ^
        --start-url https://otoparcasan.com/kategori/fren-balatasi ^
        --start-url https://otoparcasan.com/kategori/yag-filtresi ^
        --jitter 2,5 ^
        --max-depth 4
)

echo.
echo === Tamamlandi ===
pause
