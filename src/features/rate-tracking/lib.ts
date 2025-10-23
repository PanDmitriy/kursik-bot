import { getEnhancedExchangeRate } from "./api";
import { EnhancedExchangeRate } from "../../entities/currency/model";
import { AVAILABLE_CURRENCIES } from "../../entities/currency/model";

/**
 * Получить курсы всех валют
 */
export async function getAllRates(): Promise<EnhancedExchangeRate[]> {
  const rates: EnhancedExchangeRate[] = [];
  
  for (const currency of AVAILABLE_CURRENCIES) {
    try {
      const rate = await getEnhancedExchangeRate(currency.code);
      if (rate) {
        rates.push(rate);
      }
    } catch (error) {
      console.error(`Ошибка получения курса ${currency.code}:`, error);
    }
  }
  
  return rates;
}

/**
 * Форматирование всех курсов
 */
export function formatAllRates(rates: EnhancedExchangeRate[]): string {
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

/**
 * Форматирование улучшенного курса с трендом
 */
export function formatEnhancedRate(data: EnhancedExchangeRate): string {
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
