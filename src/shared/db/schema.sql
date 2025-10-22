CREATE TABLE IF NOT EXISTS subscriptions (
  chat_id INTEGER NOT NULL,
  currency TEXT NOT NULL,
  hour INTEGER NOT NULL,
  minute INTEGER NOT NULL DEFAULT 0,
  timezone TEXT DEFAULT 'Europe/Minsk',
  PRIMARY KEY (chat_id, currency)
);
