export type TranscribeMode = "fast" | "standard" | "refined";

export type RecordingStatus = "idle" | "recording" | "paused";

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
