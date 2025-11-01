#!/bin/bash

# Скрипт для деплоя на продакшен с PM2
# Использование: ./deploy.sh

set -e

echo "🚀 Начинаем деплой kursik-bot..."

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "📋 Скопируйте env.example в .env и заполните переменные:"
    echo "   cp env.example .env"
    echo "   nano .env"
    exit 1
fi

# Проверяем наличие PM2
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 не установлен!"
    echo "📦 Установите PM2: npm install -g pm2"
    exit 1
fi

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm ci --production=false

# Собираем проект
echo "🔨 Собираем проект..."
npm run build

# Применяем миграции базы данных
echo "🗄️ Применяем миграции базы данных..."
npx prisma migrate deploy --schema=database/schema.prisma

# Создаем директорию для логов, если её нет
mkdir -p logs

# Проверяем, запущен ли бот
if pm2 list | grep -q "kursik-bot"; then
    echo "🔄 Перезапускаем приложение..."
    pm2 reload ecosystem.config.js --update-env
else
    echo "▶️ Запускаем приложение..."
    pm2 start ecosystem.config.js
    pm2 save
fi

# Проверяем статус
echo "📊 Проверяем статус приложения..."
sleep 2
pm2 status kursik-bot

echo "✅ Деплой завершен!"
echo "📝 Для просмотра логов используйте: pm2 logs kursik-bot"
echo "📊 Для просмотра статуса используйте: pm2 status"
echo "🛑 Для остановки используйте: pm2 stop kursik-bot"
