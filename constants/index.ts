import { TranscribeMode } from "@/types";

export const DEFAULT_MODE: TranscribeMode = "fast";

export const TRANSCRIBE_MODES = [
  { value: "fast", label: "Fast Mode" },
  { value: "standard", label: "Standard Mode" },
  { value: "refined", label: "Refined Mode" },
] as const;

// TODO: Remove when supabae db store api key
export const STORAGE_KEYS = {
  OPENAI_API_KEY: "openai_api_key",
} as const;

export const API_ENDPOINTS = {
  TRANSCRIBE: "/transcribe",
} as const;
