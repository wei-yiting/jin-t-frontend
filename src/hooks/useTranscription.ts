import { useState, useCallback } from "react";
import { transcriptionService } from "@/src/services/transcription";
import { TranscribeRequest } from "@/src/types";

export const useTranscription = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const transcribe = useCallback(async (request: TranscribeRequest) => {
    setIsTranscribing(true);
    setError(null);

    try {
      const response = await transcriptionService.transcribe(request);
      const newText = response.transcript;

      setTranscriptionText((prev) => {
        if (prev) {
          return prev + "\n" + newText;
        }
        return newText;
      });

      return newText;
    } catch (err: unknown) {
      const errorMessage =
        (err as { message?: string })?.message || "Failed to transcribe audio";
      setError(errorMessage);
      throw err;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const clearTranscription = useCallback(() => {
    setTranscriptionText(null);
    setError(null);
  }, []);

  const setManualTranscription = useCallback((value: string) => {
    setTranscriptionText(value);
    setError(null);
  }, []);

  return {
    isTranscribing,
    transcriptionText,
    error,
    transcribe,
    clearTranscription,
    setTranscriptionText: setManualTranscription,
  };
};
