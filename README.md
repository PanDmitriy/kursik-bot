# 📈 CurrencyBot — Telegram-бот для курсов валют

Telegram-бот, который показывает актуальные курсы валют к белорусскому рублю (BYN) и отправляет ежедневные уведомления. MVP-версия с возможностью подписки и простым API.

## 🚀 Возможности MVP

- `/start` — приветствие и инструкция
- `/rate [валюта]` — показывает курс к BYN (по умолчанию USD)
- `/subscribe` — подписка на ежедневные курсы
- `/unsubscribe` — отмена подписки
- Хранение пользователей в SQLite (в разработке)
- Cron-рассылка с помощью `node-cron`
- Курсы берутся с официального API НБРБ

**Поддерживаемые валюты:** USD, EUR, RUB, CNY, PLN

---

## 🛠️ Стек

- Node.js + TypeScript
- [grammY](https://grammy.dev/) — Telegram Bot API
- Axios — запросы к API курсов валют
- SQLite + better-sqlite3 — простая БД
- node-cron — планировщик рассылки
- dotenv — переменные окружения

---

## 📁 Структура проекта (FSD light)

```
src/
├── app/                  # Точка входа
├── bots/telegram/        # Telegram-бот
├── shared/api/           # API для курсов валют (НБРБ)
├── shared/db/            # Работа с SQLite (в разработке)
├── entities/user/        # Репозиторий пользователей (в разработке)
├── features/rates/       # Команда /rate
├── features/subscribe/   # Подписка и рассылка (в разработке)
```

---

## ⚙️ Установка

```bash
git clone https://github.com/your-username/currency-bot.git
cd currency-bot
npm install
```

Создай `.env` с токеном:

```
BOT_TOKEN=your_telegram_bot_token
```

---

## 🚴 Запуск в разработке

```bash
npm run dev
```

---

## 🧩 Курсы валют

Используется официальный API Национального банка Республики Беларусь (НБРБ):

```
GET https://www.nbrb.by/api/exrates/rates/{currency}?parammode=2
```

Например, для USD:
```
GET https://www.nbrb.by/api/exrates/rates/USD?parammode=2
```

---

## 🔮 Планы на будущее

- Поддержка нескольких валют и базовых валют
- Поддержка часового пояса
- Telegram Payments API для премиум-подписки
- Панель администратора
- Мониторинг и логирование

---

## 📜 Лицензия

MIT License
