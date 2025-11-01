# Kursik Bot - Продакшн Деплой

## Быстрый старт

### 1. Подготовка окружения

```bash
# Клонируем репозиторий
git clone <repository-url>
cd kursik-bot

# Копируем файл с переменными окружения
cp env.example .env

# Редактируем переменные окружения
nano .env
```

### 2. Настройка переменных окружения

Отредактируйте файл `.env`:

```env
# Обязательная переменная
BOT_TOKEN=your_telegram_bot_token_here
```

**Примечание:** Проект использует переменные `BOT_TOKEN` и `DATABASE_URL`. База данных SQLite создается автоматически в файле `data.sqlite`, а курсы валют получаются через API Национального банка Беларуси без дополнительной настройки.

```env
# Токен Telegram бота
BOT_TOKEN=your_telegram_bot_token_here

# URL базы данных SQLite (Prisma)
DATABASE_URL="file:./database/data.sqlite"
```

### 3. Установка зависимостей и сборка

```bash
# Устанавливаем зависимости
npm install

# Сборка TypeScript проекта
npm run build
```

### 4. Настройка PM2

#### Проверка ecosystem файла

Файл `ecosystem.config.js` уже находится в корне проекта. Если его нет, создайте файл с следующей конфигурацией:

```js
module.exports = {
  apps: [
    {
      name: 'kursik-bot',
      script: 'dist/app/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
    },
  ],
};
```

#### Запуск через PM2

```bash
# Запуск приложения через PM2
pm2 start ecosystem.config.js

# Сохраняем процесс для автозапуска после ребута
pm2 save

# Включаем автозапуск при старте системы
pm2 startup
```

### 5. Управление приложением

```bash
# Просмотр списка процессов
pm2 list

# Просмотр логов
pm2 logs kursik-bot

# Перезапуск
pm2 restart kursik-bot

# Остановка
pm2 stop kursik-bot

# Удаление процесса
pm2 delete kursik-bot
```

### 6. Обновление кода

#### Автоматический деплой через GitHub Actions

Если настроен CI/CD, при пуше в ветку `main` автоматически произойдет деплой на сервер.

#### Ручной деплой

```bash
# Используйте скрипт деплоя
chmod +x deploy.sh
./deploy.sh
```

Или вручную:

```bash
# Подтягиваем обновления из Git
git pull origin main

# Устанавливаем зависимости и собираем
npm ci
npm run build

# Применяем миграции базы данных
npx prisma migrate deploy --schema=database/schema.prisma

# Перезапуск через PM2
pm2 reload ecosystem.config.js --update-env
```

## Структура файлов

```
kursik-bot/
├── src/                 # Исходный код
├── dist/                # Скомпилированный код (создается при сборке)
├── data/                # База данных SQLite
├── ecosystem.config.js  # Конфигурация PM2
├── deploy.sh            # Скрипт автоматического деплоя
├── env.example          # Пример переменных окружения
└── .env                 # Переменные окружения (создать вручную)
```

## Безопасность

* Файл `.env` не должен попадать в git
* Используйте сильные токены для ботов
* Регулярно обновляйте зависимости
* Мониторьте логи на предмет ошибок
