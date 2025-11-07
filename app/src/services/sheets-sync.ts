import { google } from "googleapis";
import { db, results, syncLogs } from "../db";
import { eq, notInArray } from "drizzle-orm";

// Google Sheets configuration from environment variables
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

interface SheetRow {
  rowId: string; // Row number as string
  naam: string;
  tractor: string;
  score: string | null;
}

async function getSheets() {
  if (!CREDENTIALS) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not configured");
  }

  if (!SHEET_ID) {
    throw new Error("GOOGLE_SHEET_ID not configured");
  }

  const credentials = JSON.parse(CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, sheetId: SHEET_ID };
}

async function fetchSheetData(): Promise<SheetRow[]> {
  const { sheets, sheetId } = await getSheets();

  // Fetch data from the first sheet, starting from row 2 (skip header)
  // Using A2:C range without sheet name will default to the first sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A2:C", // Columns: Naam, Tractor, Score (defaults to first sheet)
  });

  const rows = response.data.values || [];

  return rows.map((row, index) => ({
    rowId: String(index + 2), // Row number in sheet (starting from 2)
    naam: row[0] || "",
    tractor: row[1] || "",
    score: row[2] || null,
  })).filter(row => row.naam && row.tractor); // Only include rows with naam and tractor
}

export async function syncWithGoogleSheets() {
  const startTime = new Date();
  let recordsAdded = 0;
  let recordsUpdated = 0;
  let recordsDeleted = 0;
  const changeDetails: string[] = [];

  try {
    console.log("Starting Google Sheets sync...");

    // Fetch data from Google Sheets
    const sheetData = await fetchSheetData();
    console.log(`Fetched ${sheetData.length} rows from Google Sheets`);

    // Get all existing results with sheet row IDs
    const existingResults = await db.select().from(results);
    const existingByRowId = new Map(
      existingResults
        .filter(r => r.sheetRowId)
        .map(r => [r.sheetRowId!, r])
    );

    // Track which sheet row IDs exist in the sheet
    const sheetRowIds = new Set(sheetData.map(row => row.rowId));

    // Process each row from the sheet
    for (const sheetRow of sheetData) {
      const existing = existingByRowId.get(sheetRow.rowId);

      // Parse score, handling empty/invalid values as null
      const parsedScore = sheetRow.score ? parseInt(sheetRow.score, 10) : NaN;
      const horsepower = !isNaN(parsedScore) ? parsedScore : null;

      if (!existing) {
        // New record - add it
        // Set timestamp only if there's a score
        const timestamp = horsepower !== null ? new Date() : null;

        await db.insert(results).values({
          name: sheetRow.naam,
          tractor: sheetRow.tractor,
          horsepower,
          timestamp,
          sheetRowId: sheetRow.rowId,
        });
        recordsAdded++;

        const scoreText = horsepower !== null ? ` with score ${horsepower}` : " (no score yet)";
        changeDetails.push(`➕ Added: ${sheetRow.naam} - ${sheetRow.tractor}${scoreText}`);
      } else {
        // Check if update is needed
        const nameChanged = existing.name !== sheetRow.naam;
        const tractorChanged = existing.tractor !== sheetRow.tractor;
        const scoreChanged = existing.horsepower !== horsepower;

        // Set timestamp logic:
        // - If score changed from null to a value, set timestamp to now
        // - If score changed from a value to another value, update timestamp
        // - If score changed to null, clear timestamp
        let newTimestamp = existing.timestamp;
        if (scoreChanged) {
          if (horsepower !== null) {
            // Score was added or changed - set timestamp to now
            newTimestamp = new Date();
          } else {
            // Score was removed - clear timestamp
            newTimestamp = null;
          }
        }

        const needsUpdate = nameChanged || tractorChanged || scoreChanged;

        if (needsUpdate) {
          await db
            .update(results)
            .set({
              name: sheetRow.naam,
              tractor: sheetRow.tractor,
              horsepower,
              timestamp: newTimestamp,
            })
            .where(eq(results.id, existing.id));
          recordsUpdated++;

          // Build detailed change message
          const changes: string[] = [];
          if (nameChanged) changes.push(`name: "${existing.name}" → "${sheetRow.naam}"`);
          if (tractorChanged) changes.push(`tractor: "${existing.tractor}" → "${sheetRow.tractor}"`);
          if (scoreChanged) {
            const oldScore = existing.horsepower ?? "none";
            const newScore = horsepower ?? "none";
            changes.push(`score: ${oldScore} → ${newScore}`);
          }
          changeDetails.push(`✏️ Updated: ${sheetRow.naam} (${changes.join(", ")})`);
        }
      }
    }

    // Delete records that no longer exist in the sheet
    const recordsToDelete = existingResults
      .filter(r => r.sheetRowId && !sheetRowIds.has(r.sheetRowId));

    if (recordsToDelete.length > 0) {
      // Log deletions
      for (const record of recordsToDelete) {
        changeDetails.push(`🗑️ Deleted: ${record.name} - ${record.tractor}`);
      }

      const rowIdsToDelete = recordsToDelete.map(r => r.id);
      await db.delete(results).where(notInArray(results.id, rowIdsToDelete));
      recordsDeleted = rowIdsToDelete.length;
    }

    // Log success
    const message = `Sync completed: ${recordsAdded} added, ${recordsUpdated} updated, ${recordsDeleted} deleted`;
    console.log(message);
    if (changeDetails.length > 0) {
      console.log("Changes:\n" + changeDetails.join("\n"));
    }

    await db.insert(syncLogs).values({
      timestamp: startTime,
      status: "success",
      message,
      recordsAdded,
      recordsUpdated,
      recordsDeleted,
      errorDetails: changeDetails.length > 0 ? changeDetails.join("\n") : null,
    });

    return { success: true, recordsAdded, recordsUpdated, recordsDeleted };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync error:", errorMessage);

    await db.insert(syncLogs).values({
      timestamp: startTime,
      status: "error",
      message: "Sync failed",
      recordsAdded,
      recordsUpdated,
      recordsDeleted,
      errorDetails: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Function to start periodic sync (every 30 seconds)
export function startPeriodicSync() {
  console.log("Starting periodic Google Sheets sync (every 30 seconds)...");

  // Run immediately
  syncWithGoogleSheets();

  // Then run every 30 seconds
  setInterval(() => {
    syncWithGoogleSheets();
  }, 30000);
}
