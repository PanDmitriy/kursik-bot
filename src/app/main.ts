import { telegramBot } from "./providers/bot";
import { setupBotHandlers } from "./providers/handlers";

async function bootstrap(): Promise<void> {
  try {
    // Настраиваем обработчики
    setupBotHandlers();

    // Устанавливаем команды бота
    await telegramBot.api.setMyCommands([
      { command: "menu", description: "Главное меню бота" },
      { command: "rate", description: "Курс валюты к BYN" },
      { command: "subscribe", description: "Подписка на ежедневную рассылку" },
      { command: "unsubscribe", description: "Отключить подписку" },
      { command: "subscriptions", description: "Список моих подписок" },
      { command: "set_timezone", description: "Установить часовой пояс" },
    ]);

    await telegramBot.start();
    console.log("🤖 Бот запущен");
  } catch (error) {
    console.error("Ошибка при запуске бота:", error);
  }
}

bootstrap();