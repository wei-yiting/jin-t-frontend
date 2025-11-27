import { useState, useCallback } from "react";

export const useAudioBlob = () => {
  // Main audio blob (from completed recording or upload)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Blob for retry on transcribe error
  const [retryBlob, setRetryBlob] = useState<Blob | null>(null);

  // Handle file upload
  const handleUploadAudio = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith("audio/")) {
        const blob = new Blob([file], { type: file.type });
        setAudioBlob(blob);
        return { success: true };
      }
      return { success: false };
    },
    []
  );

  // Clear all blobs
  const clearBlob = useCallback(() => {
    setAudioBlob(null);
    setRetryBlob(null);
  }, []);

  return {
    audioBlob,
    setAudioBlob,
    retryBlob,
    setRetryBlob,
    handleUploadAudio,
    clearBlob,
  };
};
