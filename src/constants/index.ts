import { TranscribeMode } from "@/src/types";

export const DEFAULT_MODE: TranscribeMode = "standard";

export const TRANSCRIBE_MODES = [
  { value: "fast", label: "快速模式" },
  { value: "standard", label: "標準模式" },
  { value: "refined", label: "潤稿模式" },
] as const;

export const DEFAULT_CONSENT_DATA_COLLECTION = true; // Default free tier and consent data collection
export const DEFAULT_IS_USING_PERSONAL_API_KEY = false; // Default to false for free tier

// TODO: Remove when supabae db store api key
export const STORAGE_KEYS = {
  OPENAI_API_KEY: "openai_api_key",
} as const;

export const API_ENDPOINTS = {
  TRANSCRIBE_TASK: "/transcribe-tasks",
  VALIDATE_OPENAI_API_KEY: "/validate-openai-api-key",
} as const;

export const MAX_AUDIO_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const FREE_TIER_MAX_AUDIO_DURATION = 30 * 60; // 30 minutes

export const TRANSCRIBE_STREAM_MAX_RETRY_ATTEMPTS = 5;
export const TRANSCRIBE_STREAM_RETRY_INTERVAL = 3000; // 3 seconds
