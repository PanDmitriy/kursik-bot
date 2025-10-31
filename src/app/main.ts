import { bot } from "../bots/telegram/bot";

async function bootstrap() {
  try {
    await bot.api.setMyCommands([
      { command: "menu", description: "Главное меню бота" },
      { command: "rate", description: "Курс валюты к BYN" },
      { command: "subscribe", description: "Подписка на ежедневную рассылку" },
      { command: "subscribe_change", description: "Подписка при изменении курса" },
      { command: "unsubscribe", description: "Отключить подписку" },
      { command: "unsubscribe_change", description: "Отключить подписку по изменению" },
      { command: "subscriptions", description: "Список моих подписок" },
      { command: "set_timezone", description: "Установить часовой пояс" },
    ]);

    await bot.start();
    console.log("🤖 Бот запущен");
  } catch (error) {
    console.error("Ошибка при запуске бота:", error);
  }
}

bootstrap();
