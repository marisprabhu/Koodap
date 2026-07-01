import { create } from 'zustand';
import { databaseService } from '../services/databaseService';
import { Transcript } from '../types';

interface TranscriptStore {
  todayTranscripts: Transcript[];
  loadToday: () => Promise<void>;
  removeTranscript: (id: string) => Promise<void>;
}

export const useTranscriptStore = create<TranscriptStore>((set) => ({
  todayTranscripts: [],

  loadToday: async () => {
    const transcripts = await databaseService.getTranscriptsByDay(Date.now());
    set({ todayTranscripts: transcripts });
  },

  removeTranscript: async (id) => {
    await databaseService.deleteTranscript(id);
    set((state) => ({
      todayTranscripts: state.todayTranscripts.filter((t) => t.id !== id),
    }));
  },
}));
