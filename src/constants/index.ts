import { TranscribeMode } from "@/src/types";

export const DEFAULT_MODE: TranscribeMode = "fast";

export const TRANSCRIBE_MODES = [
  { value: "fast", label: "快速模式" },
  { value: "standard", label: "標準模式" },
  { value: "refined", label: "潤稿模式" },
] as const;

// TODO: Remove when supabae db store api key
export const STORAGE_KEYS = {
  OPENAI_API_KEY: "openai_api_key",
} as const;

export const API_ENDPOINTS = {
  TRANSCRIBE_TASK: "/transcribe-tasks",
  VALIDATE_OPENAI_API_KEY: "/validate-openai-api-key",
} as const;

export const MAX_AUDIO_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const FREE_TIER_MAX_AUDIO_DURATION = 10 * 60; // 10 minutes

export const ADAPTIVE_POLLING_INTERVAL_RULES = [
  { maxAttempts: 10, interval: 500 }, // 0-5 seconds, poll every 0.5 seconds
  { maxAttempts: 25, interval: 1000 }, // 5-20 seconds, poll every 1 second
  { maxAttempts: 45, interval: 2000 }, // 20-60 seconds, poll every 2 seconds
  { maxAttempts: 65, interval: 3000 }, // 60-120 seconds, poll every 3 seconds
  { maxAttempts: 101, interval: 5000 }, // 120-300 seconds, poll every 5 seconds,
  // more than 300 seconds, throw error
];

export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_INTERVAL = 3000; // 3 seconds
