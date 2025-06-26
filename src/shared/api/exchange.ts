import axios from "axios";

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
