import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tractor: text("tractor").notNull(),
  horsepower: integer("horsepower"),
  timestamp: integer("timestamp", { mode: "timestamp" }),
  sheetRowId: text("sheet_row_id"), // Track Google Sheets row ID for sync
});

export const syncLogs = sqliteTable("sync_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  status: text("status").notNull(), // 'success', 'error', 'warning'
  message: text("message").notNull(),
  recordsAdded: integer("records_added"),
  recordsUpdated: integer("records_updated"),
  recordsDeleted: integer("records_deleted"),
  errorDetails: text("error_details"),
});

export type Result = typeof results.$inferSelect;
export type NewResult = typeof results.$inferInsert;
export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;
