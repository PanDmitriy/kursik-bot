#!/bin/bash

# Скрипт для деплоя на продакшен
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

# Останавливаем существующий контейнер
echo "🛑 Останавливаем существующий контейнер..."
docker-compose down || true

# Собираем новый образ
echo "🔨 Собираем новый образ..."
docker-compose build --no-cache

# Запускаем контейнер
echo "▶️ Запускаем контейнер..."
docker-compose up -d

# Проверяем статус
echo "📊 Проверяем статус контейнера..."
docker-compose ps

echo "✅ Деплой завершен!"
echo "📝 Для просмотра логов используйте: docker-compose logs -f"
echo "🛑 Для остановки используйте: docker-compose down"
