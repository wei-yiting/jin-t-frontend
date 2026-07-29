type EmptyObject = Record<string, never>;

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
  encryptedCustomOpenaiApiKey?: string;
  maskedCustomOpenaiApiKey?: string;
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
  ENCRYPTED_OPENAI_API_KEY: "jjt_encrypted_openai_api_key",
  MASKED_OPENAI_API_KEY: "jjt_masked_openai_api_key",
  CONSENT_DATA_COLLECTION: "jjt_consent_data_collection",
} as const;

export const LOCAL_STORAGE_KEYS = {
  ...USER_INFO_KEYS,
} as const;

export interface ValidateOpenaiApiKeyResponse {
  is_api_key_valid: boolean;
  has_unexpectied_validation_error: boolean;
}

export enum TranscribeStreamEventType {
  TASK_QUEUED = "TASK_QUEUED",
  TASK_STARTED = "TASK_STARTED",
  CHUNK_COMPLETED = "CHUNK_COMPLETED",
  CHUNKS_CONSOLIDATING = "CHUNKS_CONSOLIDATING",
  PUNC_FIXING = "PUNC_FIXING",
  TASK_FINISHED = "TASK_FINISHED",
  TASK_FAILED = "TASK_FAILED",
}

export interface TaskStartedStreamEvent {
  type: TranscribeStreamEventType.TASK_STARTED;
  payload: {
    total_chunks: number;
  };
}

export interface TaskQueuedStreamEvent {
  type: TranscribeStreamEventType.TASK_QUEUED;
  payload: EmptyObject;
}

export interface ChunkCompletedStreamEvent {
  type: TranscribeStreamEventType.CHUNK_COMPLETED;
  payload: {
    chunk_index: number;
    text: string;
  };
}

export interface ChunksConsolidatingStreamEvent {
  type: TranscribeStreamEventType.CHUNKS_CONSOLIDATING;
  payload: EmptyObject;
}

export interface PuncFixingStreamEvent {
  type: TranscribeStreamEventType.PUNC_FIXING;
  payload: {
    consolidated_text: string;
  };
}

export interface TaskFinishedStreamEvent {
  type: TranscribeStreamEventType.TASK_FINISHED;
  payload: {
    final_result: string;
  };
}

export interface TaskFailedStreamEvent {
  type: TranscribeStreamEventType.TASK_FAILED;
  payload: {
    error: string;
  };
}

export type StreamEvent =
  | TaskStartedStreamEvent
  | TaskQueuedStreamEvent
  | ChunkCompletedStreamEvent
  | ChunksConsolidatingStreamEvent
  | PuncFixingStreamEvent
  | TaskFinishedStreamEvent
  | TaskFailedStreamEvent;

export type StreamMessage = StreamEvent & {
  id: string;
};

export interface StreamEventResponse {
  messages: StreamMessage[];
  last_id: string;
}

export interface BeginTranscribeResponse {
  task_id: string;
}
