-- Миграция для изменения PRIMARY KEY в таблице subscriptions
-- Разрешает множественные подписки для одной валюты с разным временем
-- PRIMARY KEY меняется с (chat_id, currency) на (chat_id, currency, hour, minute)

-- Проверяем, существует ли таблица subscriptions_new (миграция уже была выполнена)
-- Если нет, создаем новую таблицу и копируем данные

-- Создаем временную таблицу с новым PRIMARY KEY
CREATE TABLE IF NOT EXISTS subscriptions_new (
  chat_id INTEGER NOT NULL,
  currency TEXT NOT NULL,
  hour INTEGER NOT NULL,
  minute INTEGER NOT NULL DEFAULT 0,
  timezone TEXT DEFAULT 'Europe/Minsk',
  PRIMARY KEY (chat_id, currency, hour, minute)
);

-- Копируем данные из старой таблицы только если subscriptions_new пуста
INSERT INTO subscriptions_new (chat_id, currency, hour, minute, timezone)
SELECT chat_id, currency, hour, minute, timezone
FROM subscriptions
WHERE NOT EXISTS (SELECT 1 FROM subscriptions_new);

-- Удаляем старую таблицу subscriptions
DROP TABLE IF EXISTS subscriptions;

-- Переименовываем новую таблицу обратно в subscriptions
-- Если subscriptions_new не существует или subscriptions уже существует, это вызовет ошибку
-- но она будет обработана в db.ts
ALTER TABLE subscriptions_new RENAME TO subscriptions;

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_subscriptions_chat_id ON subscriptions(chat_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_currency ON subscriptions(currency);

