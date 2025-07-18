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
bot.callbackQuery(/sub_time_/, handleSubscribeTime);

// Обработка нажатий на кнопки отписки
bot.command("unsubscribe", handleUnsubscribe);
bot.callbackQuery(/unsub_/, handleUnsubscribeCallback);

// Команда /subscriptions
bot.command("subscriptions", handleListSubscriptions);

// Команда /set_timezone
bot.command("set_timezone", handleSetTimezone);
bot.on(":location", handleLocation);
bot.hears("🗂 Выбрать из списка", handleManualTimezone);
bot.hears(/^Europe\/|^Asia\//, handleTimezoneText);

// Запускаем планировщик уведомлений
startNotifier(bot);

export { bot };
