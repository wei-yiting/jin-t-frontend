import { useReducer } from "react";
import {
  TranscribeStreamEventType,
  ChunkCompletedStreamEvent,
  StreamEvent,
} from "@/src/types";

export interface ReceivedChunksWithStatus
  extends Omit<ChunkCompletedStreamEvent["payload"], "type"> {
  status: "old" | "new";
}

export type StreamState = {
  transcribePhase: TranscribeStreamEventType | null;
  progressMessage: string;
  receivedChunks: ReceivedChunksWithStatus[];
  totalChunksNumber: number | null;
  transcriptInProgress: string | null;
  streamDone: boolean;
};

const initialStreamState: StreamState = {
  transcribePhase: null,
  progressMessage: "",
  receivedChunks: [],
  totalChunksNumber: null,
  transcriptInProgress: null,
  streamDone: false,
};

const streamReducer = (
  state: StreamState,
  action: StreamEvent
): StreamState => {
  const { type: eventType, payload } = action;
  switch (eventType) {
    case TranscribeStreamEventType.TASK_QUEUED:
      return {
        ...initialStreamState,
        transcribePhase: eventType,
        progressMessage: "音檔上傳中...",
      };
    case TranscribeStreamEventType.TASK_STARTED: {
      const totalChunksNumber = Number(payload.total_chunks);
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/f35e24fa-e6e7-428f-a9d6-25a05c1c60f1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "useTranscribeStream.ts:reducer:TASK_STARTED",
            message: "reducer:TASK_STARTED",
            data: {
              totalChunksRaw: payload?.total_chunks,
              totalChunksNumber,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "pre-fix",
            hypothesisId: "H3",
          }),
        }
      ).catch(() => {});
      // #endregion
      return {
        ...state,
        transcribePhase: eventType,
        progressMessage: `轉錄中, 已完成 0 / ${totalChunksNumber} 段音檔...`,
        totalChunksNumber: totalChunksNumber,
      };
    }
    case TranscribeStreamEventType.CHUNK_COMPLETED: {
      // Deduplicate the chunk if it already exists
      const existingChunkIndex = state.receivedChunks.findIndex(
        (item) => item.chunk_index === payload.chunk_index
      );

      let updatedChunks: ReceivedChunksWithStatus[];
      if (existingChunkIndex >= 0) {
        // Mark all chunks as old
        updatedChunks = state.receivedChunks.map((item) => ({
          ...item,
          status: "old",
        }));
      } else {
        // Mark payload as new and all other chunks as old
        const oldChunks = state.receivedChunks.map((item) => ({
          ...item,
          status: "old" as const,
        }));
        updatedChunks = [...oldChunks, { status: "new", ...payload }];
      }

      const sortedUpdatedChunks = updatedChunks
        .slice()
        .sort((a, b) => a.chunk_index - b.chunk_index);

      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/f35e24fa-e6e7-428f-a9d6-25a05c1c60f1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "useTranscribeStream.ts:reducer:CHUNK_COMPLETED",
            message: "reducer:CHUNK_COMPLETED",
            data: {
              chunkIndex: payload?.chunk_index,
              payloadTextLength: payload?.text?.length ?? null,
              updatedChunksCount: sortedUpdatedChunks.length,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "pre-fix",
            hypothesisId: "H4",
          }),
        }
      ).catch(() => {});
      // #endregion
      return {
        ...state,
        transcribePhase: eventType,
        progressMessage: `轉錄中, 已完成 ${sortedUpdatedChunks.length} / ${state.totalChunksNumber} 段音檔...`,
        receivedChunks: sortedUpdatedChunks,
      };
    }
    case TranscribeStreamEventType.CHUNKS_CONSOLIDATING: {
      return {
        ...state,
        transcribePhase: eventType,
        progressMessage: "合併成最終文字...",
      };
    }
    case TranscribeStreamEventType.PUNC_FIXING:
      return {
        ...state,
        transcribePhase: eventType,
        transcriptInProgress: payload.consolidated_text,
        progressMessage: "正在修正標點符號...",
      };
    case TranscribeStreamEventType.TASK_FINISHED:
      return {
        ...state,
        transcribePhase: eventType,
        transcriptInProgress: payload.final_result,
      };
    default:
      return state;
  }
};

export const useTranscribeStream = () => {
  const [streamState, dispatchStreamEvent] = useReducer(
    streamReducer,
    initialStreamState
  );

  return {
    transcribeProgressMessage: streamState.progressMessage,
    transcribePhase: streamState.transcribePhase,
    transcribeReceivedChunks: streamState.receivedChunks,
    transcriptInProgress: streamState.transcriptInProgress,
    dispatchStreamEvent,
  };
};
