export interface TimezoneInfo {
  id: string;
  name: string;
  region: string;
  city: string;
  offset: string;
  displayName: string;
}

export class TimezoneService {
  private static readonly TIMEZONE_GROUPS = {
    'Европа': [
      'Europe/Moscow',
      'Europe/Minsk', 
      'Europe/Kiev',
      'Europe/Vilnius',
      'Europe/Riga',
      'Europe/Tallinn',
      'Europe/Warsaw',
      'Europe/Prague',
      'Europe/Budapest',
      'Europe/Bucharest',
      'Europe/Sofia',
      'Europe/Athens',
      'Europe/Istanbul',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Rome',
      'Europe/Madrid',
      'Europe/Amsterdam',
      'Europe/Stockholm',
      'Europe/Oslo',
      'Europe/Copenhagen',
      'Europe/Helsinki'
    ],
    'Азия': [
      'Asia/Almaty',
      'Asia/Tashkent',
      'Asia/Baku',
      'Asia/Yerevan',
      'Asia/Tbilisi',
      'Asia/Tehran',
      'Asia/Dubai',
      'Asia/Karachi',
      'Asia/Kolkata',
      'Asia/Dhaka',
      'Asia/Bangkok',
      'Asia/Jakarta',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Asia/Hong_Kong',
      'Asia/Singapore'
    ],
    'Америка': [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'America/Vancouver',
      'America/Sao_Paulo',
      'America/Buenos_Aires',
      'America/Mexico_City'
    ],
    'Африка': [
      'Africa/Cairo',
      'Africa/Johannesburg',
      'Africa/Lagos',
      'Africa/Casablanca'
    ],
    'Австралия и Океания': [
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Perth',
      'Pacific/Auckland',
      'Pacific/Fiji'
    ]
  };

  private static readonly TIMEZONE_NAMES: Record<string, string> = {
    'Europe/Moscow': 'Москва',
    'Europe/Minsk': 'Минск',
    'Europe/Kiev': 'Киев',
    'Europe/Vilnius': 'Вильнюс',
    'Europe/Riga': 'Рига',
    'Europe/Tallinn': 'Таллин',
    'Europe/Warsaw': 'Варшава',
    'Europe/Prague': 'Прага',
    'Europe/Budapest': 'Будапешт',
    'Europe/Bucharest': 'Бухарест',
    'Europe/Sofia': 'София',
    'Europe/Athens': 'Афины',
    'Europe/Istanbul': 'Стамбул',
    'Europe/London': 'Лондон',
    'Europe/Paris': 'Париж',
    'Europe/Berlin': 'Берлин',
    'Europe/Rome': 'Рим',
    'Europe/Madrid': 'Мадрид',
    'Europe/Amsterdam': 'Амстердам',
    'Europe/Stockholm': 'Стокгольм',
    'Europe/Oslo': 'Осло',
    'Europe/Copenhagen': 'Копенгаген',
    'Europe/Helsinki': 'Хельсинки',
    'Asia/Almaty': 'Алматы',
    'Asia/Tashkent': 'Ташкент',
    'Asia/Baku': 'Баку',
    'Asia/Yerevan': 'Ереван',
    'Asia/Tbilisi': 'Тбилиси',
    'Asia/Tehran': 'Тегеран',
    'Asia/Dubai': 'Дубай',
    'Asia/Karachi': 'Карачи',
    'Asia/Kolkata': 'Калькутта',
    'Asia/Dhaka': 'Дакка',
    'Asia/Bangkok': 'Бангкок',
    'Asia/Jakarta': 'Джакарта',
    'Asia/Shanghai': 'Шанхай',
    'Asia/Tokyo': 'Токио',
    'Asia/Seoul': 'Сеул',
    'Asia/Hong_Kong': 'Гонконг',
    'Asia/Singapore': 'Сингапур',
    'America/New_York': 'Нью-Йорк',
    'America/Chicago': 'Чикаго',
    'America/Denver': 'Денвер',
    'America/Los_Angeles': 'Лос-Анджелес',
    'America/Toronto': 'Торонто',
    'America/Vancouver': 'Ванкувер',
    'America/Sao_Paulo': 'Сан-Паулу',
    'America/Buenos_Aires': 'Буэнос-Айрес',
    'America/Mexico_City': 'Мехико',
    'Africa/Cairo': 'Каир',
    'Africa/Johannesburg': 'Йоханнесбург',
    'Africa/Lagos': 'Лагос',
    'Africa/Casablanca': 'Касабланка',
    'Australia/Sydney': 'Сидней',
    'Australia/Melbourne': 'Мельбурн',
    'Australia/Perth': 'Перт',
    'Pacific/Auckland': 'Окленд',
    'Pacific/Fiji': 'Фиджи'
  };

  /**
   * Получить все доступные часовые пояса, сгруппированные по регионам
   */
  static getTimezoneGroups(): Record<string, string[]> {
    return this.TIMEZONE_GROUPS;
  }

  /**
   * Получить информацию о часовом поясе
   */
  static getTimezoneInfo(timezone: string): TimezoneInfo | null {
    if (!this.isValidTimezone(timezone)) {
      return null;
    }

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('ru', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });

    const parts = formatter.formatToParts(now);
    const offset = parts.find((part: any) => part.type === 'timeZoneName')?.value || '';

    const region = this.getRegionForTimezone(timezone);
    const city = this.TIMEZONE_NAMES[timezone] || timezone.split('/')[1]?.replace('_', ' ');
    const displayName = `${city} (${offset})`;

    return {
      id: timezone,
      name: city,
      region,
      city,
      offset,
      displayName
    };
  }

  /**
   * Проверить валидность часового пояса
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Получить регион для часового пояса
   */
  private static getRegionForTimezone(timezone: string): string {
    for (const [region, zones] of Object.entries(this.TIMEZONE_GROUPS)) {
      if (zones.includes(timezone)) {
        return region;
      }
    }
    return 'Другие';
  }

  /**
   * Найти часовые пояса по поисковому запросу
   */
  static searchTimezones(query: string): TimezoneInfo[] {
    const results: TimezoneInfo[] = [];
    const searchQuery = query.toLowerCase();

    for (const zones of Object.values(this.TIMEZONE_GROUPS)) {
      for (const timezone of zones) {
        const info = this.getTimezoneInfo(timezone);
        if (info && (
          info.city.toLowerCase().includes(searchQuery) ||
          info.id.toLowerCase().includes(searchQuery) ||
          info.region.toLowerCase().includes(searchQuery)
        )) {
          results.push(info);
        }
      }
    }

    return results.slice(0, 10); // Ограничиваем результаты
  }

  /**
   * Получить популярные часовые пояса для быстрого выбора
   */
  static getPopularTimezones(): TimezoneInfo[] {
    const popularIds = [
      'Europe/Moscow',
      'Europe/Minsk',
      'Europe/Kiev',
      'Europe/Vilnius',
      'Asia/Almaty',
      'Europe/London',
      'Europe/Paris',
      'America/New_York',
      'Asia/Tokyo',
      'Australia/Sydney'
    ];

    return popularIds
      .map(id => this.getTimezoneInfo(id))
      .filter((info): info is TimezoneInfo => info !== null);
  }

  /**
   * Получить текущее время в указанном часовом поясе
   */
  static getCurrentTimeInTimezone(timezone: string): string {
    if (!this.isValidTimezone(timezone)) {
      return 'Неверный часовой пояс';
    }

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('ru', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return formatter.format(now);
  }
}
