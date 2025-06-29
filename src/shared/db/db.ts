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

export default db;
