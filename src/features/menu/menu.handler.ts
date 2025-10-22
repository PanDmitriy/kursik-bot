import { Context, InlineKeyboard } from "grammy";
import { handleRate } from "../rates/rate.handler";
import { handleSubscribe } from "../subscribe/subscribe.handler";
import { handleListSubscriptions } from "../subscribe/list.handler";
import { handleUnsubscribe } from "../subscribe/unsubscribe.handler";
import { handleSetTimezone } from "../timezone/timezone.handler";
import { getUserSubscriptions, getUserTimezone } from "../../entities/user/user.repo";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/utils/navigation";

/**
 * Главное меню бота с основными функциями
 */
export async function handleMainMenu(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Очищаем хлебные крошки и устанавливаем главное меню
  NavigationManager.clearBreadcrumbs(chatId);
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.MAIN);

  const keyboard = new InlineKeyboard()
    .text("💰 Курсы валют", "menu_rates")
    .row()
    .text("🔔 Мои подписки", "menu_subscriptions")
    .text("⚙️ Настройки", "menu_settings")
    .row()
    .text("📊 Статистика", "menu_stats")
    .text("ℹ️ Помощь", "menu_help");

  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${breadcrumbs}🏠 <b>Главное меню</b>

Выбери нужную функцию:`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

/**
 * Обработка нажатий на кнопки главного меню
 */
export async function handleMenuCallback(ctx: Context, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("menu_")) return next();

  await ctx.answerCallbackQuery();

  switch (data) {
    case "menu_main":
      await handleMainMenu(ctx);
      break;
      
    case "menu_rates":
      await handleRate(ctx);
      break;
      
    case "menu_subscriptions":
      await handleListSubscriptions(ctx);
      break;
      
    case "menu_settings":
      await handleSettingsMenu(ctx);
      break;
      
    case "menu_stats":
      await handleStatsMenu(ctx);
      break;
      
    case "menu_help":
      await handleHelpMenu(ctx);
      break;
      
    default:
      await ctx.reply("❓ Неизвестная команда");
  }
}

/**
 * Меню настроек
 */
export async function handleSettingsMenu(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.SETTINGS);

  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  // Создаем клавиатуру с кнопками настроек и навигацией
  const keyboard = new InlineKeyboard()
    .text("🌍 Часовой пояс", "settings_timezone")
    .row()
    .text("🔔 Уведомления", "settings_notifications");

  // Добавляем навигационные кнопки
  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "🌍 Часовой пояс", callback_data: "settings_timezone" },
    { text: "🔔 Уведомления", callback_data: "settings_notifications" }
  ]);

  await ctx.reply(
    `${breadcrumbs}⚙️ <b>Настройки</b>

Выбери что хочешь настроить:`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}

/**
 * Меню статистики
 */
export async function handleStatsMenu(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.STATS);

  // Получаем статистику пользователя
  const subs = getUserSubscriptions(chatId);
  const totalSubs = subs.length;
  
  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId);
  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${breadcrumbs}📊 <b>Твоя статистика</b>

🔔 Активных подписок: <b>${totalSubs}</b>
💰 Отслеживаемых валют: <b>${new Set(subs.map(s => s.currency)).size}</b>
🌍 Часовой пояс: <b>${getUserTimezone(chatId)}</b>

<i>Статистика обновляется в реальном времени</i>`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}

/**
 * Меню помощи
 */
export async function handleHelpMenu(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.HELP);

  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  // Создаем клавиатуру с кнопками помощи и навигацией
  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "📋 Команды", callback_data: "help_commands" },
    { text: "❓ FAQ", callback_data: "help_faq" }
  ]);

  await ctx.reply(
    `${breadcrumbs}ℹ️ <b>Помощь</b>

Выбери что тебя интересует:`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}

/**
 * Список команд
 */
export async function handleHelpCommands(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, "Команды");

  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "❓ FAQ", callback_data: "help_faq" }
  ]);
  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${breadcrumbs}📋 <b>Доступные команды</b>

<b>Основные:</b>
/start — запуск бота
/menu — главное меню
/rate — курсы валют
/subscribe — подписка на уведомления
/unsubscribe — отмена подписки
/subscriptions — список подписок
/set_timezone — настройка часового пояса

<b>Быстрые действия:</b>
• Нажми на кнопки в главном меню
• Используй /menu для быстрого доступа ко всем функциям`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}

/**
 * FAQ
 */
export async function handleHelpFaq(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, "FAQ");

  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "📋 Команды", callback_data: "help_commands" }
  ]);
  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${breadcrumbs}❓ <b>Часто задаваемые вопросы</b>

<b>Как работает подписка?</b>
• Выбери валюту и время уведомления
• Бот будет присылать курс каждый день в указанное время
• Время учитывает твой часовой пояс

<b>Как изменить время уведомлений?</b>
• Отмени старую подписку через /unsubscribe
• Создай новую через /subscribe

<b>Откуда берутся курсы?</b>
• Используем официальный API Национального банка РБ
• Курсы обновляются ежедневно в рабочие дни

<b>Поддерживаемые валюты:</b>
USD, EUR, RUB, CNY, PLN`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}

