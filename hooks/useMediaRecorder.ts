import { useEffect, useRef, useCallback } from "react";
import { useRecordingTimer } from "./useRecordingTimer";

interface UseMediaRecorderProps {
  onRecordingCompleted?: (blob: Blob) => void;
  onChunkAvailable?: (data: Blob) => void;
}

export const useMediaRecorder = ({
  onRecordingCompleted,
  onChunkAvailable,
}: UseMediaRecorderProps = {}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

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
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
            onChunkAvailable?.(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: mediaRecorderRef.current?.mimeType ?? "",
          });
          onRecordingCompleted?.(blob);
          chunksRef.current = [];
        };
      } catch (err) {
        console.error(err);
      }
    })();
  }, [onChunkAvailable, onRecordingCompleted]);

  const startRecording = useCallback(() => {
    chunksRef.current = [];

    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.start(100); // Collect data every 100ms for smoother waveform
    startTimer();
  }, [startTimer]);

  const pauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.pause();
    pauseTimer();
  }, [pauseTimer]);

  const resumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.resume();
    resumeTimer();
  }, [resumeTimer]);

  const completeRecording = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return;
    }

    stopTimer();
    mediaRecorderRef.current.stop();
  }, [stopTimer]);

  const discardRecording = useCallback(() => {
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

  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    completeRecording,
    discardRecording,
    duration,
  };
};
