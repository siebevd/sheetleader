import { Elysia } from "elysia";
import { db, syncLogs } from "../db";
import { desc } from "drizzle-orm";
import { syncWithGoogleSheets } from "../services/sheets-sync";

export const syncRoutes = new Elysia({ prefix: "/api" })
  // Get sync logs (last 50)
  .get("/sync/logs", async () => {
    try {
      const logs = await db
        .select()
        .from(syncLogs)
        .orderBy(desc(syncLogs.timestamp))
        .limit(50);

      return { logs };
    } catch (error) {
      return { logs: [], error: "Failed to fetch sync logs" };
    }
  })
  // Get latest sync status
  .get("/sync/status", async () => {
    try {
      const latestLog = await db
        .select()
        .from(syncLogs)
        .orderBy(desc(syncLogs.timestamp))
        .limit(1);

      if (latestLog.length === 0) {
        return {
          status: "never_synced",
          message: "No sync has been performed yet",
        };
      }

      const log = latestLog[0];
      return {
        status: log.status,
        lastSync: log.timestamp,
        message: log.message,
        recordsAdded: log.recordsAdded,
        recordsUpdated: log.recordsUpdated,
        recordsDeleted: log.recordsDeleted,
        errorDetails: log.errorDetails,
      };
    } catch (error) {
      return { error: "Failed to fetch sync status" };
    }
  })
  // Trigger manual sync
  .post("/sync/trigger", async () => {
    try {
      const result = await syncWithGoogleSheets();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
