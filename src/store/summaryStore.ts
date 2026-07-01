import { create } from 'zustand';
import { claudeService, DailySummary, Recommendation } from '../services/claudeService';
import { databaseService } from '../services/databaseService';
import { notificationService } from '../services/notificationService';

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

interface SummaryStore {
  summary: DailySummary | null;
  isGenerating: boolean;
  error: string | null;
  lastGeneratedKey: string | null;

  loadSummary: (date?: Date) => Promise<void>;
  generateSummary: (date?: Date) => Promise<void>;
}

export const useSummaryStore = create<SummaryStore>((set, get) => ({
  summary: null,
  isGenerating: false,
  error: null,
  lastGeneratedKey: null,

  loadSummary: async (date = new Date()) => {
    const key = toDateKey(date);
    const stored = await databaseService.getSummaryByDateKey(key);
    if (!stored) return;

    set({
      summary: {
        narrative: stored.narrative,
        highlights: JSON.parse(stored.highlights),
        emotionArc: stored.emotionArc,
        recommendations: JSON.parse(stored.recommendations) as Recommendation[],
      },
      lastGeneratedKey: key,
    });
  },

  generateSummary: async (date = new Date()) => {
    set({ isGenerating: true, error: null });
    try {
      const transcripts = await databaseService.getTranscriptsByDay(date.getTime());
      const summary = await claudeService.generateDailySummary(transcripts, date);
      const key = toDateKey(date);
      await databaseService.saveSummary(key, summary);
      await notificationService.sendSummaryReady();
      set({ summary, isGenerating: false, lastGeneratedKey: key });
    } catch (err: any) {
      set({ isGenerating: false, error: err?.message ?? 'Failed to generate summary' });
    }
  },
}));
