import cron from "node-cron";
import { Bot } from "grammy";
import { DateTime } from "luxon";
import { getAllChatIds, getUserSubscriptions, Subscription } from "../../entities/user/user.repo";
import { getExchangeRate } from "../../shared/api/exchange";


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

        for (const { currency, hour, minute, timezone } of subs) {
          const now = DateTime.now().setZone(timezone);
          if (now.hour === hour && now.minute === minute) {
            const result = await getExchangeRate(currency);
            if (!result) continue;
      
            const { rate, scale } = result;
      
            await bot.api.sendMessage(
              chatId,
              `📢 ${scale} ${currency} = ${rate.toFixed(4)} BYN\n` +
              `🕒 Отправлено в ${now.toFormat("HH:mm")} (${timezone})`
            );
          }
        }
    }
  });

  console.log("✅ Уведомления запущены");
}
