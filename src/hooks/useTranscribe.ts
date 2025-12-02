import { useState, useCallback } from "react";
import { transcribeService, userService } from "@/src/services";
import { TranscribeMode, UserSettings } from "@/src/types";

const MAX_AUDIO_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const FREE_TIER_MAX_AUDIO_DURATION = 10 * 60; // 10 minutes

export const useTranscribe = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transcribe = useCallback(
    async (audioFile: Blob, mode: TranscribeMode, duration: number | null) => {
      const isUsingPersonalApiKey =
        await userService.getIsUsingPersonalApiKey();
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
        return;
      }

      if (isUsingPersonalApiKey && !hasPersonalApiKey) {
        setError(
          "您勾選了使用自己的 OpenAI API Key ，但尚未設定，請先設定 OpenAI API Key；如果不想用自己的 OpenAI API Key ，在設定中勾選同意我們蒐集您資料優化晶晶體，也可以免費使用晶晶體語音轉文字功能喔！"
        );
        return;
      }

      if(audioFile.size > MAX_AUDIO_FILE_SIZE) {
        setError("音檔大小超過 25MB，請重新錄音");
        return;
      }

      if(!isUsingPersonalApiKey && duration > FREE_TIER_MAX_AUDIO_DURATION) {
        setError("免費方案每次錄音最長 10 分鐘，請重新錄音");
        return;
      }

      setIsTranscribing(true);
      setError(null);

      try {
        const userSettings: UserSettings = {
          deviceId: await userService.getOrCreateDeviceId(),
          useOwnApiKey: isUsingPersonalApiKey,
          allowDataCollection: consentDataCollection,
          customOpenaiApiKey: isUsingPersonalApiKey
            ? await userService.getAndDecodeOpenaiApiKey()
            : null,
        };
        const transcribeResponse = await transcribeService.transcribe(
          {
            audioFile: audioFile,
            transcribeMode: mode,
            audioDuration: duration ? duration.toFixed(2) : null,
          },
          userSettings
        );
        const newText = transcribeResponse.transcript;

        setTranscriptText((prev) => {
          if (prev) {
            return prev + "\n" + newText;
          }
          return newText;
        });

        return newText;
      } catch (err: unknown) {
        const errorMessage =
          (err as { message?: string })?.message ||
          "Failed to transcribe audio";
        setError(errorMessage);
        throw err;
      } finally {
        setIsTranscribing(false);
      }
    },
    []
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
    transcriptText,
    error,
    transcribe,
    clearTranscript,
    setTranscriptText: setManualTranscript,
  };
};
