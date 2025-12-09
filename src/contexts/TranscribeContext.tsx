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
  TaskStatus,
  TaskProgressCode,
} from "@/src/types";
import {
  MAX_AUDIO_FILE_SIZE,
  FREE_TIER_MAX_AUDIO_DURATION,
  ADAPTIVE_POLLING_INTERVAL_RULES,
  MAX_RETRY_ATTEMPTS,
  RETRY_INTERVAL,
} from "@/src/constants";

const getAdaptivePollingInterval = (attempts: number) => {
  const rule = ADAPTIVE_POLLING_INTERVAL_RULES.find(
    (rule) => attempts <= rule.maxAttempts
  );
  if (!rule) {
    throw new Error("轉錄連線超時，請稍後再試");
  }
  return rule.interval;
};

interface TranscribeContextValue {
  isTranscribing: boolean;
  transcribeTaskStatus: TaskStatus;
  transcribeProgressCode: TaskProgressCode | null;
  transcribeProgressMessage: string;
  transcriptText: string | null;
  transcribeError: string | null;
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
  const [progressCode, setProgressCode] = useState<TaskProgressCode | null>(
    null
  );
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef<number>(0);
  const retryAttemptsRef = useRef<number>(0);

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
    const isUsingPersonalApiKey = await userService.getIsUsingPersonalApiKey();
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
      setTranscribeError("免費方案每次錄音最長 10 分鐘，請重新錄音");
      return false;
    }

    return true;
  };

  const adaptivePollingTranscribeResult = useCallback(
    async (taskId: string) => {
      pollAttemptsRef.current = 0;

      const poll = async () => {
        try {
          const {
            status: receivedTaskStatus,
            progress_code: receivedProgressCode,
            message: receivedMessage,
            error_detail,
            transcript: receivedTranscript,
          } = await transcribeService.getTranscribeProgress(taskId);

          if (receivedTaskStatus === TaskStatus.COMPLETED) {
            setTaskStatus(receivedTaskStatus);
            setProgressCode(null);
            setProgressMessage("");
            setIsTranscribing(false);
            setTranscriptText((prev) =>
              prev ? prev + "\n" + receivedTranscript : receivedTranscript
            );
            return;
          }

          if (receivedTaskStatus === TaskStatus.FAILED) {
            setTaskStatus(receivedTaskStatus);
            setProgressCode(null);
            setProgressMessage("");
            setIsTranscribing(false);
            setTranscribeError(error_detail);
            return;
          }

          //Transcribe status is either queued or processing, setup another request to poll again

          pollAttemptsRef.current++;
          const interval = getAdaptivePollingInterval(pollAttemptsRef.current);
          pollTimeoutRef.current = setTimeout(poll, interval);

          setTaskStatus(receivedTaskStatus);
          setProgressMessage(receivedMessage);
          setProgressCode(receivedProgressCode);
        } catch (err: unknown) {
          retryAttemptsRef.current++;

          if (retryAttemptsRef.current > MAX_RETRY_ATTEMPTS) {
            setIsTranscribing(false);
            throw err;
          }

          pollTimeoutRef.current = setTimeout(poll, RETRY_INTERVAL);
        }
      };

      poll();
    },
    [setTranscriptText, setTranscribeError]
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
          customOpenaiApiKey: userSettings.useOwnApiKey
            ? userSettings.customOpenaiApiKey
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

        adaptivePollingTranscribeResult(beginTranscribeResponse.task_id);
      } catch (err: unknown) {
        const errorMessage =
          (err as { message?: string })?.message ||
          "Failed to poll transcribe progress";
        setTranscribeError(errorMessage);
      }
    },
    [adaptivePollingTranscribeResult]
  );

  const clearTranscript = useCallback(() => {
    setTranscriptText(null);
    setTranscribeError(null);
  }, []);

  const setManualTranscript = useCallback((value: string) => {
    setTranscriptText(value);
    setTranscribeError(null);
  }, []);

  const value: TranscribeContextValue = {
    isTranscribing,
    transcribeTaskStatus: taskStatus,
    transcribeProgressCode: progressCode,
    transcribeProgressMessage: progressMessage,
    transcriptText,
    transcribeError,
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
