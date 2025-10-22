import axios from "axios";

export interface ExchangeRateData {
  rate: number;
  scale: number;
  date: string;
  currency: string;
}

export interface EnhancedRateData extends ExchangeRateData {
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
}

export async function getExchangeRate(
  currency: string = "USD"
): Promise<{ rate: number; scale: number } | null> {
  try {
    const res = await axios.get(
      `https://www.nbrb.by/api/exrates/rates/${currency}?parammode=2`
    );

    const rate = res.data?.Cur_OfficialRate;
    const scale = res.data?.Cur_Scale;

    return rate && scale ? { rate, scale } : null;
  } catch (error) {
    console.error("Ошибка при получении курса НБРБ:", error);
    return null;
  }
}

/**
 * Получить расширенные данные курса с трендом
 */
export async function getEnhancedExchangeRate(
  currency: string = "USD"
): Promise<EnhancedRateData | null> {
  try {
    // Получаем текущий курс
    const currentRes = await axios.get(
      `https://www.nbrb.by/api/exrates/rates/${currency}?parammode=2`
    );

    const currentRate = currentRes.data?.Cur_OfficialRate;
    const scale = currentRes.data?.Cur_Scale;
    const date = currentRes.data?.Date;

    if (!currentRate || !scale) return null;

    // Получаем вчерашний курс для сравнения
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let change = 0;
    let changePercent = 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';

    try {
      const yesterdayRes = await axios.get(
        `https://www.nbrb.by/api/exrates/rates/${currency}?parammode=2&ondate=${yesterdayStr}`
      );

      const yesterdayRate = yesterdayRes.data?.Cur_OfficialRate;
      if (yesterdayRate) {
        change = currentRate - yesterdayRate;
        changePercent = (change / yesterdayRate) * 100;
        trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
      }
    } catch (yesterdayError) {
      // Если не удалось получить вчерашний курс, продолжаем без сравнения
      console.log(`Не удалось получить вчерашний курс для ${currency}:`, yesterdayError);
    }

    return {
      rate: currentRate,
      scale,
      date,
      currency,
      change,
      changePercent,
      trend
    };
  } catch (error) {
    console.error("Ошибка при получении расширенного курса НБРБ:", error);
    return null;
  }
}
