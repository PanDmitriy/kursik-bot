-- Миграция для добавления колонки minute в таблицу subscriptions
-- Проверяем, существует ли колонка minute, и добавляем её если нет
ALTER TABLE subscriptions ADD COLUMN minute INTEGER NOT NULL DEFAULT 0;
