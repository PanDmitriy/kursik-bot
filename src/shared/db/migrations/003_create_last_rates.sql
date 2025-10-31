CREATE TABLE IF NOT EXISTS last_rates (
  currency TEXT PRIMARY KEY,
  rate REAL NOT NULL,
  scale INTEGER NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);


