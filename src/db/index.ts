import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

export const sqlite = new Database(process.env.DB_FILE_NAME);
export const db = drizzle({ client: sqlite });
migrate(db, { migrationsFolder: "./drizzle" });
