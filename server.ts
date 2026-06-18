import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import Stripe from "stripe";
import pg from "pg";

let stripeClient: Stripe | null = null;
let pgPool: pg.Pool | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

function getPgPool(): pg.Pool {
  if (!pgPool) {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error("POSTGRES_URL environment variable is required for production DB operations");
    }
    pgPool = new pg.Pool({ connectionString });
  }
  return pgPool;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", async (req, res) => {
    let dbStatus = "disconnected";
    try {
      if (process.env.POSTGRES_URL) {
        const result = await getPgPool().query("SELECT 1 AS status");
        if (result.rows.length > 0) dbStatus = "connected";
      }
    } catch (e) {
      dbStatus = "error";
    }
    res.json({ status: "ok", db: dbStatus });
  });

  // Strict AGENT.md Mandate: Stripe Payments Paused (Trial Launch Phase)
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { origin } = req.body;
      
      // LOGIC: As per AGENTS.md, payments are paused. 
      // Skip Stripe SDK usage and return a complimentary premium trial bypass.
      res.json({ 
        url: `${origin}?success=true&type=booking&trial=true`,
        message: "🎁 ZooL Trial Mode Active: Complimentary Premium Trial Instantiated." 
      });
      
    } catch (error: any) {
      console.error("Stripe Session Creation Failed:", error);
      res.status(500).json({ error: error.message || "Failed to initiate Stripe payment checkout session" });
    }
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
