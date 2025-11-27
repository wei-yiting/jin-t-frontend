import { useState, useCallback } from "react";
import { transcribeService } from "@/src/services/transcribe";
import { TranscribeRequest } from "@/src/types";

export const useTranscribe = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transcribe = useCallback(async (request: TranscribeRequest) => {
    setIsTranscribing(true);
    setError(null);

    try {
      const response = await transcribeService.transcribe(request);
      const newText = response.transcript;

      setTranscriptText((prev) => {
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
