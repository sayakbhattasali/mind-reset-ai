<div align="center">

# 🧠 MindReset AI
### *90-Second Somatic Reset & Real-Time AI Somatic Voice Therapist*

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Groq LPU](https://img.shields.io/badge/Groq-Fast_Inference-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

---

### 🌐 Live Deployment
### 🔗 **[https://mind-reset-ai.vercel.app](https://mind-reset-ai.vercel.app)**
*GitHub Repository:* **[sayakbhattasali/mind-reset-ai](https://github.com/sayakbhattasali/mind-reset-ai)**

---

</div>

## 📖 Overview

**MindReset AI** is a real-time clinical somatic voice therapy application designed to defuse acute distress, cravings, panic, and anxiety in **90 seconds**.

Guided by **Dr. Marcus**—an empathetic AI somatic clinician powered by Groq LPUs and low-latency audio pipelines—MindReset guides users through physical nervous system down-regulation (physiological sighs, vagal nerve resets, sensory grounding) through natural voice dialogue and real-time 3D avatar lip-sync.

---

## ✨ Core Features

### 🎙️ 1. Real-Time Conversational Voice Therapist
- **Strict Half-Duplex Turn-Taking**: Zero microphone feedback loops; the microphone hardware activates strictly after Dr. Marcus finishes speaking.
- **Deep Clinical Male Voice**: Guaranteed masculine clinician voice across laptops, iPhones, and Android devices via high-speed zero-key serverless audio streaming.
- **Microphone Echo Isolation**: 400ms controlled handshake prevents Dr. Marcus's voice from echoing into speech recognition.

### 👤 2. Procedural 3D Human Avatar (Dr. Marcus)
- **WebGL / Three.js Canvas**: Interactive 3D avatar with realistic studio rim lighting, idle breathing motions, eye saccades, and head movements.
- **Real-Time Lip-Sync**: Dynamic jaw/mouth oscillation synchronized directly to speech playback events.

### ⚡ 3. Ultra-Fast Groq Inference (<600ms)
- Streams somatic counseling responses in sub-600ms using Groq LPUs.
- Concise, grounding clinical dialogues tailored to urge intensity (1–10 scale).

### 📊 4. Clinical Intake & Relief Assessment
- **Pre-Session Calibration**: 1–10 Urge/Distress severity slider with categorized trigger selection (Anxiety, Craving, Rage, Panic, Burnout).
- **Post-Session Evaluation**: Immediate calculation of percentage urge reduction with persistent cloud session logging.

### 🔐 5. Anonymous-to-Authenticated Cloud Sync
- Seamless guest access with instant Firebase Google Auth claiming to preserve session relief history across devices.

---

## 🛠️ Architecture & Data Flow

```mermaid
graph TD
    User([User Voice Input]) -->|Web Speech API| Client[Next.js Client]
    Client -->|POST /api/chat History + Context| GroqServer[Groq LPU LLM Engine]
    GroqServer -->|Streamed Clinical Response| Client
    Client -->|POST /api/tts Sentence Chunks| TTSAPI[Amazon Polly / REST TTS Bridge]
    TTSAPI -->|audio/mpeg MP3 Buffer| Client
    Client -->|HTML5 Audio Playback + Lip-Sync| Avatar[3D Avatar Dr. Marcus]
    Avatar -->|onended + 400ms Handshake| User
    Client -->|Log Outcome| Firebase[(Firestore DB)]
```

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router), React 18, TypeScript |
| **3D Rendering** | Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`) |
| **Styling & UI** | TailwindCSS, Framer Motion, Lucide Icons |
| **AI Inference** | Groq Cloud SDK (`qwen/qwen3.8-27b`, `llama-3.3-70b-versatile`) |
| **Audio & Speech** | Serverless REST Audio Stream (Polly Brian), Web Speech API, HTML5 Audio |
| **Database & Auth** | Google Firebase (Authentication & Cloud Firestore) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.18.0 or later
- **npm** / **pnpm** / **yarn**
- Free **[Groq API Key](https://console.groq.com)**
- Free **[Firebase Project](https://console.firebase.google.com)**

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/sayakbhattasali/mind-reset-ai.git
   cd mind-reset-ai
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # Groq API Key (https://console.groq.com)
   GROQ_API_KEY=gsk_your_groq_api_key_here

   # Firebase Configuration (https://console.firebase.google.com)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 📂 Project Structure

```text
mind-reset-ai/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Groq stream handler & somatic prompt engine
│   │   └── tts/route.ts        # Zero-key male voice REST MP3 generator
│   ├── session/page.tsx        # Somatic therapy session & calibration flow
│   ├── protocols/page.tsx      # Emergency somatic reset protocols
│   ├── how-it-works/page.tsx   # Neurobiology & clinical mechanics
│   ├── layout.tsx              # Root layout & theme providers
│   └── page.tsx                # High-conversion landing page
├── components/
│   ├── HumanAvatar.tsx         # Procedural 3D humanoid avatar with lip-sync
│   ├── AvatarCanvas.tsx        # Three.js fiber canvas wrapper
│   ├── BreathingRing.tsx       # Interactive physiological sigh pacer
│   ├── HeroSection.tsx         # Hero section & somatic trigger selectors
│   ├── Navbar.tsx              # Navigation bar with auth status
│   └── Footer.tsx              # Application footer
├── hooks/
│   └── useVoiceTherapist.ts    # Half-duplex voice state machine & mic manager
├── lib/
│   ├── firebase.ts             # Firebase client SDK initialization
│   ├── protocols.ts            # Clinical reset protocol data
│   └── speech.ts               # Audio playback & acoustic helpers
└── public/
    ├── mind-reset-bg.webp      # Premium ambient gradient background
    └── mind-reset-logo.png     # MindReset brand asset
```

---

## 🔒 Security & Privacy

- **No Stored Transcripts**: Vocal interactions are processed in volatile memory and never retained for ad profiling.
- **Client-Side Synthesis Guard**: User speech recognition stays local to the client browser until submitted to the clinical pipeline.
- **Environment Isolation**: Private API keys are strictly confined to serverless API routes.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ for rapid nervous system reset and mental clarity.</sub>
</div>
