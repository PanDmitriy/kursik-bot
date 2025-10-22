import { Bot, Context, InlineKeyboard } from "grammy";
import { config } from "dotenv";
import { handleRate, handleRateCallback, getAllRates, formatAllRates } from "../../features/rates/rate.handler";
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
import {
  handleMainMenu,
  handleMenuCallback,
  handleSettingsMenu,
  handleStatsMenu,
  handleHelpMenu,
  handleHelpCommands,
  handleHelpFaq,
} from "../../features/menu/menu.handler";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/utils/navigation";


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

  await ctx.answerCallbackQuery("🔄 Загружаем курсы всех валют...");
  
  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.ALL_CURRENCIES);
  
  const rates = await getAllRates();
  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "🔄 Обновить", callback_data: "rate_all" }
  ]);
  
  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);
  
  await ctx.reply(
    `${breadcrumbs}${formatAllRates(rates)}`,
    {
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
});

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

// Обработка callback-запросов главного меню
bot.callbackQuery(/^menu_/, handleMenuCallback);

// Обработка кнопки "Назад"
bot.callbackQuery("nav_back", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  await ctx.answerCallbackQuery();
  
  // Удаляем последний уровень из хлебных крошек
  NavigationManager.removeLastBreadcrumb(chatId);
  
  // Получаем предыдущий уровень
  const breadcrumbs = NavigationManager.getBreadcrumbs(chatId);
  
  if (breadcrumbs.length === 0) {
    // Если нет хлебных крошек, возвращаемся в главное меню
    await handleMainMenu(ctx);
  } else {
    // Определяем, куда вернуться на основе последнего уровня
    const lastLevel = breadcrumbs[breadcrumbs.length - 1];
    
    switch (lastLevel) {
      case NAVIGATION_LEVELS.MAIN:
        await handleMainMenu(ctx);
        break;
      case NAVIGATION_LEVELS.RATES:
        await handleRate(ctx);
        break;
      case NAVIGATION_LEVELS.SUBSCRIPTIONS:
        await handleListSubscriptions(ctx);
        break;
      case NAVIGATION_LEVELS.SETTINGS:
        await handleSettingsMenu(ctx);
        break;
      case NAVIGATION_LEVELS.STATS:
        await handleStatsMenu(ctx);
        break;
      case NAVIGATION_LEVELS.HELP:
        await handleHelpMenu(ctx);
        break;
      case "Команды":
      case "FAQ":
        await handleHelpMenu(ctx);
        break;
      default:
        await handleMainMenu(ctx);
    }
  }
});

bot.callbackQuery(/^settings_/, async (ctx) => {
  const data = ctx.callbackQuery?.data;
  if (data === "settings_timezone") {
    await handleSetTimezone(ctx);
  } else if (data === "settings_notifications") {
    await ctx.reply("🔔 Настройки уведомлений пока в разработке");
  }
  await ctx.answerCallbackQuery();
});
bot.callbackQuery(/^help_/, async (ctx) => {
  const data = ctx.callbackQuery?.data;
  if (data === "help_commands") {
    await handleHelpCommands(ctx);
  } else if (data === "help_faq") {
    await handleHelpFaq(ctx);
  }
  await ctx.answerCallbackQuery();
});

// Обработка callback-запросов для подписок
bot.callbackQuery("menu_subscribe", async (ctx) => {
  await ctx.answerCallbackQuery();
  await handleSubscribe(ctx);
});

bot.callbackQuery("menu_unsubscribe", async (ctx) => {
  await ctx.answerCallbackQuery();
  await handleUnsubscribe(ctx);
});

// Запускаем планировщик уведомлений
startNotifier(bot);

export { bot };
