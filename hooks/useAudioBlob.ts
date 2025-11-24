import { useState, useEffect, useMemo } from "react";

export const useAudioBlob = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const audioUrl = useMemo(() => {
    if (!audioBlob) {
      return null;
    }
    return URL.createObjectURL(audioBlob);
  }, [audioBlob]);

  useEffect(() => {
    if (!audioUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleUploadAudio = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      const blob = new Blob([file], { type: file.type });
      setAudioBlob(blob);
    }
  };

  return {
    audioBlob,
    setAudioBlob,
    audioUrl,
    handleUploadAudio,
  };
};
