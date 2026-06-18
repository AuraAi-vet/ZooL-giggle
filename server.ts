import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import OpenAI from 'openai';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

  // 1. Secure HTTP Headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    frameguard: false
  }));

  // 2. Strict CORS
  const allowedOrigins = [
    'https://zool-care-frontend.vercel.app', 
    'http://localhost:3000',
    'https://ais-dev-slkejamycqwtyqhfeaqkt7-787850738550.asia-east1.run.app',
    'https://ais-pre-slkejamycqwtyqhfeaqkt7-787850738550.asia-east1.run.app'
  ];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS'));
      }
    },
    credentials: true
  }));

  app.use(express.json());

  // 3. Strict Rate Limiting for AI endpoints
  const aiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 30,
    message: { error: 'Too many requests, please try again later.' }
  });

  app.use('/api/concierge/', aiRateLimiter);
  app.use('/api/gemini/', aiRateLimiter);

  // Gemini API Route
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, userRole } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      let systemInstruction = "You are Gema, an advanced assistant.";
      if (userRole === 'role_owner_01') {
        systemInstruction = "You are Gema, an advanced assistant for pet owners focusing on seamless booking, clinical visibility, and AI-assisted care.";
      } else if (userRole === 'role_vet_02') {
        systemInstruction = "You are Gema, an advanced assistant for veterinarians focusing on rapid diagnostic access, charting efficiency, and patient queue management.";
      } else if (userRole === 'role_admin_03') {
        systemInstruction = "You are Gema, an advanced assistant for clinic administrators focusing on operations overview, schedule management, and map/visibility control.";
      } else if (userRole === 'role_service_04') {
        systemInstruction = "You are Gema, an advanced assistant for service providers focusing on service scheduling, behavioral logs, and client communications (without exposing protected clinical data).";
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const result = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: message,
        config: {
          systemInstruction,
        },
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        res.write(chunkText);
      }
      res.end();
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate response" });
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

  // Logs API Route
  app.post('/api/logs', (req, res) => {
    const { message, context, timestamp } = req.body;
    console.error(`[Frontend Error] [${timestamp}] ${message}`, context);
    res.status(200).json({ status: 'logged' });
  });

  // Concierge API Route
  app.post("/api/concierge/chat", async (req, res) => {
    try {
      const { message } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: {
          systemInstruction: "You are Gema, the ZooL Clinical Concierge. The active patient is Aura, a Samoyed. The preferred clinic is Downtown Wellness Vet. Be brief, reassuring, and always offer the next logical action. If relevant, suggest booking an appointment.",
        },
      });

      res.json({ response: result.text });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Clinical Summarization Route
  app.post("/api/gemini/summarize", async (req, res) => {
    try {
      const { rawNotes, patientContext } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Please structure and format the following clinical shorthand into a professional SOAP note for patient ${patientContext?.petName} (${patientContext?.petType}). Be concise. \n\nShorthand: ${rawNotes}`,
        config: {
          systemInstruction: "You are an expert veterinary clinical assistant. Return strictly the formatted clinical SOAP note. Use standard markdown. Maintain a professional tone.",
        },
      });

      res.json({ response: result.text });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // Timeline Synthesis Route
  app.post("/api/gemini/timeline-synthesis", async (req, res) => {
    try {
      const { events } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze these recent health events and provide a short, reassuring 2-sentence health summary for the pet owner. Focus on the positive trends or next steps.\n\nEvents: ${JSON.stringify(events)}`,
        config: {
          systemInstruction: "You are an AI veterinary assistant generating a health snapshot for a pet parent. Be extremely concise, warm, and professional.",
        },
      });

      res.json({ response: result.text });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate timeline synthesis" });
    }
  });

  // Client Update Suggestion Route
  app.post("/api/gemini/suggest-update", async (req, res) => {
    try {
      const { taskSummary, petName } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Write a short, fun, 1-sentence text message update for the pet owner of ${petName} based on this recent service log: "${taskSummary}".`,
        config: {
          systemInstruction: "You are a friendly grooming/boarding staff member texting a pet owner. Be super concise, upbeat and use ONE emoji.",
        },
      });

      res.json({ response: result.text });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate suggestion" });
    }
  });

  // Code Generation Route (OpenAI Codex API proxy)
  app.post("/api/openai/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is required");
      }

      // Defaulting to gpt-3.5-turbo / gpt-4o as Codex models are deprecated
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are an expert coding assistant. Provide code based on the user request. Only output code or brief explanations." }, { role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
      });

      res.json({ response: completion.choices[0].message.content });
      
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate code" });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
