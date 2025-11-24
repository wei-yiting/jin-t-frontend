import { useState, useEffect, useRef, useCallback } from "react";
import { RecordingStatus } from "@/types";
import { useRecordingTimer } from "./useRecordingTimer";

interface UseMediaRecorderProps {
  onRecordingCompleted?: (blob: Blob) => void;
  onChunkAvailable?: (data: Blob) => void;
}

export const useMediaRecorder = ({
  onRecordingCompleted,
  onChunkAvailable,
}: UseMediaRecorderProps = {}) => {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [error, setError] = useState<Error | null>(null);
  const {
    duration,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  } = useRecordingTimer();

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
          onChunkAvailable?.(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        onRecordingCompleted?.(blob);
        chunksRef.current = [];
      };

      setMediaRecorder(recorder);
      return recorder;
    } catch (err) {
      const normalizedError =
        err instanceof Error
          ? err
          : new Error("Failed to initialize media recorder");
      setError(normalizedError);
      return null;
    }
  }, [onRecordingCompleted, onChunkAvailable]);

  useEffect(() => {
    initializeRecorder();
  }, [initializeRecorder]);

  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    const recorder = mediaRecorder || (await initializeRecorder());

    if (recorder && recorder.state === "inactive") {
      recorder.start(100); // Collect data every 100ms for smoother waveform
      setStatus("recording");
      startTimer();
    }
  }, [initializeRecorder, mediaRecorder, startTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      pauseTimer();
      setStatus("paused");
    }
  }, [mediaRecorder, pauseTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      resumeTimer();
      setStatus("recording");
    }
  }, [mediaRecorder, resumeTimer]);

  const completeRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      stopTimer();
      mediaRecorder.stop();
      setStatus("idle");
    }
  }, [mediaRecorder, stopTimer]);

  const discardRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      const originalOnStop = mediaRecorder.onstop;
      mediaRecorder.onstop = null;

      mediaRecorder.stop();

      setTimeout(() => {
        if (mediaRecorder) mediaRecorder.onstop = originalOnStop;
        chunksRef.current = [];
      }, 0);

      setStatus("idle");
      resetTimer();
    } else {
      // If recorder already inactive, ensure timer/state reset
      setStatus("idle");
      resetTimer();
      chunksRef.current = [];
    }
  }, [mediaRecorder, resetTimer]);

  return {
    status,
    startRecording,
    pauseRecording,
    resumeRecording,
    completeRecording,
    discardRecording,
    error,
    duration,
    mediaRecorder,
  };
};
