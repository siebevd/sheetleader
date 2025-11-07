import { Elysia } from "elysia";
import { db, results } from "../db";
import { desc, eq, sql, isNotNull } from "drizzle-orm";

export const resultsRoutes = new Elysia({ prefix: "/api" })
  // Get all results
  .get("/results", async () => {
    try {
      const allResults = await db.select().from(results).orderBy(desc(results.timestamp));
      return { results: allResults };
    } catch (error) {
      return { results: [], error: "Failed to fetch results" };
    }
  })
  // Get recent results (last 20 with horsepower) with comparisons
  .get("/results/recent", async () => {
    try {
      const recentResults = await db.select().from(results)
        .where(isNotNull(results.horsepower))
        .orderBy(desc(results.timestamp))
        .limit(20);

      // For each result, get comparisons with same tractor model from ALL results
      const resultsWithComparisons = await Promise.all(
        recentResults.map(async (result) => {
          const sameTractorResults = await db.select().from(results)
            .where(eq(results.tractor, result.tractor))
            .orderBy(desc(results.horsepower))
            .limit(5);

          return {
            ...result,
            comparisons: sameTractorResults
          };
        })
      );

      return { results: resultsWithComparisons };
    } catch (error) {
      return { results: [], error: "Failed to fetch recent results" };
    }
  })
  // Get results by tractor model
  .get("/results/tractor/:model", async ({ params }) => {
    try {
      const tractorResults = await db.select().from(results)
        .where(eq(results.tractor, params.model))
        .orderBy(desc(results.horsepower));
      return { results: tractorResults };
    } catch (error) {
      return { results: [], error: "Failed to fetch tractor results" };
    }
  })
  // Search results
  .get("/results/search", async ({ query }: { query: { q?: string } }) => {
    try {
      if (!query.q) {
        return { results: [] };
      }
      const searchResults = await db.select().from(results)
        .where(
          sql`${results.name} LIKE ${`%${query.q}%`} OR ${results.tractor} LIKE ${`%${query.q}%`}`
        )
        .orderBy(desc(results.timestamp));
      return { results: searchResults };
    } catch (error) {
      return { results: [], error: "Failed to search results" };
    }
  })
  // Get stats
  .get("/stats", async () => {
    try {
      const totalCount = await db.select({ count: sql<number>`count(*)` }).from(results).where(isNotNull(results.horsepower));
      const avgHP = await db.select({ avg: sql<number>`avg(horsepower)` }).from(results).where(isNotNull(results.horsepower));
      const maxHP = await db.select({ max: sql<number>`max(horsepower)` }).from(results).where(isNotNull(results.horsepower));

      // Get most popular tractor model
      const popularModel = await db.select({
        tractor: results.tractor,
        count: sql<number>`count(*) as count`
      })
        .from(results)
        .groupBy(results.tractor)
        .orderBy(desc(sql`count`))
        .limit(1);

      return {
        total: totalCount[0]?.count || 0,
        averageHorsepower: Math.round(avgHP[0]?.avg || 0),
        maxHorsepower: maxHP[0]?.max || 0,
        mostPopularModel: popularModel[0] || null,
      };
    } catch (error) {
      return { error: "Failed to fetch stats" };
    }
  });
