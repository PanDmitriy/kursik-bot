import { Bot, Context, InlineKeyboard } from "grammy";
import { config } from "dotenv";
import { handleRate, handleRateCallback, getAllRates, formatAllRates } from "../../features/rates/rate.handler";
import {
  handleSubscribe,
  handleSubscribeCurrency,
  handleSubscribeTime,
  handleSubscribeTypeSelect,
  handleSubscribeTypeSelectFromRate,
} from "../../features/subscribe/subscribe.handler";
import {
  handleUnsubscribe,
  handleUnsubscribeCallback,
  handleUnsubscribeType
} from "../../features/subscribe/unsubscribe.handler";
import { handleListSubscriptions } from "../../features/subscribe/list.handler";
import { startNotifier } from "../../features/notifier/notifier";
import { handleUnsubscribeChangeCallback } from "../../features/subscribe_change/unsubscribe_change.handler";
import {
  handleSetTimezone,
  handleLocation,
  handleLocationRequest,
  handleManualTimezone,
  handleTimezoneText,
  handleTimezoneSearch,
  handleTimezoneSearchQuery,
  handleTimezoneRegions,
  handleTimezoneRegion,
  handleTimezoneCallback,
} from "../../features/timezone/timezone.handler";
import {
  handleMainMenu,
  handleMenuCallback,
  handleSettingsMenu,
  handleStatsMenu,
  handleHelpMenu,
  handleHelpCommands,
  handleHelpFaq,
} from "../../features/menu/menu.handler";


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
/set_timezone — установить часовой пояс

💡 <b>Совет:</b> Используй /menu для быстрого доступа ко всем функциям!`,
    { parse_mode: "HTML" }
  );
});

// Команда /menu - главное меню
bot.command("menu", handleMainMenu);

// Команда /help - помощь
bot.command("help", async (ctx) => {
  await handleHelpMenu(ctx);
});

// Команда /rate
bot.command("rate", handleRate);

// Обработка "Все валюты" - должен быть перед handleRateCallback
bot.callbackQuery("rate_all", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  try {
    await ctx.answerCallbackQuery("🔄 Загружаем курсы всех валют...");
  } catch {
    // Игнорируем ошибки устаревших callback queries
  }
  
  const rates = await getAllRates();
  
  // Создаем красивую клавиатуру
  const keyboard = new InlineKeyboard()
    .text("🔄 Обновить", "rate_all")
    .row()
    .text("🏠 Главное меню", "menu_main");
  
  await ctx.reply(
    formatAllRates(rates),
    {
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
});

bot.on("callback_query:data", handleRateCallback);

// Обработка нажатий на кнопки подписки (ежедневной)
bot.command("subscribe", handleSubscribe);
bot.callbackQuery("sub_type_daily", handleSubscribeTypeSelect);
bot.callbackQuery("sub_type_change", handleSubscribeTypeSelect);
bot.callbackQuery(/sub_type_select_/, handleSubscribeTypeSelectFromRate);
bot.callbackQuery(/sub_currency_/, handleSubscribeCurrency);
// Обработка текстового ввода времени HH:mm
bot.hears(/^([01]?\d|2[0-3]):([0-5]\d)$/, handleSubscribeTime);

// Колбэк удаления change-подписки (используется из сценария выбора типа удаления)
bot.callbackQuery(/unsubchg_/, handleUnsubscribeChangeCallback);

// Обработка нажатий на кнопки отписки
bot.command("unsubscribe", handleUnsubscribe);
bot.callbackQuery(/unsub_/, handleUnsubscribeCallback);
bot.callbackQuery(/unsub_type_/, handleUnsubscribeType);

// Команда /subscriptions
bot.command("subscriptions", handleListSubscriptions);

// Команда /set_timezone
bot.command("set_timezone", handleSetTimezone);
bot.on(":location", handleLocation);

// Обработка callback-запросов для часовых поясов
bot.callbackQuery("tz_location", handleLocationRequest);
bot.callbackQuery("tz_list", handleManualTimezone);
bot.callbackQuery("tz_search", handleTimezoneSearch);
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

// Обработка callback-запросов для подписок (должны быть перед общим обработчиком menu_)
bot.callbackQuery("menu_subscribe", async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
  } catch {
    // Игнорируем ошибки устаревших callback queries
  }
  await handleSubscribe(ctx);
});

bot.callbackQuery("menu_unsubscribe", async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
  } catch {
    // Игнорируем ошибки устаревших callback queries
  }
  await handleUnsubscribe(ctx);
});

// Обработка callback-запросов главного меню
bot.callbackQuery(/^menu_/, handleMenuCallback);

bot.callbackQuery(/^settings_/, async (ctx) => {
  const data = ctx.callbackQuery?.data;
  if (data === "settings_timezone") {
    await handleSetTimezone(ctx);
  } else if (data === "settings_notifications") {
    await ctx.reply("🔔 Настройки уведомлений пока в разработке");
  }
  try {
    await ctx.answerCallbackQuery();
  } catch {
    // Игнорируем ошибки устаревших callback queries
  }
});
bot.callbackQuery(/^help_/, async (ctx) => {
  const data = ctx.callbackQuery?.data;
  if (data === "help_commands") {
    await handleHelpCommands(ctx);
  } else if (data === "help_faq") {
    await handleHelpFaq(ctx);
  }
  try {
    await ctx.answerCallbackQuery();
  } catch {
    // Игнорируем ошибки устаревших callback queries
  }
});


// Глобальный обработчик ошибок
bot.catch = (err: any) => {
  const ctx = err.ctx as Context;
  const error = err.error as any;
  
  // Игнорируем ошибки устаревших callback queries
  if (error?.error_code === 400 && error?.description?.includes("too old")) {
    console.log(`[BOT] Ignoring expired callback query: ${ctx.callbackQuery?.data || "unknown"}`);
    return;
  }
  
  console.error(`[BOT] Error in middleware:`, error);
  console.error(`[BOT] Update:`, ctx.update);
  
  // Пытаемся ответить пользователю об ошибке
  if (ctx.callbackQuery) {
    ctx.answerCallbackQuery({
      text: "⚠️ Произошла ошибка. Попробуйте еще раз.",
      show_alert: false
    }).catch(() => {
      // Игнорируем ошибки при ответе на callback
    });
  } else if (ctx.message) {
    ctx.reply("⚠️ Произошла ошибка. Попробуйте еще раз.").catch(() => {
      // Игнорируем ошибки при отправке сообщения
    });
  }
};

// Запускаем планировщик уведомлений
startNotifier(bot);

export { bot };
