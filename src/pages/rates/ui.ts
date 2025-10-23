import { Context } from "grammy";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/lib/navigation";
import { createCurrencyKeyboard, createRateDetailKeyboard, createAllRatesKeyboard } from "../../widgets/currency-list/ui";
import { getEnhancedExchangeRate } from "../../features/rate-tracking/api";
import { formatEnhancedRate, formatAllRates, getAllRates } from "../../features/rate-tracking/lib";

export async function handleRate(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Проверяем, не находимся ли мы уже в меню курсов
  const currentBreadcrumbs = NavigationManager.getBreadcrumbs(chatId);
  const isAlreadyInRates = currentBreadcrumbs.includes(NAVIGATION_LEVELS.RATES);
  
  // Добавляем уровень в хлебные крошки только если мы еще не в меню курсов
  if (!isAlreadyInRates) {
    NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.RATES);
  }

  const keyboard = createCurrencyKeyboard();
  
  // Добавляем навигационные кнопки на отдельной строке
  const navBreadcrumbs = NavigationManager.getBreadcrumbs(chatId);
  if (navBreadcrumbs.length > 1) {
    keyboard.row().text("🔙 Назад", "nav_back");
  }
  keyboard.text("🏠 Главное меню", "menu_main");

  const formattedBreadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${formattedBreadcrumbs}💰 <b>Курсы валют</b>

Выберите валюту:`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleRateCallback(ctx: Context, next: () => Promise<void>): Promise<void> {
  const callbackData = ctx.callbackQuery?.data;

  if (!callbackData || !callbackData.startsWith("rate_")) return next();

  const currency = callbackData.replace("rate_", "");

  if (currency === "all") {
    await handleAllRates(ctx);
    return;
  }

  const result = await getEnhancedExchangeRate(currency);

  if (result) {
    await ctx.answerCallbackQuery(); // убирает "загрузка..."
    
    const chatId = ctx.chat?.id;
    if (chatId) {
      // Добавляем уровень в хлебные крошки
      NavigationManager.addBreadcrumb(chatId, `${NAVIGATION_LEVELS.RATE_DETAIL} ${currency}`);
    }
    
    const keyboard = createRateDetailKeyboard(currency);
    
    // Добавляем навигационные кнопки
    const breadcrumbs = NavigationManager.getBreadcrumbs(chatId!);
    if (breadcrumbs.length > 1) {
      keyboard.text("🔙 Назад", "nav_back");
    }
    keyboard.text("🏠 Главное меню", "menu_main");
    
    const currentBreadcrumbs = NavigationManager.formatBreadcrumbs(chatId!);
    
    await ctx.reply(
      `${currentBreadcrumbs}${formatEnhancedRate(result)}`,
      {
        reply_markup: keyboard,
        parse_mode: "HTML"
      }
    );
  } else {
    await ctx.answerCallbackQuery({ text: "Ошибка получения курса", show_alert: true });
  }
}

export async function handleAllRates(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  await ctx.answerCallbackQuery("🔄 Загружаем курсы всех валют...");
  
  // Проверяем, не находимся ли мы уже в разделе "Все валюты"
  const currentBreadcrumbs = NavigationManager.getBreadcrumbs(chatId);
  const isAlreadyInAllCurrencies = currentBreadcrumbs.includes(NAVIGATION_LEVELS.ALL_CURRENCIES);
  
  // Добавляем уровень в хлебные крошки только если мы еще не в разделе "Все валюты"
  if (!isAlreadyInAllCurrencies) {
    NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.ALL_CURRENCIES);
  }
  
  const rates = await getAllRates();
  
  const keyboard = createAllRatesKeyboard();
  
  // Добавляем навигационные кнопки
  const navBreadcrumbs = NavigationManager.getBreadcrumbs(chatId);
  if (navBreadcrumbs.length > 1) {
    keyboard.text("🔙 Назад", "nav_back");
  }
  keyboard.text("🏠 Главное меню", "menu_main");
  
  const formattedBreadcrumbs = NavigationManager.formatBreadcrumbs(chatId);
  
  await ctx.reply(
    `${formattedBreadcrumbs}${formatAllRates(rates)}`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}
