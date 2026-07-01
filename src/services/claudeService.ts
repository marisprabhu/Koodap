import axios from 'axios';
import { Transcript } from '../types';

// Ollama runs locally — free, no API key needed.
// Install: https://ollama.com  →  then run: ollama pull llama3
const OLLAMA_URL = process.env.EXPO_PUBLIC_OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3.2';

export interface DailySummary {
  narrative: string;
  highlights: string[];
  emotionArc: string;
  recommendations: Recommendation[];
}

export interface Recommendation {
  category: 'physical' | 'mental' | 'productivity';
  text: string;
}

class ClaudeService {
  private async chat(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await axios.post<{ message: { content: string } }>(
      `${OLLAMA_URL}/api/chat`,
      {
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      },
      { timeout: 300_000 } // local LLM on CPU can be slow
    );

    return response.data.message.content;
  }

  async generateDailySummary(transcripts: Transcript[], date: Date): Promise<DailySummary> {
    const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    const combinedText = transcripts
      .map((t) => {
        const time = new Date(t.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const loc = t.locationLabel ? ` [${t.locationLabel}]` : '';
        const speaker = t.speakerLabel ? ` (${t.speakerLabel})` : '';
        return `[${time}${loc}${speaker}] ${t.text}`;
      })
      .join('\n');

    const systemPrompt = `You are LifeLog AI — a personal daily debrief assistant.
You receive timestamped transcripts from the user's day and produce a structured JSON summary.
Be warm, concise, and insightful. Infer context from what was said (meetings, exercise, meals, social interactions).
Detect emotional tone from language patterns.
IMPORTANT: Respond with valid JSON only. No markdown, no explanation, no code fences. Raw JSON only.`;

    const userMessage = `Here are my transcripts for ${dateStr}:

${combinedText || 'No transcripts recorded today.'}

Respond with this exact JSON structure:
{
  "narrative": "2-3 sentence friendly summary of the day",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "emotionArc": "e.g. Focused → Stressed → Calm",
  "recommendations": [
    { "category": "physical", "text": "recommendation" },
    { "category": "mental", "text": "recommendation" },
    { "category": "productivity", "text": "recommendation" }
  ]
}`;

    const raw = await this.chat(systemPrompt, userMessage);

    // Strip any accidental markdown fences Ollama sometimes adds
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as DailySummary;
  }
}

export const claudeService = new ClaudeService();
