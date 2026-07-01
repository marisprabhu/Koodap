export interface Transcript {
  id: string;
  text: string;
  startedAt: number;       // unix ms
  endedAt: number;
  durationMs: number;
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
  audioUri?: string;       // temp path — deleted after transcription
  speakerLabel?: string;   // set by Voice ID (Phase 5)
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  durationMs: number;
}

export type TranscriptionStatus = 'idle' | 'transcribing' | 'done' | 'error';
