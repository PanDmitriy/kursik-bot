import { PrismaClient } from "@prisma/client";

// Создаем экземпляр Prisma Client
const prisma = new PrismaClient();

// В development режиме логируем запросы
if (process.env.NODE_ENV !== "production") {
  prisma.$on("query" as never, (e: any) => {
    console.log("Query: " + e.query);
    console.log("Params: " + e.params);
    console.log("Duration: " + e.duration + "ms");
  });
}

// Graceful shutdown - закрываем соединение при выходе
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
