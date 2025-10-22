import { Bot, Context } from "grammy";
import { config } from "dotenv";
import { handleRate, handleRateCallback } from "../../features/rates/rate.handler";
import {
  handleSubscribe,
  handleSubscribeCurrency,
  handleSubscribeTime,
} from "../../features/subscribe/subscribe.handler";
import {
  handleUnsubscribe,
  handleUnsubscribeCallback
} from "../../features/subscribe/unsubscribe.handler";
import { handleListSubscriptions } from "../../features/subscribe/list.handler";
import { startNotifier } from "../../features/notifier/notifier";
import {
  handleSetTimezone,
  handleLocation,
  handleManualTimezone,
  handleTimezoneText,
  handleTimezoneSearch,
  handleTimezoneSearchQuery,
  handleTimezoneRegions,
  handleTimezoneRegion,
  handleTimezoneCallback,
} from "../../features/timezone/timezone.handler";


// Загружаем переменные из .env
config();

const bot = new Bot<Context>(process.env.BOT_TOKEN!);

// Команда /start
bot.command("start", async (ctx) => {
  await ctx.reply(
    `Привет, ${ctx.from?.first_name || "друг"}! 👋

Я помогу тебе отслеживать курсы валют к белорусскому рублю (BYN).

📌 Доступные команды:
/rate [код валюты] — курс валюты к BYN (по умолчанию USD)
/subscribe — ежедневная рассылка курса
/unsubscribe — отключить рассылку
/subscriptions — список подписок
/set_timezone — установить часовой пояс`
  );
});

// Команда /rate
bot.command("rate", handleRate);
bot.on("callback_query:data", handleRateCallback);

// Обработка нажатий на кнопки подписки
bot.command("subscribe", handleSubscribe);
bot.callbackQuery(/sub_currency_/, handleSubscribeCurrency);
// Обработка текстового ввода времени HH:mm
bot.hears(/^([01]?\d|2[0-3]):([0-5]\d)$/, handleSubscribeTime);

// Обработка нажатий на кнопки отписки
bot.command("unsubscribe", handleUnsubscribe);
bot.callbackQuery(/unsub_/, handleUnsubscribeCallback);

// Команда /subscriptions
bot.command("subscriptions", handleListSubscriptions);

// Команда /set_timezone
bot.command("set_timezone", handleSetTimezone);
bot.on(":location", handleLocation);
bot.hears("🗂 Выбрать из списка", handleManualTimezone);
bot.hears("🔍 Поиск часового пояса", handleTimezoneSearch);

// Обработка callback-запросов для часовых поясов
bot.callbackQuery("tz_regions", handleTimezoneRegions);
bot.callbackQuery("tz_popular", handleManualTimezone);

bot.callbackQuery(/^tz_region_/, async (ctx) => {
  const regionName = ctx.callbackQuery.data.replace("tz_region_", "");
  await handleTimezoneRegion(ctx, regionName);
});

// Обработка выбора конкретного часового пояса (более точное регулярное выражение)
bot.callbackQuery(/^tz_[A-Za-z]+\/[A-Za-z_]+$/, async (ctx) => {
  const timezoneId = ctx.callbackQuery.data.replace("tz_", "");
  await handleTimezoneCallback(ctx, timezoneId);
});

// Обработка текстового ввода для поиска часовых поясов
bot.hears(/^[A-Za-zА-Яа-я\s]+$/, handleTimezoneText);

// Запускаем планировщик уведомлений
startNotifier(bot);

export { bot };
