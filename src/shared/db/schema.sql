CREATE TABLE IF NOT EXISTS subscriptions (
  chat_id INTEGER NOT NULL,
  currency TEXT NOT NULL,
  hour INTEGER NOT NULL,
  PRIMARY KEY (chat_id, currency)
);
