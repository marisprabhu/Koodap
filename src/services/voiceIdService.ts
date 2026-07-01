import axios from 'axios';
import { databaseService } from './databaseService';

// Voice ID runs on a local Python microservice (see /voice-server/README.md).
// It wraps Resemblyzer to produce 256-d speaker embeddings.
// Default: http://localhost:8000 (run `uvicorn main:app` on your machine / same Wi-Fi).
const VOICE_SERVER = process.env.EXPO_PUBLIC_VOICE_SERVER_URL ?? 'http://localhost:8000';
const MATCH_THRESHOLD = 0.82; // cosine similarity — tune upward if you get false positives

export interface SpeakerMatch {
  label: string;
  similarity: number;
}

class VoiceIdService {
  // ── Enrollment ────────────────────────────────────────────────────────────
  // Record 10–30 seconds of clean speech, then call this.
  async enroll(audioUri: string, label: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', { uri: audioUri, name: 'enroll.m4a', type: 'audio/m4a' } as any);
    formData.append('label', label);

    const response = await axios.post<{ embedding: number[] }>(
      `${VOICE_SERVER}/enroll`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 20_000 }
    );

    await databaseService.saveVoiceProfile(
      `vp-${label}-${Date.now()}`,
      label,
      response.data.embedding
    );
  }

  // ── Identification ────────────────────────────────────────────────────────
  // Pass the audio segment URI; returns best label or null if no match above threshold.
  async identify(audioUri: string): Promise<string | null> {
    const profiles = await databaseService.getAllVoiceProfiles();
    if (profiles.length === 0) return null;

    const formData = new FormData();
    formData.append('file', { uri: audioUri, name: 'segment.m4a', type: 'audio/m4a' } as any);

    const response = await axios.post<{ embedding: number[] }>(
      `${VOICE_SERVER}/embed`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 15_000 }
    );

    const queryEmbedding = response.data.embedding;
    const best = this.findBestMatch(queryEmbedding, profiles);
    return best && best.similarity >= MATCH_THRESHOLD ? best.label : null;
  }

  private findBestMatch(
    query: number[],
    profiles: { label: string; embedding: number[] }[]
  ): SpeakerMatch | null {
    let best: SpeakerMatch | null = null;
    for (const p of profiles) {
      const sim = this.cosineSimilarity(query, p.embedding);
      if (!best || sim > best.similarity) best = { label: p.label, similarity: sim };
    }
    return best;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot   += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }
}

export const voiceIdService = new VoiceIdService();
