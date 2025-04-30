import { sql } from "drizzle-orm";
import { text, sqliteTable, int } from "drizzle-orm/sqlite-core";

export const logTable = sqliteTable("log", {
	id: int("id").primaryKey({ autoIncrement: true }),
	url: text("url").notNull(),
	depth: int("depth").notNull().default(1),
	options: text("options"),
	files: text("files"),
	status: text("status"),
	error: text("error"),
	timestamp: text("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`),
});