-- CreateTable
CREATE TABLE "subscriptions" (
    "chat_id" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Minsk',

    PRIMARY KEY ("chat_id", "currency", "hour", "minute")
);

-- CreateTable
CREATE TABLE "change_subscriptions" (
    "chat_id" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("chat_id", "currency")
);

-- CreateTable
CREATE TABLE "last_rates" (
    "currency" TEXT NOT NULL PRIMARY KEY,
    "rate" REAL NOT NULL,
    "scale" INTEGER NOT NULL,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "subscriptions_chat_id_idx" ON "subscriptions"("chat_id");

-- CreateIndex
CREATE INDEX "subscriptions_currency_idx" ON "subscriptions"("currency");

-- CreateIndex
CREATE INDEX "change_subscriptions_currency_idx" ON "change_subscriptions"("currency");
