export type TranscribeMode = "fast" | "standard" | "refined";
export type BillingOption = "free" | "byok";

// Application-level status (complete user flow)
export type AppStatus =
  | "idle" // Initial state, can start recording
  | "recording" // Currently recording
  | "paused" // Recording paused
  | "audio-ready" // Audio ready, waiting for transcript
  | "transcribing" // Transcribing audio
  | "transcribed" // Transcribed completed, can continue or reset
  | "transcribe-error"; // Transcribe failed, can retry or re-record

export interface UserSettings {
  deviceId: string;
  useOwnApiKey: boolean;
  allowDataCollection: boolean;
  customOpenaiApiKey?: string;
}

export interface TranscribeParams {
  audioFile: Blob;
  transcribeMode: TranscribeMode;
  audioDuration?: string;
}
export interface TranscribeResponse {
  process_id: string;
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

export interface ValidateOpenaiApiKeyResponse {
  is_api_key_valid: boolean;
  has_unexpectied_validation_error: boolean;
}

export enum TaskStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum TaskProgressCode {
  TRANSCRIBING = "transcribing",
  PUNC_FIXING = "punc_fixing",
  REFINING = "refining",
}

export interface BeginTranscribeResponse {
  task_id: string;
}

export interface TranscribeProgressResponse {
  status: TaskStatus;
  progress_code: TaskProgressCode | null;
  message: string;
  transcript: string | null;
  error_detail: string | null;
}
