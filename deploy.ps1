# Скрипт для деплоя на продакшен с PM2 (PowerShell)
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

# Проверяем наличие PM2
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Installed) {
    Write-Host "❌ PM2 не установлен!" -ForegroundColor Red
    Write-Host "📦 Установите PM2: npm install -g pm2" -ForegroundColor Yellow
    exit 1
}

# Устанавливаем зависимости
Write-Host "📦 Устанавливаем зависимости..." -ForegroundColor Yellow
npm ci --production=false

# Собираем проект
Write-Host "🔨 Собираем проект..." -ForegroundColor Yellow
npm run build

# Применяем миграции базы данных
Write-Host "🗄️ Применяем миграции базы данных..." -ForegroundColor Yellow
npx prisma migrate deploy --schema=database/schema.prisma

# Проверяем, запущен ли бот
$pm2List = pm2 list
if ($pm2List -match "kursik-bot") {
    Write-Host "🔄 Перезапускаем приложение..." -ForegroundColor Yellow
    pm2 reload ecosystem.config.js --update-env
} else {
    Write-Host "▶️ Запускаем приложение..." -ForegroundColor Yellow
    pm2 start ecosystem.config.js
    pm2 save
}

# Проверяем статус
Write-Host "📊 Проверяем статус приложения..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
pm2 status kursik-bot

Write-Host "✅ Деплой завершен!" -ForegroundColor Green
Write-Host "📝 Для просмотра логов используйте: pm2 logs kursik-bot" -ForegroundColor Cyan
Write-Host "📊 Для просмотра статуса используйте: pm2 status" -ForegroundColor Cyan
Write-Host "🛑 Для остановки используйте: pm2 stop kursik-bot" -ForegroundColor Cyan
