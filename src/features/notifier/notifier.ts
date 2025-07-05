import cron from "node-cron";
import { getAllChatIds, getUserSubscriptions, Subscription } from "../../entities/user/user.repo";
import { getExchangeRate } from "../../shared/api/exchange";
import { Bot } from "grammy";

// Функция запуска планировщика
export function startNotifier(bot: Bot) {
  // Проверяем каждую минуту
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const currentHour = now.getHours();

    // Можно оптимизировать — если пользователей станет много
    const allChatIds = getAllChatIds(); // см. ниже

    for (const chatId of allChatIds) {
      const subs: Subscription[] = getUserSubscriptions(chatId);

      for (const { currency, hour } of subs) {
        if (hour === currentHour) {
          const result = await getExchangeRate(currency);
          if (!result) continue;

          const { rate, scale } = result;

          await bot.api.sendMessage(
            chatId,
            `📢 Курс ${currency} на ${now.toLocaleDateString()}:\n` +
              `${scale} ${currency} = ${rate.toFixed(4)} BYN`
          );
        }
      }
    }
  });

  console.log("✅ Уведомления запущены");
}
