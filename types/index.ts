export type TranscribeMode = "fast" | "standard" | "refined";

// Application-level status (complete user flow)
export type AppStatus =
  | "idle" // Initial state, can start recording
  | "recording" // Currently recording
  | "paused" // Recording paused
  | "audio-ready" // Audio ready, waiting for transcription
  | "transcribing" // Transcribing audio
  | "transcription-completed" // Transcription completed, can continue or reset
  | "transcription-error"; // Transcription failed, can retry or re-record

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
