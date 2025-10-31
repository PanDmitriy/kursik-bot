CREATE TABLE IF NOT EXISTS change_subscriptions (
  chat_id INTEGER NOT NULL,
  currency TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (chat_id, currency)
);

-- Индексы для ускорения выборок по валюте
CREATE INDEX IF NOT EXISTS idx_change_subscriptions_currency ON change_subscriptions(currency);


