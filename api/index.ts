import express from "express";
import { GoogleGenAI } from "@google/genai";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());

// SQLite on Vercel: /tmp is the only writable directory, but it's ephemeral!
// WARNING: Data will be lost on every redeploy or function cold start.
const dbPath = process.env.VERCEL ? "/tmp/confessions.db" : "confessions.db";

const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS confessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function checkToxicity(text: string): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found, skipping toxicity check.");
    return false;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following text for toxicity (hate speech, harassment, explicit content, or extreme profanity). 
      Respond with ONLY 'TOXIC' if it is inappropriate, or 'SAFE' if it is acceptable.
      
      Text: "${text}"`,
    });

    const result = response.text?.trim().toUpperCase();
    return result === "TOXIC";
  } catch (error) {
    console.error("Error checking toxicity:", error);
    return false;
  }
}

// API Routes
app.get("/api/confessions", (req, res) => {
  try {
    const confessions = db.prepare("SELECT * FROM confessions ORDER BY created_at DESC").all();
    res.json(confessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch confessions" });
  }
});

app.post("/api/confessions", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid confession text" });
  }

  const isToxic = await checkToxicity(text);
  if (isToxic) {
    return res.status(400).json({ error: "Content contains inappropriate language." });
  }

  try {
    const info = db.prepare("INSERT INTO confessions (text) VALUES (?)").run(text);
    res.json({ id: info.lastInsertRowid, text });
  } catch (error) {
    res.status(500).json({ error: "Failed to save confession" });
  }
});

// For local development (non-Vercel)
if (!process.env.VERCEL) {
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
