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

// Short audio is transcribed in one call, so "1 / 1 段音檔" would describe
// splitting that never happened. Only surface chunk counts when the audio was
// actually split.
const buildTranscribeProgressMessage = (
  completed: number,
  total: number | null
) =>
  total !== null && total > 1
    ? `轉錄中, 已完成 ${completed} / ${total} 段音檔...`
    : "轉錄中...";

type StreamAction = StreamEvent | { type: "RESET" };

const streamReducer = (
  state: StreamState,
  action: StreamAction
): StreamState => {
  if (action.type === "RESET") {
    return initialStreamState;
  }

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
      return {
        ...state,
        transcribePhase: eventType,
        progressMessage: buildTranscribeProgressMessage(0, totalChunksNumber),
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

      return {
        ...state,
        transcribePhase: eventType,
        progressMessage: buildTranscribeProgressMessage(
          sortedUpdatedChunks.length,
          state.totalChunksNumber
        ),
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
    case TranscribeStreamEventType.REFINING:
      return {
        ...state,
        transcribePhase: eventType,
        transcriptInProgress: payload.consolidated_text,
        progressMessage: "正在潤飾文字...",
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

  const resetStream = () => dispatchStreamEvent({ type: "RESET" });

  return {
    transcribeProgressMessage: streamState.progressMessage,
    transcribePhase: streamState.transcribePhase,
    transcribeReceivedChunks: streamState.receivedChunks,
    transcriptInProgress: streamState.transcriptInProgress,
    dispatchStreamEvent,
    resetStream,
  };
};
