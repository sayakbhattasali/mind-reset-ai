// lib/protocols.ts
export interface Step {
  stage: string;
  duration: number; // seconds
  spokenText: string;
  uiPrompt: string;
  breathPacing?: "inhale" | "hold" | "exhale" | "none";
}

export interface Protocol {
  id: string;
  title: string;
  steps: Step[];
}

export const PROTOCOLS: Record<string, Protocol> = {
  craving: {
    id: "craving",
    title: "Urge Surfing",
    steps: [
      {
        stage: "Acknowledge",
        duration: 15,
        spokenText: "Notice the craving without fighting it. Where in your body do you physically feel the urge right now?",
        uiPrompt: "Locate the physical sensation (Chest, throat, stomach, hands).",
        breathPacing: "none",
      },
      {
        stage: "Wave Riding",
        duration: 35,
        spokenText: "Imagine this craving as a physical wave. It peaks, plateaus, and drops. Breathe slowly with me as the wave crests.",
        uiPrompt: "Ride the peak. It naturally subsides in 90 seconds.",
        breathPacing: "exhale",
      },
      {
        stage: "Pattern Disruption",
        duration: 20,
        spokenText: "Name one physical action you can do with your hands right now instead of reaching for it.",
        uiPrompt: "What is one immediate physical distraction you can do right now?",
        breathPacing: "none",
      },
      {
        stage: "Grounding Anchor",
        duration: 20,
        spokenText: "You have ridden the peak of the wave without reacting. Take a deep breath and settle back into your body.",
        uiPrompt: "Take a deep grounding breath. The urge has plateaued.",
        breathPacing: "inhale",
      }
    ],
  },
  anxiety: {
    id: "anxiety",
    title: "Physiological Sigh & Grounding",
    steps: [
      {
        stage: "Autonomic Reset",
        duration: 30,
        spokenText: "Take two quick inhales through the nose, followed by one long, slow exhale through the mouth.",
        uiPrompt: "Double Inhale (Nose) → Long Exhale (Mouth)",
        breathPacing: "inhale",
      },
      {
        stage: "Extended Release",
        duration: 30,
        spokenText: "Slowly exhale all the air out. Feel your heart rate decelerate with every long outbreath.",
        uiPrompt: "Slow 8-second exhale. Drop your shoulders.",
        breathPacing: "exhale",
      },
      {
        stage: "Sensory Anchor",
        duration: 30,
        spokenText: "Press both feet firmly into the floor. Feel the support beneath you. You are completely safe in this moment.",
        uiPrompt: "Feel the ground. Anchor your physical posture.",
        breathPacing: "none",
      },
    ],
  },
  doomscroll: {
    id: "doomscroll",
    title: "Sensory Re-Engagement",
    steps: [
      {
        stage: "Screen Detach",
        duration: 20,
        spokenText: "Look away from the screen for a moment. Look at the furthest wall or window in your room.",
        uiPrompt: "Look at the furthest point in the room (20 feet away).",
        breathPacing: "none",
      },
      {
        stage: "Tactile Anchor",
        duration: 25,
        spokenText: "Touch a physical surface near you. Notice the temperature and texture of it with your fingertips.",
        uiPrompt: "Touch an object near you. Focus on its physical texture.",
        breathPacing: "none",
      },
      {
        stage: "Sensory Reconnection",
        duration: 25,
        spokenText: "Listen closely to the room around you. Identify three distinct ambient sounds in your environment.",
        uiPrompt: "Identify 3 distinct sounds around you right now.",
        breathPacing: "none",
      },
      {
        stage: "Intentional Return",
        duration: 20,
        spokenText: "Take a deep breath. Decide your single intentional purpose before looking back at any screen.",
        uiPrompt: "Define your clear intention before continuing.",
        breathPacing: "inhale",
      },
    ],
  },
  stress: {
    id: "stress",
    title: "Task Isolation & Cognitive Narrowing",
    steps: [
      {
        stage: "Cognitive Pause",
        duration: 20,
        spokenText: "Pause completely. You do not need to solve everything right now. Let all open tabs and worries wait.",
        uiPrompt: "Complete stop. Give your working memory permission to rest.",
        breathPacing: "none",
      },
      {
        stage: "Box Reset",
        duration: 30,
        spokenText: "Breathe in for four seconds, hold for four, exhale for four, and hold empty. Reset your nervous system.",
        uiPrompt: "Box Breath: 4s In → 4s Hold → 4s Out → 4s Hold",
        breathPacing: "inhale",
      },
      {
        stage: "Single Action",
        duration: 25,
        spokenText: "Identify only the single next physical micro-step you will take. Ignore the rest of the mountain.",
        uiPrompt: "Pick the single next concrete action (1-2 minutes).",
        breathPacing: "none",
      },
      {
        stage: "Commitment",
        duration: 15,
        spokenText: "You are clear and ready. When this session concludes, execute that one single action.",
        uiPrompt: "Narrow focus to that single step and execute.",
        breathPacing: "exhale",
      },
    ],
  },
};

export function getProtocol(triggerId: string): Protocol {
  return PROTOCOLS[triggerId] || PROTOCOLS.anxiety;
}
