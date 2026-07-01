import axios from 'axios';

// Local Whisper server — run whisper-server/main.py on your PC
// Use your PC's local IP when testing on a physical device
const WHISPER_SERVER = process.env.EXPO_PUBLIC_WHISPER_SERVER_URL ?? 'http://localhost:8001';

export interface WhisperResult {
  text: string;
  language?: string;
}

class WhisperService {
  async transcribe(audioUri: string): Promise<WhisperResult> {
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as any);

    const response = await axios.post<WhisperResult>(
      `${WHISPER_SERVER}/transcribe`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000, // local CPU transcription can take a few seconds
      }
    );

    return response.data;
  }
}

export const whisperService = new WhisperService();
