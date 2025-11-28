import { useEffect, useRef, useCallback } from "react";
import { useRecordingTimer } from "./useRecordingTimer";

interface UseMediaRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onRecordingError: (error: string) => void;
}

export const useMediaRecorder = ({
  onRecordingComplete,
  onRecordingError,
}: UseMediaRecorderProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const finalDurationRef = useRef<number>(0); // Store duration when recording completes
  const shouldCallOnCompleteRef = useRef<boolean>(true); // Flag to control if onstop should trigger callback
  const cleanupFnsRef = useRef<(() => void)[]>([]); // Store cleanup functions for event listeners

  const {
    duration,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  } = useRecordingTimer();

  // Cleanup existing instances and event listeners
  const cleanupExistingInstancesAndEventListeners = useCallback(() => {
    // Execute all cleanup functions to remove event listeners
    cleanupFnsRef.current.forEach((cleanup) => cleanup());
    cleanupFnsRef.current = [];

    // Stop and cleanup MediaRecorder
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }

    // Stop and cleanup media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(
    function cleanupOnUnmount() {
      return () => {
        cleanupExistingInstancesAndEventListeners();
      };
    },
    [cleanupExistingInstancesAndEventListeners]
  );

  // Setup audio track ended event listeners
  // This handles the case where mobile browsers (especially Safari) automatically
  // stop audio tracks due to resource management (e.g., when paused for too long).
  // This prevents sending corrupted/empty audio to transcription
  // and notify the user to restart recording.
  const setupAudioTrackListeners = useCallback(
    (stream: MediaStream) => {
      const handleTrackEnded = () => {
        shouldCallOnCompleteRef.current = false; // Set flag to prevent sending corrupted audio
        mediaRecorderRef.current = null; // Reset MediaRecorder
        streamRef.current = null; // Reset stream
        onRecordingError("錄音裝置連線中斷，請重新開始錄音");
      };

      stream.getAudioTracks().forEach((track) => {
        track.addEventListener("ended", handleTrackEnded);
        cleanupFnsRef.current.push(() => {
          track.removeEventListener("ended", handleTrackEnded);
        });
      });
    },
    [onRecordingError]
  );

  const setupDataAvailableListener = useCallback((recorder: MediaRecorder) => {
    const handleDataAvailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.addEventListener("dataavailable", handleDataAvailable);
    cleanupFnsRef.current.push(() => {
      recorder.removeEventListener("dataavailable", handleDataAvailable);
    });
  }, []);

  const setupStopListener = useCallback(
    (recorder: MediaRecorder) => {
      const handleStop = () => {
        const totalSize = chunksRef.current.reduce(
          (acc, chunk) => acc + (chunk as Blob).size,
          0
        );

        // Only call onRecordingComplete if:
        // 1. Not discarded (shouldCallOnComplete is true)
        // 2. Has valid audio data (totalSize > 100 bytes - minimum valid audio file)
        if (shouldCallOnCompleteRef.current && totalSize > 100) {
          const mimeType = mediaRecorderRef.current?.mimeType ?? "audio/webm";
          const blob = new Blob(chunksRef.current, { type: mimeType });
          onRecordingComplete(blob, finalDurationRef.current);
        } else if (shouldCallOnCompleteRef.current && totalSize <= 100) {
          onRecordingError(
            "錄音檔案過小或損毀，請確認麥克風正常運作後重新錄音"
          );
        }

        chunksRef.current = [];
        shouldCallOnCompleteRef.current = true; // Reset flag
      };

      recorder.addEventListener("stop", handleStop);
      cleanupFnsRef.current.push(() => {
        recorder.removeEventListener("stop", handleStop);
      });
    },
    [onRecordingComplete, onRecordingError]
  );

  // Setup MediaRecorder with stream and event listeners
  const setupMediaRecorder = useCallback(async () => {
    try {
      // Cleanup before creating new ones
      cleanupExistingInstancesAndEventListeners();

      // Create new stream and MediaRecorder
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);

      // Setup all event listeners
      setupAudioTrackListeners(stream);
      setupDataAvailableListener(mediaRecorderRef.current);
      setupStopListener(mediaRecorderRef.current);

      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  }, [
    cleanupExistingInstancesAndEventListeners,
    setupAudioTrackListeners,
    setupDataAvailableListener,
    setupStopListener,
  ]);

  const startMediaRecorder = useCallback(async () => {
    chunksRef.current = [];
    shouldCallOnCompleteRef.current = true; // Enable callback

    // Setup MediaRecorder if not exists (first time or after track ended)
    if (!mediaRecorderRef.current) {
      const result = await setupMediaRecorder();
      if (!result.success || !mediaRecorderRef.current) {
        onRecordingError("無法啟動麥克風，請檢查瀏覽器權限設定或重新整理頁面");
        return { success: false };
      }
    }

    try {
      mediaRecorderRef.current.start(100); // Collect data every 100ms for smoother waveform
      startTimer();
      return { success: true };
    } catch {
      onRecordingError("錄音啟動失敗，請重新整理頁面後再試");
      return { success: false };
    }
  }, [startTimer, setupMediaRecorder, onRecordingError]);

  const pauseMediaRecorder = useCallback(() => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== "recording"
    ) {
      return;
    }

    mediaRecorderRef.current.pause();
    pauseTimer();
  }, [pauseTimer]);

  const resumeMediaRecorder = useCallback(() => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== "paused"
    ) {
      return;
    }

    mediaRecorderRef.current.resume();
    resumeTimer();
  }, [resumeTimer]);

  const stopMediaRecorder = useCallback(() => {
    if (
      !mediaRecorderRef.current ||
      (mediaRecorderRef.current.state !== "recording" &&
        mediaRecorderRef.current.state !== "paused")
    ) {
      return;
    }

    // Get duration from stopTimer and store it for use in onstop callback
    finalDurationRef.current = stopTimer();
    shouldCallOnCompleteRef.current = true; // Ensure callback is enabled for normal stop
    mediaRecorderRef.current.stop();
  }, [stopTimer]);

  const discardMediaRecorder = useCallback(() => {
    resetTimer();
    shouldCallOnCompleteRef.current = false; // Disable callback for this stop

    if (!mediaRecorderRef.current) {
      chunksRef.current = [];
      return;
    }

    // Only stop if currently recording or paused
    if (
      mediaRecorderRef.current.state === "recording" ||
      mediaRecorderRef.current.state === "paused"
    ) {
      // Stop the recorder - onstop will be called but won't trigger callback due to shouldCallOnCompleteRef flag
      mediaRecorderRef.current.stop();
    } else {
      // Already stopped, just clear chunks
      chunksRef.current = [];
    }
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
