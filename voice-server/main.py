"""
LifeLog AI — Voice ID microservice
Runs locally; the React Native app talks to it over LAN.

Install:
  pip install fastapi uvicorn resemblyzer pydub python-multipart

Run:
  uvicorn main:app --host 0.0.0.0 --port 8000
"""

import io
import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from resemblyzer import VoiceEncoder, preprocess_wav
from pydub import AudioSegment

app = FastAPI()
encoder = VoiceEncoder()   # loads once, cached in memory


def _to_wav_array(data: bytes) -> np.ndarray:
    """Accept m4a / webm / wav and return a float32 mono 16kHz numpy array."""
    audio = AudioSegment.from_file(io.BytesIO(data))
    audio = audio.set_channels(1).set_frame_rate(16000)
    samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
    # Normalise to [-1, 1]
    samples /= np.iinfo(audio.array_type).max
    return samples


@app.post("/embed")
async def embed(file: UploadFile = File(...)):
    """Return a 256-d embedding for the uploaded audio segment."""
    data = await file.read()
    wav = _to_wav_array(data)
    wav = preprocess_wav(wav, source_sr=16000)
    embedding = encoder.embed_utterance(wav)
    return {"embedding": embedding.tolist()}


@app.post("/enroll")
async def enroll(file: UploadFile = File(...), label: str = Form(...)):
    """Convenience endpoint: embed + echo label back (storage handled on-device)."""
    data = await file.read()
    wav = _to_wav_array(data)
    wav = preprocess_wav(wav, source_sr=16000)
    embedding = encoder.embed_utterance(wav)
    return {"label": label, "embedding": embedding.tolist()}


@app.get("/health")
async def health():
    return {"status": "ok"}
