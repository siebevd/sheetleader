import { Elysia } from "elysia";
import { readdir } from "fs/promises";
import { join } from "path";

const IMAGES_DIR = join(import.meta.dir, "../../images");

export const imagesRoutes = new Elysia({ prefix: "/api" })
  // Get list of all images
  .get("/images", async () => {
    try {
      const files = await readdir(IMAGES_DIR);
      const imageFiles = files.filter(file =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      );
      return { images: imageFiles };
    } catch (error) {
      return { images: [], error: "Failed to read images directory" };
    }
  })
  // Serve individual image
  .get("/images/:filename", async ({ params }) => {
    try {
      const filePath = join(IMAGES_DIR, params.filename);
      const file = Bun.file(filePath);

      if (!(await file.exists())) {
        return new Response("Image not found", { status: 404 });
      }

      return new Response(file);
    } catch (error) {
      return new Response("Error loading image", { status: 500 });
    }
  });
