@echo off
echo ==========================================
echo   DUXA PLATFORM - HIZLI YUKLEME ARACI
echo ==========================================
echo.
echo "Admin değişiklikleri çekiliyor..."
node scripts/pull_translations.js
echo [1/3] Dosyalar ekleniyor...
git add .
echo.

set /p commitMsg="Yapilan degisiklik nedir? (Bos birakirsan 'Update' yazilir): "
if "%commitMsg%"=="" set commitMsg=Update

echo [2/3] Kaydediliyor (Commit: %commitMsg%)...
git commit -m "%commitMsg%"
echo.

echo [3/3] GitHub'a ve Sunucuya Gonderiliyor...
git push
echo.
echo ==========================================
echo   ISLEM TAMAM! Coolify otomatik baslayacak.
echo ==========================================
pause