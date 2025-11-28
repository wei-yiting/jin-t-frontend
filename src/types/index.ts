export type TranscribeMode = "fast" | "standard" | "refined";

// Application-level status (complete user flow)
export type AppStatus =
  | "idle" // Initial state, can start recording
  | "recording" // Currently recording
  | "paused" // Recording paused
  | "audio-ready" // Audio ready, waiting for transcript
  | "transcribing" // Transcribing audio
  | "transcribed" // Transcribed completed, can continue or reset
  | "transcribe-error"; // Transcribe failed, can retry or re-record

export interface TranscribeRequest {
  audio_file: Blob;
  openai_api_key: string; // TODO: Remove when supabae db store api key
  transcribe_mode: TranscribeMode;
  audio_duration?: string;
}

export interface TranscribeResponse {
  transcript: string;
  // Add other potential fields from backend response if needed
}

export interface ApiError {
  message: string;
  code?: string;
}

export const USER_INFO_KEYS = {
  DEVICE_ID: "jjt_device_id",
  USE_PERSONAL_API_KEY: "jjt_use_personal_api_key",
  OPENAI_API_KEY: "jjt_openai_api_key",
  CONSENT_DATA_COLLECTION: "jjt_consent_data_collection",
} as const;

export const LOCAL_STORAGE_KEYS = {
  ...USER_INFO_KEYS,
} as const;

export interface CheckIsOpenaiApiKeyValidResponse {
  is_api_key_valid: boolean;
  has_unexpectied_validation_error: boolean;
}
