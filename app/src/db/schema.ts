import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tractor: text("tractor").notNull(),
  horsepower: integer("horsepower"),
  timestamp: integer("timestamp", { mode: "timestamp" }),
});

export type Result = typeof results.$inferSelect;
export type NewResult = typeof results.$inferInsert;
