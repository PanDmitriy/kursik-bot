export interface Currency {
  code: string;
  name: string;
  scale: number;
}

export interface ExchangeRate {
  currency: string;
  rate: number;
  scale: number;
  date: string;
}

export interface EnhancedExchangeRate extends ExchangeRate {
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
}

export const AVAILABLE_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'Доллар США', scale: 1 },
  { code: 'EUR', name: 'Евро', scale: 1 },
  { code: 'RUB', name: 'Российский рубль', scale: 100 },
  { code: 'CNY', name: 'Китайский юань', scale: 10 },
  { code: 'PLN', name: 'Польский злотый', scale: 10 }
];
