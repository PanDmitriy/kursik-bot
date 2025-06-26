import { bot } from "../bots/telegram/bot";

async function bootstrap() {
  try {
    await bot.api.setMyCommands([
      { command: "start", description: "Приветствие и инструкция" },
      { command: "rate", description: "Курс валюты к BYN" },
      { command: "subscribe", description: "Подписка на ежедневную рассылку" },
      { command: "unsubscribe", description: "Отключить подписку" },
    ]);

    await bot.start();
    console.log("🤖 Бот запущен");
  } catch (error) {
    console.error("Ошибка при запуске бота:", error);
  }
}

bootstrap();
