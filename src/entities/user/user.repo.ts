import prisma from "../../shared/db/db";

export interface Subscription {
  currency: string;
  hour: number;
  minute: number;
  timezone: string;
}

export async function addSubscription(
  chatId: number,
  currency: string,
  hour: number,
  minute: number,
  timezone = "Europe/Minsk"
) {
  await prisma.subscription.upsert({
    where: {
      chatId_currency_hour_minute: {
        chatId,
        currency,
        hour,
        minute,
      },
    },
    update: {
      timezone,
    },
    create: {
      chatId,
      currency,
      hour,
      minute,
      timezone,
    },
  });
}

export async function getUserSubscriptions(chatId: number): Promise<Subscription[]> {
  const subscriptions = await prisma.subscription.findMany({
    where: { chatId },
    select: {
      currency: true,
      hour: true,
      minute: true,
      timezone: true,
    },
  });

  return subscriptions;
}

export async function removeSubscription(
  chatId: number,
  currency: string,
  hour?: number,
  minute?: number
): Promise<boolean> {
  if (hour !== undefined && minute !== undefined) {
    // Удаляем подписку с конкретным временем
    const result = await prisma.subscription.deleteMany({
      where: {
        chatId,
        currency,
        hour,
        minute,
      },
    });
    return result.count > 0;
  } else {
    // Удаляем все подписки на эту валюту (обратная совместимость)
    const result = await prisma.subscription.deleteMany({
      where: {
        chatId,
        currency,
      },
    });
    return result.count > 0;
  }
}

export async function getAllChatIds(): Promise<number[]> {
  const subscriptions = await prisma.subscription.findMany({
    select: {
      chatId: true,
    },
    distinct: ["chatId"],
  });

  return subscriptions.map((s) => s.chatId);
}

export async function getUserTimezone(chatId: number): Promise<string> {
  const subscription = await prisma.subscription.findFirst({
    where: { chatId },
    select: {
      timezone: true,
    },
  });

  return subscription?.timezone || "Europe/Minsk";
}

export async function setUserTimezone(chatId: number, timezone: string) {
  await prisma.subscription.updateMany({
    where: { chatId },
    data: { timezone },
  });
}
