"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { transcribeService, userService } from "@/src/services";
import {
  TranscribeMode,
  UserSettings,
  TranscribeStreamEventType,
  TaskFailedStreamEvent,
} from "@/src/types";
import {
  ReceivedChunksWithStatus,
  useTranscribeStream,
} from "@/src/hooks/useTranscribeStream";
import {
  MAX_AUDIO_FILE_SIZE,
  FREE_TIER_MAX_AUDIO_DURATION,
  TRANSCRIBE_STREAM_MAX_RETRY_ATTEMPTS,
  TRANSCRIBE_STREAM_RETRY_INTERVAL,
} from "@/src/constants";

interface TranscribeContextValue {
  isTranscribing: boolean;
  transcribeError: string | null;
  transcriptText: string | null;
  transcribeProgressMessage: string;
  transcribePhase: TranscribeStreamEventType | null;
  transcribeReceivedChunks: ReceivedChunksWithStatus[];
  transcriptInProgress: string | null;
  transcribe: (
    audioFile: Blob,
    mode: TranscribeMode,
    duration: number | null
  ) => Promise<void>;
  clearTranscript: () => void;
  setTranscriptText: (value: string) => void;
  setTranscribeError: (error: string | null) => void;
}

const TranscribeContext = createContext<TranscribeContextValue | null>(null);

export function TranscribeProvider({ children }: { children: ReactNode }) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const {
    transcribeProgressMessage,
    transcribePhase,
    transcribeReceivedChunks,
    transcriptInProgress,
    dispatchStreamEvent,
    resetStream,
  } = useTranscribeStream();
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryAttemptsRef = useRef<number>(0);
  const lastIdRef = useRef<string>("0-0");

  useEffect(function cleanupPollTimeout() {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const checkIsTranscribeAllowed = async (
    audioFile: Blob,
    duration: number | null
  ): Promise<boolean> => {
    const isUsingPersonalApiKey =
      await userService.getOrSetDefaultIsUsingPersonalApiKey();
    const hasPersonalApiKey = await userService.checkHasPersonalApiKey();
    const consentDataCollection =
      await userService.getOrSetDefaultConsentDataCollection();

    if (
      !consentDataCollection &&
      !(isUsingPersonalApiKey && hasPersonalApiKey)
    ) {
      setTranscribeError(
        "如果不想用自己的 OpenAI API Key ，在設定中勾選同意我們蒐集您資料優化晶晶體，也可以免費使用晶晶體語音轉文字功能！"
      );
      return false;
    }

    if (isUsingPersonalApiKey && !hasPersonalApiKey) {
      setTranscribeError(
        "您勾選了使用自己的 OpenAI API Key ，但尚未設定，請先設定 OpenAI API Key；如果不想用自己的 OpenAI API Key ，在設定中勾選同意我們蒐集您資料優化晶晶體，也可以免費使用晶晶體語音轉文字功能喔！"
      );
      return false;
    }

    if (audioFile.size > MAX_AUDIO_FILE_SIZE) {
      setTranscribeError("音檔大小超過 25MB，請重新錄音");
      return false;
    }

    if (!isUsingPersonalApiKey && duration > FREE_TIER_MAX_AUDIO_DURATION) {
      setTranscribeError("免費方案錄音最長 30 分鐘，請重新錄音");
      return false;
    }

    return true;
  };

  const pollTranscribeStream = useCallback(
    async (taskId: string) => {
      retryAttemptsRef.current = 0;

      return await new Promise<void>((resolve) => {
        const poll = async () => {
          try {
            const response = await transcribeService.getTranscribeProgress(
              taskId,
              lastIdRef.current
            );
            lastIdRef.current = response.last_id || lastIdRef.current;

            let shouldStop = false;
            for (const message of response.messages) {
              dispatchStreamEvent(message);

              if (message.type === TranscribeStreamEventType.TASK_FAILED) {
                setIsTranscribing(false);
                setTranscribeError(
                  (message as TaskFailedStreamEvent).payload.error ||
                    "轉錄失敗，請稍後再試"
                );
                shouldStop = true;
                break;
              }

              if (message.type === TranscribeStreamEventType.TASK_FINISHED) {
                setIsTranscribing(false);
                setTranscriptText((prev) => {
                  const finalResult = message.payload.final_result ?? "";
                  const safePrev = prev ?? "";
                  return safePrev + (safePrev ? "\n" : "") + finalResult;
                });
                shouldStop = true;
                break;
              }
            }

            if (shouldStop) {
              resolve();
              return;
            }

            // Poll immediately
            pollTimeoutRef.current = setTimeout(poll, 0);
          } catch (err: unknown) {
            const errorMessage =
              (err as { message?: string })?.message || "unknown";
            retryAttemptsRef.current++;

            if (
              retryAttemptsRef.current > TRANSCRIBE_STREAM_MAX_RETRY_ATTEMPTS
            ) {
              setIsTranscribing(false);
              setTranscribeError(errorMessage || "轉錄失敗，請稍後再試");
              resolve();
              return;
            }

            pollTimeoutRef.current = setTimeout(
              poll,
              TRANSCRIBE_STREAM_RETRY_INTERVAL
            );
          }
        };

        poll();
      });
    },
    [setTranscriptText, setTranscribeError, dispatchStreamEvent]
  );

  const transcribe = useCallback(
    async (
      audioFile: Blob,
      mode: TranscribeMode,
      duration: number | null
    ): Promise<void> => {
      const isTranscribeAllowed = await checkIsTranscribeAllowed(
        audioFile,
        duration
      );
      if (!isTranscribeAllowed) {
        return;
      }

      setIsTranscribing(true);
      setTranscribeError(null);

      const userSettings = await userService.getUserSettings();

      try {
        const usageConfig: UserSettings = {
          deviceId: userSettings.deviceId,
          useOwnApiKey: userSettings.useOwnApiKey,
          allowDataCollection: userSettings.allowDataCollection,
          encryptedCustomOpenaiApiKey: userSettings.useOwnApiKey
            ? userSettings.encryptedCustomOpenaiApiKey
            : null,
        };
        const beginTranscribeResponse = await transcribeService.beginTranscribe(
          {
            audioFile: audioFile,
            transcribeMode: mode,
            audioDuration: duration ? duration.toFixed(2) : null,
          },
          usageConfig
        );

        await pollTranscribeStream(beginTranscribeResponse.task_id);
      } catch (err: unknown) {
        setIsTranscribing(false);
        const errorMessage =
          (err as { message?: string })?.message || "轉錄失敗，請稍後再試";
        setTranscribeError(errorMessage);
      }
    },
    [pollTranscribeStream]
  );

  const clearTranscript = useCallback(() => {
    setTranscriptText(null);
    setTranscribeError(null);
    resetStream();
  }, [resetStream]);

  const setManualTranscript = useCallback((value: string) => {
    setTranscriptText(value);
    setTranscribeError(null);
  }, []);

  const value: TranscribeContextValue = {
    isTranscribing,
    transcribeError,
    transcriptText,
    transcribeProgressMessage,
    transcribePhase,
    transcribeReceivedChunks,
    transcriptInProgress,
    transcribe,
    clearTranscript,
    setTranscriptText: setManualTranscript,
    setTranscribeError,
  };

  return (
    <TranscribeContext.Provider value={value}>
      {children}
    </TranscribeContext.Provider>
  );
}

export function useTranscribeContext() {
  const context = useContext(TranscribeContext);
  if (!context) {
    throw new Error(
      "useTranscribeContext must be used within a TranscribeProvider"
    );
  }
  return context;
}
