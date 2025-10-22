import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Путь к базе
const db = new Database("data.sqlite");

// Путь к schema.sql
const schemaPath = path.join(__dirname, "schema.sql");

// Загружаем SQL и выполняем
const schema = fs.readFileSync(schemaPath, "utf-8");
db.exec(schema);

// Выполняем миграции
const migrationsPath = path.join(__dirname, "migrations");
if (fs.existsSync(migrationsPath)) {
  const migrationFiles = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  for (const file of migrationFiles) {
    try {
      const migrationPath = path.join(migrationsPath, file);
      const migration = fs.readFileSync(migrationPath, "utf-8");
      db.exec(migration);
      console.log(`✅ Миграция ${file} выполнена`);
    } catch (error) {
      // Игнорируем ошибки типа "column already exists"
      if (error instanceof Error && error.message.includes('duplicate column name')) {
        console.log(`⚠️ Миграция ${file} уже выполнена`);
      } else {
        console.error(`❌ Ошибка в миграции ${file}:`, error);
      }
    }
  }
}

export default db;
