import { TranscribeMode } from "@/types";

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
  TRANSCRIBE: "/transcribe",
} as const;
