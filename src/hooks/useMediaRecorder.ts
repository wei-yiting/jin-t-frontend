import { useEffect, useRef, useCallback } from "react";
import { useRecordingTimer } from "./useRecordingTimer";

interface UseMediaRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
}

export const useMediaRecorder = ({
  onRecordingComplete,
}: UseMediaRecorderProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const finalDurationRef = useRef<number>(0); // Store duration when recording completes

  const {
    duration,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  } = useRecordingTimer();

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          console.log("[Mobile Debug - MediaRecorder] onstop called", {
            hasChunks: chunksRef.current.length > 0,
            duration: finalDurationRef.current,
          });
          const mimeType = mediaRecorderRef.current?.mimeType ?? "audio/webm";
          const blob = new Blob(chunksRef.current, { type: mimeType });
          onRecordingComplete?.(blob, finalDurationRef.current);
          chunksRef.current = [];
        };
      } catch (err) {
        console.error(err);
      }
    })();
  }, [onRecordingComplete]);

  const startMediaRecorder = useCallback(() => {
    chunksRef.current = [];

    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.start(100); // Collect data every 100ms for smoother waveform
    startTimer();
  }, [startTimer]);

  const pauseMediaRecorder = useCallback(() => {
    console.log("[Mobile Debug - MediaRecorder] pauseMediaRecorder called");
    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.pause();
    pauseTimer();
  }, [pauseTimer]);

  const resumeMediaRecorder = useCallback(() => {
    console.log("[Mobile Debug - MediaRecorder] resumeMediaRecorder called");
    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.resume();
    resumeTimer();
  }, [resumeTimer]);

  const stopMediaRecorder = useCallback(() => {
    console.log("[Mobile Debug - MediaRecorder] stopMediaRecorder called");
    if (!mediaRecorderRef.current) {
      return;
    }

    // Get duration from stopTimer and store it for use in onstop callback
    finalDurationRef.current = stopTimer();
    mediaRecorderRef.current.stop();
  }, [stopTimer]);

  const discardMediaRecorder = useCallback(() => {
    console.log("[Mobile Debug - MediaRecorder] discardMediaRecorder called");
    resetTimer();

    if (!mediaRecorderRef.current) {
      chunksRef.current = [];
      return;
    }

    const originalOnStop = mediaRecorderRef.current.onstop;
    mediaRecorderRef.current.onstop = null;
    mediaRecorderRef.current.stop();

    setTimeout(() => {
      mediaRecorderRef.current!.onstop = originalOnStop;
      chunksRef.current = [];
    }, 0);
  }, [resetTimer]);

  // Get preview blob from current chunks (used when paused)
  const getPreviewBlob = useCallback((): Blob | null => {
    if (chunksRef.current.length === 0) {
      return null;
    }
    const mimeType = mediaRecorderRef.current?.mimeType ?? "audio/webm";
    return new Blob(chunksRef.current, { type: mimeType });
  }, []);

  return {
    startMediaRecorder,
    pauseMediaRecorder,
    resumeMediaRecorder,
    stopMediaRecorder,
    discardMediaRecorder,
    duration,
    mediaStreamRef: streamRef,
    getPreviewBlob,
  };
};
