import { Platform } from 'react-native';
import { DailySummary } from './claudeService';
import { Transcript } from '../types';

const IS_WEB = Platform.OS === 'web';

export interface StoredSummary {
  id: string;
  dateKey: string;
  generatedAt: number;
  narrative: string;
  highlights: string;
  emotionArc: string;
  recommendations: string;
}

// ── In-memory store for web (data lost on refresh, fine for testing) ──
const memStore = {
  transcripts: [] as Transcript[],
  summaries: [] as StoredSummary[],
  voiceProfiles: [] as { id: string; label: string; embedding: number[] }[],
};

class DatabaseService {
  private db: any = null;

  async init(): Promise<void> {
    if (IS_WEB) return; // web uses memStore — no SQLite needed

    const { openDatabaseAsync } = await import('expo-sqlite');
    this.db = await openDatabaseAsync('lifelog.db');
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS transcripts (
        id            TEXT PRIMARY KEY,
        text          TEXT NOT NULL,
        started_at    INTEGER NOT NULL,
        ended_at      INTEGER NOT NULL,
        duration_ms   INTEGER NOT NULL,
        location_label TEXT,
        latitude      REAL,
        longitude     REAL,
        speaker_label TEXT
      );

      CREATE TABLE IF NOT EXISTS summaries (
        id              TEXT PRIMARY KEY,
        date_key        TEXT NOT NULL UNIQUE,
        generated_at    INTEGER NOT NULL,
        narrative       TEXT NOT NULL,
        highlights      TEXT NOT NULL,
        emotion_arc     TEXT NOT NULL,
        recommendations TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS voice_profiles (
        id          TEXT PRIMARY KEY,
        label       TEXT NOT NULL UNIQUE,
        embedding   TEXT NOT NULL,
        created_at  INTEGER NOT NULL
      );
    `);
  }

  // ── Transcripts ──────────────────────────────────────────

  async saveTranscript(t: Transcript): Promise<void> {
    if (IS_WEB) { memStore.transcripts.push(t); return; }

    await this.db.runAsync(
      `INSERT INTO transcripts
         (id, text, started_at, ended_at, duration_ms, location_label, latitude, longitude, speaker_label)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.text, t.startedAt, t.endedAt, t.durationMs,
       t.locationLabel ?? null, t.latitude ?? null, t.longitude ?? null, t.speakerLabel ?? null]
    );
  }

  async getTranscriptsByDay(dateMs: number): Promise<Transcript[]> {
    const start = new Date(dateMs); start.setHours(0, 0, 0, 0);
    const end   = new Date(dateMs); end.setHours(23, 59, 59, 999);

    if (IS_WEB) {
      return memStore.transcripts.filter(
        (t) => t.startedAt >= start.getTime() && t.startedAt <= end.getTime()
      );
    }

    const rows = await this.db.getAllAsync<any>(
      `SELECT * FROM transcripts WHERE started_at BETWEEN ? AND ? ORDER BY started_at ASC`,
      [start.getTime(), end.getTime()]
    );
    return rows.map((r: any) => ({
      id: r.id, text: r.text, startedAt: r.started_at, endedAt: r.ended_at,
      durationMs: r.duration_ms, locationLabel: r.location_label,
      latitude: r.latitude, longitude: r.longitude, speakerLabel: r.speaker_label,
    }));
  }

  async deleteTranscript(id: string): Promise<void> {
    if (IS_WEB) { memStore.transcripts = memStore.transcripts.filter((t) => t.id !== id); return; }
    await this.db.runAsync('DELETE FROM transcripts WHERE id = ?', [id]);
  }

  // ── Summaries ────────────────────────────────────────────

  async saveSummary(dateKey: string, summary: DailySummary): Promise<void> {
    const stored: StoredSummary = {
      id: `sum-${dateKey}`, dateKey, generatedAt: Date.now(),
      narrative: summary.narrative,
      highlights: JSON.stringify(summary.highlights),
      emotionArc: summary.emotionArc,
      recommendations: JSON.stringify(summary.recommendations),
    };

    if (IS_WEB) {
      const idx = memStore.summaries.findIndex((s) => s.dateKey === dateKey);
      if (idx >= 0) memStore.summaries[idx] = stored; else memStore.summaries.push(stored);
      return;
    }

    await this.db.runAsync(
      `INSERT INTO summaries (id, date_key, generated_at, narrative, highlights, emotion_arc, recommendations)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(date_key) DO UPDATE SET
         generated_at=excluded.generated_at, narrative=excluded.narrative,
         highlights=excluded.highlights, emotion_arc=excluded.emotion_arc,
         recommendations=excluded.recommendations`,
      [stored.id, dateKey, stored.generatedAt, stored.narrative,
       stored.highlights, stored.emotionArc, stored.recommendations]
    );
  }

  async getSummaryByDateKey(dateKey: string): Promise<StoredSummary | null> {
    if (IS_WEB) return memStore.summaries.find((s) => s.dateKey === dateKey) ?? null;

    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM summaries WHERE date_key = ?', [dateKey]
    );
    if (!row) return null;
    return {
      id: row.id, dateKey: row.date_key, generatedAt: row.generated_at,
      narrative: row.narrative, highlights: row.highlights,
      emotionArc: row.emotion_arc, recommendations: row.recommendations,
    };
  }

  // ── Voice profiles ───────────────────────────────────────

  async saveVoiceProfile(id: string, label: string, embedding: number[]): Promise<void> {
    if (IS_WEB) {
      const idx = memStore.voiceProfiles.findIndex((p) => p.label === label);
      if (idx >= 0) memStore.voiceProfiles[idx] = { id, label, embedding };
      else memStore.voiceProfiles.push({ id, label, embedding });
      return;
    }
    await this.db.runAsync(
      `INSERT INTO voice_profiles (id, label, embedding, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(label) DO UPDATE SET embedding=excluded.embedding`,
      [id, label, JSON.stringify(embedding), Date.now()]
    );
  }

  async getAllVoiceProfiles(): Promise<{ id: string; label: string; embedding: number[] }[]> {
    if (IS_WEB) return memStore.voiceProfiles;
    const rows = await this.db.getAllAsync<any>('SELECT * FROM voice_profiles');
    return rows.map((r: any) => ({ id: r.id, label: r.label, embedding: JSON.parse(r.embedding) }));
  }

  async deleteVoiceProfile(label: string): Promise<void> {
    if (IS_WEB) { memStore.voiceProfiles = memStore.voiceProfiles.filter((p) => p.label !== label); return; }
    await this.db.runAsync('DELETE FROM voice_profiles WHERE label = ?', [label]);
  }
}

export const databaseService = new DatabaseService();
