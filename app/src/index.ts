import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { resultsRoutes } from "./routes/results";
import { imagesRoutes } from "./routes/images";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .use(cors())
  // Health & info endpoints
  .get("/", () => ({ message: "Welcome to SheetLeader API" }))
  .get("/api/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString()
  }))
  // Mount route modules
  .use(resultsRoutes)
  .use(imagesRoutes)
  .listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
