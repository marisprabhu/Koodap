# 🦚 Koodap — Life Log · Ur Companion

> An always-on, fully local AI life companion that listens to your day, understands it, and gives you a nightly debrief with personalised recommendations. **No cloud. No subscriptions. Your data stays on your device.**

![Koodap Logo](assets/logo.png)

---

## ✨ What is Koodap?

Koodap passively listens to your day through your phone's microphone, transcribes everything locally using OpenAI Whisper, and at the end of the day gives you an AI-generated summary of what you did, who you spoke to, how you felt, and what you should do tomorrow.

All AI runs **100% on your own machine** — no data leaves your home network.

---

## 🎯 Core Features

| Feature | Status |
|---|---|
| 🎙️ Voice recording with pause/resume | ✅ Phase 1 |
| 📝 Local Whisper transcription (offline) | ✅ Phase 1 |
| 💾 SQLite local storage | ✅ Phase 1 |
| ✨ AI daily summary & recommendations | ✅ Phase 4 |
| 😊 Emotion arc detection | ✅ Phase 4 |
| 🔔 Daily 9 PM debrief notification | ✅ Phase 4 |
| 🎤 Voice ID / speaker recognition | ✅ Phase 5 |
| 📍 GPS location tagging | 🔄 Phase 2 |
| 📋 Timeline view | 🔜 Phase 3 |
| 🧠 Entity extraction (people, places) | 🔜 Phase 2 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         KOODAP MOBILE APP               │
│      (React Native + Expo)              │
│                                         │
│  🎙️ Audio Capture  📍 GPS  ⏱️ Timeline  │
└────────────────┬────────────────────────┘
                 │ Audio (m4a)
┌────────────────▼────────────────────────┐
│      LOCAL WHISPER SERVER (Port 8001)   │
│      Python + FastAPI + Whisper         │
│      → Speech to text (offline)         │
└────────────────┬────────────────────────┘
                 │ Transcripts
┌────────────────▼────────────────────────┐
│      LOCAL OLLAMA SERVER (Port 11434)   │
│      Llama 3.2 (2GB model)              │
│      → Daily summary + recommendations  │
│      → Emotion arc detection            │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   LOCAL VOICE ID SERVER (Port 8000)     │
│   Python + FastAPI + Resemblyzer        │
│   → Speaker fingerprinting              │
│   → Voice enrollment & identification   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         LOCAL DATABASE                  │
│   SQLite — transcripts, summaries,      │
│   voice profiles (all on-device)        │
└─────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Mobile App | React Native + Expo | iOS + Android from one codebase |
| Speech-to-Text | OpenAI Whisper (local) | Free, offline, accurate |
| AI Brain | Ollama + Llama 3.2 | Free, fully local LLM |
| Voice ID | Resemblyzer (Python) | Speaker fingerprinting |
| Database | SQLite (expo-sqlite) | Local, fast, private |
| State | Zustand | Lightweight, simple |
| Navigation | React Navigation v6 | Industry standard |
| HTTP | Axios | Simple API calls |

---

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **Python 3.10+** — [python.org](https://python.org)
- **Ollama** — [ollama.com](https://ollama.com)
- **ffmpeg** — `winget install ffmpeg` (Windows) or `brew install ffmpeg` (Mac)
- **Expo Go** app on your phone — search "Expo Go" on Play Store / App Store
- **nvm** (recommended) — to manage Node versions

---

## 🚀 Installation

### Step 1 — Clone the repository

```bash
git clone https://github.com/marisprabhu/koodap.git
cd koodap
```

### Step 2 — Install Node dependencies

```bash
npm install --legacy-peer-deps
```

### Step 3 — Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and replace `YOUR_PC_IP` with your local IP address.

**Find your local IP:**
- Windows: run `ipconfig` → look for IPv4 Address under Wi-Fi
- Mac/Linux: run `ifconfig` → look for `inet` under en0

```env
EXPO_PUBLIC_WHISPER_SERVER_URL=http://YOUR_PC_IP:8001
EXPO_PUBLIC_OLLAMA_URL=http://YOUR_PC_IP:11434
EXPO_PUBLIC_VOICE_SERVER_URL=http://YOUR_PC_IP:8000
```

> If testing on the same PC (web browser), use `http://localhost` instead.

### Step 4 — Install Python dependencies

```bash
# Whisper server
cd whisper-server
pip install fastapi uvicorn openai-whisper pydub python-multipart

# Voice ID server
cd ../voice-server
pip install fastapi uvicorn resemblyzer pydub python-multipart
```

### Step 5 — Install and start Ollama

```bash
# Download from ollama.com, then:
ollama pull llama3.2
```

### Step 6 — Start all servers

Open **3 separate terminals:**

**Terminal 1 — Whisper:**
```bash
cd whisper-server
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

**Terminal 2 — Voice ID:**
```bash
cd voice-server
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 3 — Ollama:**
```bash
# Windows (Command Prompt):
set OLLAMA_HOST=0.0.0.0:11434
set OLLAMA_ORIGINS=*
ollama serve

# Mac/Linux:
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS=* ollama serve
```

### Step 7 — Start the app

```bash
# In the project root:
npm start -- --lan --clear
```

Scan the QR code with **Expo Go** on your phone.

---

## ✅ Verify Installation

Open these URLs in your browser — all should respond:

| Service | URL | Expected Response |
|---|---|---|
| Whisper | `http://localhost:8001/health` | `{"status":"ok","model":"base"}` |
| Voice ID | `http://localhost:8000/health` | `{"status":"ok"}` |
| Ollama | `http://localhost:11434` | `Ollama is running` |

---

## 📱 How to Use

### Recording
1. Open Koodap → **Record** tab
2. Tap **Start Recording** and speak naturally
3. Tap **Stop & Save** — Whisper transcribes your audio in seconds
4. Your transcript appears in the list with a timestamp

### Daily Debrief
1. Go to the **Debrief** tab (✨)
2. Tap **Generate Today's Debrief**
3. Llama 3.2 analyses your transcripts and returns:
   - A narrative summary of your day
   - Key highlights
   - Your emotion arc
   - 3 personalised recommendations (physical, mental, productivity)

### Voice Enrollment (Speaker ID)
1. Go to the **Voices** tab (🎤)
2. Enter a name (e.g. "Me", "Priya")
3. Record 20–30 seconds of natural speech
4. Future transcripts will be automatically tagged with the speaker's name

---

## 📁 Project Structure

```
koodap/
├── App.tsx                        # Entry point
├── app.json                       # Expo config
├── .env.example                   # Environment template
│
├── src/
│   ├── components/
│   │   ├── KoodapHeader.tsx       # App header with logo
│   │   └── RecordingIndicator.tsx # Animated REC indicator
│   ├── hooks/
│   │   └── useAudioRecorder.ts    # Record → transcribe → save
│   ├── navigation/
│   │   └── RootNavigator.tsx      # Bottom tab navigator
│   ├── screens/
│   │   ├── HomeScreen.tsx         # Record + transcript feed
│   │   ├── SummaryScreen.tsx      # Daily debrief UI
│   │   └── VoiceEnrollScreen.tsx  # Voice profile management
│   ├── services/
│   │   ├── audioService.ts        # expo-av recording
│   │   ├── claudeService.ts       # Ollama/LLM integration
│   │   ├── databaseService.ts     # SQLite CRUD
│   │   ├── notificationService.ts # Push notifications
│   │   ├── voiceIdService.ts      # Speaker recognition
│   │   └── whisperService.ts      # Transcription API
│   ├── store/
│   │   ├── summaryStore.ts        # Zustand summary state
│   │   └── transcriptStore.ts     # Zustand transcript state
│   ├── types/
│   │   └── index.ts               # TypeScript types
│   └── theme.ts                   # Colors, fonts, spacing
│
├── whisper-server/
│   └── main.py                    # Local Whisper FastAPI server
│
└── voice-server/
    └── main.py                    # Resemblyzer FastAPI server
```

---

## 🗺️ Roadmap

| Phase | Feature | Status |
|---|---|---|
| Phase 1 | Audio capture + Whisper transcription + SQLite | ✅ Done |
| Phase 2 | Claude/LLM entity extraction (people, places, activities) | 🔜 Next |
| Phase 3 | Timeline view + emotion graph | 🔜 Planned |
| Phase 4 | Daily summary + recommendations | ✅ Done |
| Phase 5 | Voice ID (speaker recognition) | ✅ Done |
| Phase 6 | Always-on VAD (Voice Activity Detection) | 🔜 Planned |
| Phase 7 | Export / backup / sync | 🔜 Planned |

---

## 🔒 Privacy

Koodap is built **privacy-first**:

- ✅ All audio is deleted immediately after transcription
- ✅ All data stays on your device (SQLite)
- ✅ All AI runs locally (Whisper + Ollama)
- ✅ No accounts, no cloud, no subscriptions
- ✅ No data ever leaves your home network
- ⚠️ **Legal note:** Recording conversations requires consent in many countries (e.g. Belgium, Germany, USA vary by state). Always inform people they are being recorded.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [OpenAI Whisper](https://github.com/openai/whisper) — speech recognition
- [Ollama](https://ollama.com) — local LLM runtime
- [Resemblyzer](https://github.com/resemble-ai/Resemblyzer) — speaker verification
- [Expo](https://expo.dev) — React Native toolchain

---

<p align="center">Built with ❤️ by the Koodap team · <a href="https://github.com/marisprabhu/koodap">github.com/marisprabhu/koodap</a></p>
