import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { resultsRoutes } from "./routes/results";
import { imagesRoutes } from "./routes/images";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "SheetLeader API",
          version: "1.0.0",
          description: "API for managing sheet results and images"
        },
        tags: [
          { name: "Health", description: "Health check endpoints" },
          { name: "Results", description: "Results management endpoints" },
          { name: "Images", description: "Image management endpoints" }
        ]
      }
    })
  )
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
