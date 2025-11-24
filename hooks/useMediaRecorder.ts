import { useState, useEffect, useRef, useCallback } from "react";
import { RecordingStatus } from "@/types";
import { useRecordingTimer } from "./useRecordingTimer";

interface UseMediaRecorderProps {
  onStop?: (blob: Blob) => void;
  onDataAvailable?: (data: Blob) => void;
}

export const useMediaRecorder = ({
  onStop,
  onDataAvailable,
}: UseMediaRecorderProps = {}) => {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [error, setError] = useState<Error | null>(null);
  const { duration, startTimer, stopTimer, resetTimer } = useRecordingTimer();

  const chunksRef = useRef<BlobPart[]>([]);

  const initializeRecorder = useCallback(async () => {
    try {
      if (!navigator.mediaDevices) {
        throw new Error("Browser does not support media devices");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          onDataAvailable?.(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        onStop?.(blob);
        chunksRef.current = [];
      };

      setMediaRecorder(recorder);
      return recorder;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to initialize media recorder");
      setError(error);
      return null;
    }
  }, [onStop, onDataAvailable]);

  // Initialize on mount
  useEffect(() => {
    initializeRecorder();
  }, [initializeRecorder]);

  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    const recorder = mediaRecorder || (await initializeRecorder());

    if (recorder && recorder.state === "inactive") {
      recorder.start(100); // Collect data every 100ms for waveform
      setStatus("recording");
      startTimer();
    }
  }, [mediaRecorder, initializeRecorder, startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      stopTimer();
      mediaRecorder.stop();
      setStatus("idle");
    }
  }, [mediaRecorder, stopTimer]);

  const discardRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      // Remove onstop listener temporarily to prevent onStop callback
      const originalOnStop = mediaRecorder.onstop;
      mediaRecorder.onstop = null;

      mediaRecorder.stop();

      // Restore listener and cleanup
      setTimeout(() => {
        if (mediaRecorder) mediaRecorder.onstop = originalOnStop;
        chunksRef.current = [];
      }, 0);

      setStatus("idle");
      resetTimer();
    }
  }, [mediaRecorder, resetTimer]);

  return {
    status,
    startRecording,
    stopRecording,
    discardRecording,
    error,
    duration,
    mediaRecorder,
  };
};
