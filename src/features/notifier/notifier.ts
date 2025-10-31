import cron from "node-cron";
import { Bot, InlineKeyboard } from "grammy";
import { DateTime } from "luxon";
import { getAllChatIds, getUserSubscriptions, Subscription } from "../../entities/user/user.repo";
import { getExchangeRate, getEnhancedExchangeRate } from "../../shared/api/exchange";
import { getDistinctChangeCurrencies, getChangeSubscribersByCurrency, getLastRate, setLastRate } from "../../entities/user/change.repo";


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

  // Отслеживание изменений курса для подписчиков change_subscriptions
  cron.schedule("* * * * *", async () => {
    const currencies = getDistinctChangeCurrencies();
    if (currencies.length === 0) return;

    for (const currency of currencies) {
      const current = await getExchangeRate(currency);
      if (!current) continue;

      const prev = getLastRate(currency);
      // Если нет предыдущего значения — инициализируем без уведомлений
      if (!prev) {
        setLastRate(currency, current.rate, current.scale);
        continue;
      }

      const hasChanged = current.rate !== prev.rate || current.scale !== prev.scale;
      if (!hasChanged) continue;

      // Получаем расширенные данные для красивого уведомления
      const enhanced = await getEnhancedExchangeRate(currency);
      const subscribers = getChangeSubscribersByCurrency(currency);

      // Обновляем last_rate сразу, чтобы не задвоить
      setLastRate(currency, current.rate, current.scale);

      for (const chatId of subscribers) {
        try {
          await sendChangeNotification(bot, chatId, enhanced ?? {
            currency,
            rate: current.rate,
            scale: current.scale,
            date: new Date().toISOString(),
          });
        } catch (e) {
          console.error(`Не удалось отправить change-уведомление ${chatId} ${currency}:`, e);
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
 * Уведомление при изменении курса
 */
async function sendChangeNotification(
  bot: Bot,
  chatId: number,
  rateData: any
) {
  const { currency, rate, scale, change, changePercent, trend } = rateData;

  const trendEmoji = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '↔️';
  const changeSign = (typeof change === 'number' && change > 0) ? '+' : '';
  const changeLine = (typeof change === 'number' && typeof changePercent === 'number')
    ? `\n${trendEmoji} Изменение: <b>${changeSign}${change.toFixed(4)}</b> (${changeSign}${changePercent.toFixed(2)}%)`
    : '';

  const message = `🔔 <b>Курс ${currency} изменился</b>\n\n💰 <b>${scale} ${currency} = ${rate.toFixed(4)} BYN</b>${changeLine}`;

  await bot.api.sendMessage(chatId, message, { parse_mode: "HTML" });
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
