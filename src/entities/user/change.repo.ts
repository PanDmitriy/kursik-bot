import prisma from "../../shared/db/db";

export async function addChangeSubscription(chatId: number, currency: string): Promise<void> {
  await prisma.changeSubscription.upsert({
    where: {
      chatId_currency: {
        chatId,
        currency,
      },
    },
    update: {},
    create: {
      chatId,
      currency,
    },
  });
}

export async function removeChangeSubscription(chatId: number, currency: string): Promise<void> {
  await prisma.changeSubscription.deleteMany({
    where: {
      chatId,
      currency,
    },
  });
}

export async function listChangeSubscriptions(chatId: number): Promise<string[]> {
  const subscriptions = await prisma.changeSubscription.findMany({
    where: { chatId },
    select: {
      currency: true,
    },
  });

  return subscriptions.map((s) => s.currency);
}

export async function getChangeSubscribersByCurrency(currency: string): Promise<number[]> {
  const subscriptions = await prisma.changeSubscription.findMany({
    where: { currency },
    select: {
      chatId: true,
    },
  });

  return subscriptions.map((s) => s.chatId);
}

export async function getDistinctChangeCurrencies(): Promise<string[]> {
  const subscriptions = await prisma.changeSubscription.findMany({
    select: {
      currency: true,
    },
    distinct: ["currency"],
  });

  return subscriptions.map((s) => s.currency);
}

export async function getLastRate(
  currency: string
): Promise<{ rate: number; scale: number } | null> {
  const lastRate = await prisma.lastRate.findUnique({
    where: { currency },
    select: {
      rate: true,
      scale: true,
    },
  });

  return lastRate;
}

export async function setLastRate(currency: string, rate: number, scale: number): Promise<void> {
  await prisma.lastRate.upsert({
    where: { currency },
    update: {
      rate,
      scale,
      updatedAt: new Date(),
    },
    create: {
      currency,
      rate,
      scale,
    },
  });
}
