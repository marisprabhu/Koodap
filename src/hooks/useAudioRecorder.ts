import * as Location from 'expo-location';
import { useCallback, useRef, useState } from 'react';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
import { audioService } from '../services/audioService';
import { databaseService } from '../services/databaseService';
import { voiceIdService } from '../services/voiceIdService';
import { whisperService } from '../services/whisperService';
import { RecordingState, TranscriptionStatus } from '../types';

export function useAudioRecorder() {
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    durationMs: 0,
  });
  const [transcriptionStatus, setTranscriptionStatus] = useState<TranscriptionStatus>('idle');
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    const granted = await audioService.requestPermissions();
    if (!granted) throw new Error('Microphone permission denied');

    startTimeRef.current = Date.now();
    await audioService.start();

    intervalRef.current = setInterval(() => {
      setRecording((prev) => ({ ...prev, durationMs: Date.now() - startTimeRef.current }));
    }, 500);

    setRecording({ isRecording: true, isPaused: false, durationMs: 0 });
  }, []);

  const stopAndTranscribe = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const endedAt = Date.now();

    const uri = await audioService.stop();
    setRecording({ isRecording: false, isPaused: false, durationMs: 0 });

    if (!uri) return;

    setTranscriptionStatus('transcribing');
    try {
      const [transcriptionResult, locationResult, speakerLabel] = await Promise.all([
        whisperService.transcribe(uri),
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
        voiceIdService.identify(uri).catch(() => null),
      ]);

      const transcript = {
        id: generateId(),
        text: transcriptionResult.text,
        startedAt: startTimeRef.current,
        endedAt,
        durationMs: endedAt - startTimeRef.current,
        latitude: locationResult?.coords.latitude,
        longitude: locationResult?.coords.longitude,
        speakerLabel: speakerLabel ?? undefined,
      };

      await databaseService.saveTranscript(transcript);
      setLastTranscript(transcriptionResult.text);
      setTranscriptionStatus('done');
    } catch (err) {
      console.error('Transcription failed:', err);
      setTranscriptionStatus('error');
    } finally {
      await audioService.deleteFile(uri);
    }
  }, []);

  const togglePause = useCallback(async () => {
    if (recording.isPaused) {
      await audioService.resume();
      startTimeRef.current = Date.now() - recording.durationMs;
      intervalRef.current = setInterval(() => {
        setRecording((prev) => ({ ...prev, durationMs: Date.now() - startTimeRef.current }));
      }, 500);
    } else {
      await audioService.pause();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    setRecording((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  }, [recording]);

  return {
    recording,
    transcriptionStatus,
    lastTranscript,
    startRecording,
    stopAndTranscribe,
    togglePause,
  };
}
