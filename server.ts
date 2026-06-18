import express from "express";
import path from "path";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import OpenAI from 'openai';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = process.env.PORT || 3000;

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
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction,
        },
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) res.write(chunkText);
      }
      res.end();
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // AI Insights Route
  app.post("/api/gemini/health-insights", async (req, res) => {
    try {
      const { petData } = req.body;
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

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the health and wellness data for ${petData.name}, a ${petData.age}-year-old ${petData.breed}. 
        Provide a daily summary, check-in recommendations (vet or care practices), and well-being tips. 
        Recent Context: ${JSON.stringify(petData.context || "No specific recent events")}`,
        config: {
          systemInstruction: "You are a proactive veterinary wellness AI. Provide structured insights for a pet parent. Be encouraging, precise, and prioritize preventive care.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A daily health summary for the pet." },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Specific check-in or care recommendations."
              },
              wellbeingTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "General well-being and preventive tips."
              },
              statusColor: { type: Type.STRING, description: "Suggest a status color: 'emerald', 'amber', or 'rose' based on health outlook." }
            },
            required: ["summary", "recommendations", "wellbeingTips", "statusColor"]
          }
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text from Gemini");
      }

      // Handle potential markdown JSON wrapping
      const jsonContent = text.replace(/```json\n?|\n?```/g, '').trim();
      res.json(JSON.parse(jsonContent));
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate health insights" });
    }
  });

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === "production" || process.env.VITE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
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
        model: "gemini-3.5-flash",
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
        model: "gemini-3.5-flash",
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
        model: "gemini-3.5-flash",
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

  // Smart Triage Route
  app.post("/api/gemini/triage", async (req, res) => {
    try {
      const { symptoms, petType } = req.body;
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
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Analyze these symptoms for a ${petType || 'pet'} and determine if it's an emergency or requires a routine appointment. Symptoms: "${symptoms}"`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          systemInstruction: "You are a veterinary triage assistant. You MUST return a JSON object with strictly these keys: 'action' ('emergency' or 'routine'), 'reason' (string explaining why), and 'recommendation' (string with short instructions).",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING, description: "'emergency' or 'routine'" },
              reason: { type: Type.STRING, description: "Brief explanation of the assessment" },
              recommendation: { type: Type.STRING, description: "Actionable next step for the pet owner" }
            },
            required: ["action", "reason", "recommendation"]
          }
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response text from Gemini");

      const jsonContent = text.replace(/```json\n?|\n?```/g, '').trim();
      res.json(JSON.parse(jsonContent));
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process triage request" });
    }
  });

  // ZooL Help Support Route (Simulating Gemma RAG Pipeline)
  app.post("/api/gemini/support", async (req, res) => {
    try {
      const { query, userRole } = req.body;
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
      
      const roleMap: Record<string, string> = {
        'role_owner_01': 'Pet Owner',
        'role_vet_02': 'Clinician',
        'role_admin_03': 'Administrator',
        'role_service_04': 'Service Provider'
      };
      
      const activeRole = roleMap[userRole] || 'User';

      const result = await ai.models.generateContentStream({
        model: "gemini-3.1-pro-preview",
        contents: `User Role: ${activeRole}\nQuestion: ${query}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          systemInstruction: `You are the AuraVet Assistant, powered by Gemini and VetBERT datasets. You provide advanced clinical support and basic veterinary guidelines based on the ingested VetBERT knowledge base, maintaining strict clinical accuracy. Keep your responses conceptually helpful, formatted in markdown. If the user asks clinical questions as an owner, remind them you are an AI and they should consult their vet for proper diagnostics. If the question is about using the platform, explain how to do it based on their role (${activeRole}).`,
        },
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) res.write(chunkText);
      }
      res.end();
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate support response" });
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
        model: "gemini-3.5-flash",
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

  // Code Verification Route (OpenAI Codex API proxy)
  app.post("/api/openai/verify", async (req, res) => {
    try {
      const { snippet } = req.body;
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is required");
      }

      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are an expert static analysis assistant. Review the provided TypeScript/React code and return a JSON object with a 'tests' array. Each test should have a 'name' (string) and 'passed' (boolean). Evaluate for 'AST Syntax Parsing', 'TypeScript Type Safety', 'Runtime Exception Detection', and 'Dependency Resolution'." }, 
          { role: "user", content: snippet }
        ],
        model: "gpt-3.5-turbo",
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0].message.content;
      res.json(JSON.parse(responseText || '{"tests": []}'));
      
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to verify code" });
    }
  });

  // AI Studio Image Generation Route
  app.post("/api/gemini/generate-image", async (req, res) => {
    try {
      const { prompt, resolution, aspectRatio } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const interaction = await ai.interactions.create({
        model: resolution === '4K' ? 'gemini-3-pro-image' : 'gemini-3.1-flash-image',
        input: prompt,
        response_modalities: ['image'],
        generation_config: {
          image_config: { aspect_ratio: aspectRatio, image_size: resolution }
        }
      });
      
      let imageUrl = null;
      for (const step of interaction.steps) {
        if (step.type === 'model_output') {
          const imageContent = step.content?.find(c => c.type === 'image');
          if (imageContent && imageContent.data) {
            imageUrl = `data:${imageContent.mime_type || 'image/png'};base64,${imageContent.data}`;
          }
        }
      }
      res.json({ imageUrl });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate image: " + error.message });
    }
  });

  // AI Studio Analysis Route
  app.post("/api/gemini/analyze", express.json({limit: '50mb'}), async (req, res) => {
    try {
      const { prompt, thinkingLevel, mediaData, mediaType } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      
      const parts: any[] = [];
      if (prompt) parts.push({ text: prompt });
      if (mediaData && mediaType) {
        parts.push({
          inlineData: {
            data: mediaData.split(',')[1] || mediaData,
            mimeType: mediaType
          }
        });
      }

      const interaction = await ai.interactions.create({
        model: "gemini-3.1-pro-preview",
        input: parts as any,
        generation_config: thinkingLevel ? { thinkingConfig: { thinkingLevel: "HIGH" } } as any : undefined,
      });

      res.json({ result: interaction.output_text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to analyze content: " + error.message });
    }
  });

  // AI Studio Video Generation Route
  app.post("/api/gemini/generate-video", express.json({limit: '50mb'}), async (req, res) => {
    try {
      const { prompt, imageBytes, mimeType, aspectRatio, resolution } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      
      let params: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: resolution || '720p',
          aspectRatio: aspectRatio || '16:9'
        }
      };
      
      if (imageBytes) {
        params.image = { imageBytes, mimeType: mimeType || 'image/jpeg' };
      }
      
      let operation = await ai.models.generateVideos(params);
      res.json({ operationName: operation.name });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate video: " + error.message });
    }
  });

  // AI Studio Video Status Route
  app.get("/api/gemini/video-status", async (req, res) => {
    try {
      const operationName = req.query.operationName as string;
      if (!operationName) throw new Error("Operation name is required");
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      
      let operation = await ai.operations.getVideosOperation({ operation: { name: operationName, _fromAPIResponse: (x: any) => x } } as any);
      
      // If completed, operation.response will have generatedVideos
      res.json(operation);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to get video status: " + error.message });
    }
  });

  app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
