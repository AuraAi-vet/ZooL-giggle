import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/breed-database", async (req, res) => {
    try {
      const fs = await import("fs");
      const possiblePaths = [
        path.join(process.cwd(), "src", "breed-database.json"),
        path.join(process.cwd(), "breed-database.json"),
        path.join(process.cwd(), "dist", "breed-database.json")
      ];
      let data = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          data = fs.readFileSync(p, "utf-8");
          break;
        }
      }
      if (data) {
        res.json(JSON.parse(data));
      } else {
        // Safe static fallback from guaranteed relative files
        const guaranteedPath = path.join(process.cwd(), "src", "breed-database.json");
        if (fs.existsSync(guaranteedPath)) {
          res.json(JSON.parse(fs.readFileSync(guaranteedPath, "utf-8")));
        } else {
          res.status(404).json({ error: "Breed database JSON not found on system paths" });
        }
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load breed database" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
