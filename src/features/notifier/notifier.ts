import cron from "node-cron";
import { Bot, InlineKeyboard } from "grammy";
import { DateTime } from "luxon";
import { getAllChatIds, getUserSubscriptions, Subscription } from "../../entities/user/user.repo";
import { getExchangeRate, getEnhancedExchangeRate } from "../../shared/api/exchange";


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
            const result = await getEnhancedExchangeRate(currency);
            if (!result) continue;
      
            await sendInteractiveNotification(bot, chatId, result, now, timezone);
          }
        }
    }
  });

  console.log("✅ Уведомления запущены");
}

/**
 * Отправить интерактивное уведомление с кнопками
 */
async function sendInteractiveNotification(
  bot: Bot, 
  chatId: number, 
  rateData: any, 
  now: DateTime, 
  timezone: string
) {
  const { currency, rate, scale, change, changePercent, trend } = rateData;
  
  // Эмодзи для тренда
  const trendEmoji = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  const changeEmoji = trend === 'up' ? '🟢' : trend === 'down' ? '🔴' : '⚪';
  
  // Форматирование изменения
  let changeText = '';
  if (change !== undefined && changePercent !== undefined) {
    const changeSign = change > 0 ? '+' : '';
    changeText = `\n${changeEmoji} <b>${changeSign}${change.toFixed(4)}</b> (${changeSign}${changePercent.toFixed(2)}%)`;
  }
  
  const message = `📢 <b>Ежедневное уведомление</b>

💱 <b>${currency} к BYN</b>
💰 <b>${scale} ${currency} = ${rate.toFixed(4)} BYN</b>
${trendEmoji} <b>Тренд:</b> ${getTrendText(trend)}
${changeText}

🕒 <b>Время:</b> ${now.toFormat("HH:mm")} (${timezone})
📅 <b>Дата:</b> ${now.toFormat("dd.MM.yyyy")}`;

  // Создаем интерактивную клавиатуру
  const keyboard = new InlineKeyboard()
    .text("🔄 Обновить", `rate_${currency}`)
    .text("📊 Все валюты", "rate_all")
    .row()
    .text("⚙️ Настройки", "settings_notifications")
    .text("🏠 Главное меню", "menu_main");

  await bot.api.sendMessage(chatId, message, {
    reply_markup: keyboard,
    parse_mode: "HTML"
  });
}

/**
 * Получить текстовое описание тренда
 */
function getTrendText(trend?: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return 'Рост';
    case 'down': return 'Падение';
    case 'stable': return 'Стабильно';
    default: return 'Неизвестно';
  }
}
