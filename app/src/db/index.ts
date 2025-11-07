import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { results } from "./schema";
import { join } from "path";

const dbPath = join(import.meta.dir, "../../data/sheetleader.db");
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);

export { results };
