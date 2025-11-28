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
  const shouldCallOnCompleteRef = useRef<boolean>(true); // Flag to control if onstop should trigger callback

  const {
    duration,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  } = useRecordingTimer();

  const setupMediaRecorder = useCallback(async () => {
    try {
      console.log("[Mobile Debug - MediaRecorder] Setting up MediaRecorder");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);

      // Monitor track ended event
      stream.getAudioTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          console.error(
            "[Mobile Debug - MediaRecorder] Track ended unexpectedly, will recreate on next start"
          );
          mediaRecorderRef.current = null;
          streamRef.current = null;
        });
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log("[Mobile Debug - MediaRecorder] onstop called", {
          hasChunks: chunksRef.current.length > 0,
          duration: finalDurationRef.current,
          shouldCallOnComplete: shouldCallOnCompleteRef.current,
        });

        // Only call onRecordingComplete if not discarded
        if (shouldCallOnCompleteRef.current) {
          const mimeType = mediaRecorderRef.current?.mimeType ?? "audio/webm";
          const blob = new Blob(chunksRef.current, { type: mimeType });
          onRecordingComplete(blob, finalDurationRef.current);
        }

        chunksRef.current = [];
        shouldCallOnCompleteRef.current = true; // Reset flag
      };

      console.log("[Mobile Debug - MediaRecorder] Setup complete");
    } catch (err) {
      console.error("[Mobile Debug - MediaRecorder] Setup failed:", err);
    }
  }, [onRecordingComplete]);

  useEffect(() => {
    setupMediaRecorder();
  }, [setupMediaRecorder]);

  const startMediaRecorder = useCallback(async () => {
    console.log("[Mobile Debug - MediaRecorder] startMediaRecorder called", {
      hasMediaRecorder: !!mediaRecorderRef.current,
      hasStream: !!streamRef.current,
      streamActive: streamRef.current
        ? streamRef.current.getAudioTracks()[0]?.enabled &&
          streamRef.current.getAudioTracks()[0]?.readyState === "live"
        : false,
    });

    chunksRef.current = [];
    shouldCallOnCompleteRef.current = true; // Enable callback

    // Check if MediaRecorder is valid and stream is active
    const streamActive =
      streamRef.current &&
      streamRef.current.getAudioTracks().length > 0 &&
      streamRef.current.getAudioTracks()[0].readyState === "live";

    if (!mediaRecorderRef.current || !streamActive) {
      console.log(
        "[Mobile Debug - MediaRecorder] MediaRecorder or stream invalid, recreating..."
      );
      await setupMediaRecorder();
    }

    if (!mediaRecorderRef.current) {
      console.error(
        "[Mobile Debug - MediaRecorder] Failed to create MediaRecorder"
      );
      return;
    }

    try {
      mediaRecorderRef.current.start(100); // Collect data every 100ms for smoother waveform
      startTimer();
      console.log("[Mobile Debug - MediaRecorder] Started successfully");
    } catch (err) {
      console.error("[Mobile Debug - MediaRecorder] Failed to start:", err);
    }
  }, [startTimer, setupMediaRecorder]);

  const pauseMediaRecorder = useCallback(() => {
    console.log("[Mobile Debug - MediaRecorder] pauseMediaRecorder called", {
      state: mediaRecorderRef.current?.state,
    });
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== "recording"
    ) {
      console.log(
        "[Mobile Debug - MediaRecorder] Cannot pause - not in recording state"
      );
      return;
    }

    mediaRecorderRef.current.pause();
    pauseTimer();
  }, [pauseTimer]);

  const resumeMediaRecorder = useCallback(() => {
    console.log("[Mobile Debug - MediaRecorder] resumeMediaRecorder called", {
      state: mediaRecorderRef.current?.state,
    });
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== "paused"
    ) {
      console.log(
        "[Mobile Debug - MediaRecorder] Cannot resume - not in paused state"
      );
      return;
    }

    mediaRecorderRef.current.resume();
    resumeTimer();
  }, [resumeTimer]);

  const stopMediaRecorder = useCallback(() => {
    console.log("[Mobile Debug - MediaRecorder] stopMediaRecorder called", {
      state: mediaRecorderRef.current?.state,
    });
    if (
      !mediaRecorderRef.current ||
      (mediaRecorderRef.current.state !== "recording" &&
        mediaRecorderRef.current.state !== "paused")
    ) {
      console.log(
        "[Mobile Debug - MediaRecorder] Cannot stop - not in recording/paused state"
      );
      return;
    }

    // Get duration from stopTimer and store it for use in onstop callback
    finalDurationRef.current = stopTimer();
    shouldCallOnCompleteRef.current = true; // Ensure callback is enabled for normal stop
    mediaRecorderRef.current.stop();
  }, [stopTimer]);

  const discardMediaRecorder = useCallback(() => {
    console.log("[Mobile Debug - MediaRecorder] discardMediaRecorder called", {
      state: mediaRecorderRef.current?.state,
    });
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
