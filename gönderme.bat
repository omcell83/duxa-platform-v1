@echo off
echo ==========================================
echo   DUXA PLATFORM - HIZLI YUKLEME ARACI
echo ==========================================
echo.
echo [1/4] Admin panelindeki degisiklikler cekiliyor...
call npm run pull:i18n
if %ERRORLEVEL% NEQ 0 (
    echo HATA: Ceviriler cekilemedi! Islem durduruluyor.
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo [2/4] Dosyalar stage ediliyor...
git add .
echo.

set /p commitMsg="Yapilan degisiklik nedir? (Bos birakirsan 'Update' yazilir): "
if "%commitMsg%"=="" set commitMsg=Update

echo [3/4] Kaydediliyor (Commit: %commitMsg%)...
git commit -m "%commitMsg%"
echo.

echo [4/4] GitHub'a ve Sunucuya Gonderiliyor...
git push
echo.
echo ==========================================
echo   ISLEM TAMAM! Coolify otomatik baslayacak.
echo ==========================================
pause