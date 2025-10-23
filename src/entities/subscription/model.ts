export interface Subscription {
  id?: number;
  chatId: number;
  currency: string;
  hour: number;
  minute: number;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  chatId: number;
  timezone: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}
