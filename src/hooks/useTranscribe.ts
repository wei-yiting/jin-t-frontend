import { useRef, useState, useEffect, useCallback } from "react";
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

export const useTranscribe = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progressCode, setProgressCode] = useState<TaskProgressCode | null>(
    null
  );
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      setError(
        "如果不想用自己的 OpenAI API Key ，在設定中勾選同意我們蒐集您資料優化晶晶體，也可以免費使用晶晶體語音轉文字功能！"
      );
      return false;
    }

    if (isUsingPersonalApiKey && !hasPersonalApiKey) {
      setError(
        "您勾選了使用自己的 OpenAI API Key ，但尚未設定，請先設定 OpenAI API Key；如果不想用自己的 OpenAI API Key ，在設定中勾選同意我們蒐集您資料優化晶晶體，也可以免費使用晶晶體語音轉文字功能喔！"
      );
      return false;
    }

    if (audioFile.size > MAX_AUDIO_FILE_SIZE) {
      setError("音檔大小超過 25MB，請重新錄音");
      return false;
    }

    if (!isUsingPersonalApiKey && duration > FREE_TIER_MAX_AUDIO_DURATION) {
      setError("免費方案每次錄音最長 10 分鐘，請重新錄音");
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
            status,
            progress_code: receivedProgressCode,
            message: receivedMessage,
            error_detail,
            transcript: receivedTranscript,
          } = await transcribeService.getTranscribeProgress(taskId);

          if (status === TaskStatus.COMPLETED) {
            setTranscriptText((prev) =>
              prev ? prev + "\n" + receivedTranscript : receivedTranscript
            );
            return;
          }

          if (status === TaskStatus.FAILED) {
            setError(error_detail);
            return;
          }

          //Transcribe status is either queued or processing, setup another request to poll again
          pollAttemptsRef.current++;
          const interval = getAdaptivePollingInterval(pollAttemptsRef.current);
          pollTimeoutRef.current = setTimeout(poll, interval);

          setProgressMessage((prev) => receivedMessage || prev);
          setProgressCode((prev) => receivedProgressCode || prev);

          console.log(
            `Already ${pollAttemptsRef.current} attempts, polling transcribe progress again in ${interval}ms...`
          );
        } catch (err: unknown) {
          retryAttemptsRef.current++;

          if (retryAttemptsRef.current > MAX_RETRY_ATTEMPTS) {
            throw err;
          }

          pollTimeoutRef.current = setTimeout(poll, RETRY_INTERVAL);

          console.log(
            `Already ${retryAttemptsRef.current} attempts, retrying transcribe in ${RETRY_INTERVAL}ms...`
          );
        }
      };

      poll();
    },
    [setTranscriptText, setError]
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
      setError(null);

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
        setError(errorMessage);
      } finally {
        setIsTranscribing(false);
      }
    },
    [adaptivePollingTranscribeResult]
  );

  const clearTranscript = useCallback(() => {
    setTranscriptText(null);
    setError(null);
  }, []);

  const setManualTranscript = useCallback((value: string) => {
    setTranscriptText(value);
    setError(null);
  }, []);

  return {
    isTranscribing,
    transcribeProgressCode: progressCode,
    transcribeProgressMessage: progressMessage,
    transcriptText,
    transcribeError: error,
    transcribe,
    clearTranscript,
    setTranscriptText: setManualTranscript,
    setTranscribeError: setError,
  };
};
