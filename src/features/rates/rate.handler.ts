import { Context, InlineKeyboard } from "grammy";
import { getExchangeRate, getEnhancedExchangeRate, EnhancedRateData } from "../../shared/api/exchange";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/utils/navigation";

export const AVAILABLE_CURRENCIES = ["USD", "EUR", "RUB", "CNY", "PLN"];

/**
 * Получить курсы всех валют
 */
export async function getAllRates(): Promise<EnhancedRateData[]> {
  const rates: EnhancedRateData[] = [];
  
  for (const currency of AVAILABLE_CURRENCIES) {
    try {
      const rate = await getEnhancedExchangeRate(currency);
      if (rate) {
        rates.push(rate);
      }
    } catch (error) {
      console.error(`Ошибка получения курса ${currency}:`, error);
    }
  }
  
  return rates;
}

/**
 * Форматирование всех курсов
 */
export function formatAllRates(rates: EnhancedRateData[]): string {
  if (rates.length === 0) {
    return "❌ Не удалось получить курсы валют";
  }
  
  const lines = rates.map(rate => {
    const { currency, rate: value, scale, change, changePercent, trend } = rate;
    const trendEmoji = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
    const changeEmoji = trend === 'up' ? '🟢' : trend === 'down' ? '🔴' : '⚪';
    
    let changeText = '';
    if (change !== undefined && changePercent !== undefined) {
      const changeSign = change > 0 ? '+' : '';
      changeText = ` ${changeEmoji}${changeSign}${changePercent.toFixed(1)}%`;
    }
    
    return `${trendEmoji} <b>${currency}</b>: ${value.toFixed(4)} BYN${changeText}`;
  });
  
  return `💱 <b>Курсы валют к BYN</b>

${lines.join('\n')}

📅 <b>Обновлено:</b> ${new Date().toLocaleString('ru-RU')}
🏛️ <b>Источник:</b> НБРБ`;
}

export async function handleRate(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.RATES);

  const keyboard = new InlineKeyboard();

  for (const code of AVAILABLE_CURRENCIES) {
    keyboard.text(code, `rate_${code}`);
  }

  // Добавляем кнопку "Все валюты"
  keyboard.row().text("📊 Все валюты", "rate_all");

  // Добавляем навигационные кнопки
  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "📊 Все валюты", callback_data: "rate_all" }
  ]);

  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${breadcrumbs}💰 <b>Курсы валют</b>

Выберите валюту:`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}

// Обработка нажатий на кнопки
export async function handleRateCallback(ctx: Context, next: () => Promise<void>) {
  const callbackData = ctx.callbackQuery?.data;

  if (!callbackData || !callbackData.startsWith("rate_")) return next();

  const currency = callbackData.replace("rate_", "");

  const result = await getEnhancedExchangeRate(currency);

  if (result) {
    await ctx.answerCallbackQuery(); // убирает "загрузка..."
    
    const chatId = ctx.chat?.id;
    if (chatId) {
      // Добавляем уровень в хлебные крошки
      NavigationManager.addBreadcrumb(chatId, `${NAVIGATION_LEVELS.RATE_DETAIL} ${currency}`);
    }
    
    // Создаем интерактивную клавиатуру с навигацией
    const navKeyboard = NavigationManager.createNavigationKeyboard(chatId!, [
      { text: "🔄 Обновить", callback_data: `rate_${currency}` },
      { text: "📊 Все валюты", callback_data: "rate_all" },
      { text: "🔔 Подписаться", callback_data: `sub_currency_${currency}` }
    ]);
    
    const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId!);
    
    await ctx.reply(
      `${breadcrumbs}${formatEnhancedRate(result)}`,
      {
        reply_markup: navKeyboard,
        parse_mode: "HTML"
      }
    );
  } else {
    await ctx.answerCallbackQuery({ text: "Ошибка получения курса", show_alert: true });
  }
}

/**
 * Форматирование улучшенного курса с трендом
 */
function formatEnhancedRate(data: EnhancedRateData): string {
  const { rate, scale, currency, change, changePercent, trend, date } = data;
  
  // Эмодзи для тренда
  const trendEmoji = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  
  // Цветовое кодирование (используем эмодзи для имитации)
  const changeEmoji = trend === 'up' ? '🟢' : trend === 'down' ? '🔴' : '⚪';
  
  // Форматирование изменения
  let changeText = '';
  if (change !== undefined && changePercent !== undefined) {
    const changeSign = change > 0 ? '+' : '';
    changeText = `\n${changeEmoji} <b>${changeSign}${change.toFixed(4)}</b> (${changeSign}${changePercent.toFixed(2)}%)`;
  }
  
  // Форматирование даты
  const formattedDate = new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  return `💱 <b>${currency} к BYN</b>

💰 <b>${scale} ${currency} = ${rate.toFixed(4)} BYN</b>
${trendEmoji} <b>Тренд:</b> ${getTrendText(trend)}
${changeText}

📅 <b>Дата:</b> ${formattedDate}
🏛️ <b>Источник:</b> НБРБ`;
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
