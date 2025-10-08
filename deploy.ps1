# Скрипт для деплоя на продакшен (PowerShell)
# Использование: .\deploy.ps1

Write-Host "🚀 Начинаем деплой kursik-bot..." -ForegroundColor Green

# Проверяем наличие .env файла
if (-not (Test-Path ".env")) {
    Write-Host "❌ Файл .env не найден!" -ForegroundColor Red
    Write-Host "📋 Скопируйте env.example в .env и заполните переменные:" -ForegroundColor Yellow
    Write-Host "   Copy-Item env.example .env" -ForegroundColor Cyan
    Write-Host "   notepad .env" -ForegroundColor Cyan
    exit 1
}

# Останавливаем существующий контейнер
Write-Host "🛑 Останавливаем существующий контейнер..." -ForegroundColor Yellow
try {
    docker-compose down
} catch {
    Write-Host "Контейнер не был запущен" -ForegroundColor Gray
}

# Собираем новый образ
Write-Host "🔨 Собираем новый образ..." -ForegroundColor Yellow
docker-compose build --no-cache

# Запускаем контейнер
Write-Host "▶️ Запускаем контейнер..." -ForegroundColor Yellow
docker-compose up -d

# Проверяем статус
Write-Host "📊 Проверяем статус контейнера..." -ForegroundColor Yellow
docker-compose ps

Write-Host "✅ Деплой завершен!" -ForegroundColor Green
Write-Host "📝 Для просмотра логов используйте: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "🛑 Для остановки используйте: docker-compose down" -ForegroundColor Cyan
