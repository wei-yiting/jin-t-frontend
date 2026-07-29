import { useState, useCallback, useEffect } from "react";

import { DEFAULT_MODE } from "@/src/constants";
import { AppStatus, TranscribeMode } from "@/src/types";
import { useMediaRecorder, useAudioBlob } from "@/src/hooks";
import { userService } from "@/src/services/userService";
import { useTranscribeContext } from "@/src/contexts";
import TranscribeModeSelector from "../transcribe/TranscribeModeSelector";
import RecordingControls from "../recording/RecordingControls";
import CopyTranscriptButton from "../buttons/CopyTranscriptButton";
import ConfirmModal from "../modal/ConfirmModal";
import TranscribeProgressLoader from "../transcribe/TranscribeProgressLoader";

interface ControlBarProps {
  disaplyRecordingError: (error: string) => void;
  clearRecordingError: () => void;
  displayCompleteSettingsReminder: () => void;
}

export default function ControlBar({
  disaplyRecordingError,
  clearRecordingError,
  displayCompleteSettingsReminder,
}: ControlBarProps) {
  const {
    isTranscribing,
    transcriptText,
    transcribe,
    setTranscribeError,
    clearTranscript,
    transcribeProgressMessage,
    transcribePhase,
  } = useTranscribeContext();
  const [controlBarStatus, setControlBarStatus] = useState<AppStatus>("idle");
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [transcribeMode, setTranscribeMode] =
    useState<TranscribeMode>(DEFAULT_MODE);

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/f35e24fa-e6e7-428f-a9d6-25a05c1c60f1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "ControlBar.tsx:state",
        message: "ui:controlbar",
        data: {
          isTranscribing,
          controlBarStatus,
          transcribePhase,
          progressMessageLength: transcribeProgressMessage?.length ?? 0,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "pre-fix",
        hypothesisId: "H6",
      }),
    }).catch(() => {});
    // #endregion
  }, [isTranscribing, controlBarStatus, transcribePhase, transcribeProgressMessage]);

  const {
    audioBlob,
    setAudioBlob,
    retryBlob,
    setRetryBlob,
    handleUploadAudio,
    clearBlob,
  } = useAudioBlob();

  // Transcribe the given blob (shared logic for recording and upload)
  const transcribeAudioBlob = useCallback(
    async (audioBlob: Blob, audioDuration?: number) => {
      try {
        setControlBarStatus("transcribing");
        await transcribe(
          audioBlob,
          transcribeMode,
          audioDuration ? audioDuration : null
        );
        setControlBarStatus("transcribed");
        clearBlob();
      } catch (error) {
        setRetryBlob(audioBlob);
        setControlBarStatus("transcribe-error");
      }
    },
    [transcribeMode, transcribe, setRetryBlob, clearBlob, userService]
  );

  // Called by useMediaRecorder when recording is complete
  const handleRecordingCompletedAndTranscribe = useCallback(
    async (blob: Blob, duration: number) => {
      setAudioBlob(blob);

      // If no API key, just save the blob and wait
      if (!userService.checkHasPersonalApiKey()) {
        setControlBarStatus("audio-ready");
        return;
      }

      // Otherwise, immediately start transcribing
      await transcribeAudioBlob(blob, duration);
    },
    [setAudioBlob, transcribeAudioBlob, userService]
  );

  // Handle recording errors from useMediaRecorder
  const handleRecordingError = useCallback((error: string) => {
    disaplyRecordingError(error);
    setControlBarStatus("idle");
  }, []);

  const {
    startMediaRecorder,
    pauseMediaRecorder,
    resumeMediaRecorder,
    stopMediaRecorder,
    discardMediaRecorder,
    duration,
    mediaStreamRef,
    getPreviewBlob,
  } = useMediaRecorder({
    onRecordingComplete: handleRecordingCompletedAndTranscribe,
    onRecordingError: handleRecordingError,
  });

  const handleCompleteRecording = useCallback(() => {
    // Stop recording (will trigger onRecordingComplete callback)
    if (controlBarStatus === "recording" || controlBarStatus === "paused") {
      stopMediaRecorder();
    }
  }, [controlBarStatus, stopMediaRecorder]);

  const handleDiscardRecording = useCallback(() => {
    discardMediaRecorder();
    clearBlob();
    disaplyRecordingError(null);
    setControlBarStatus("idle");
  }, [discardMediaRecorder, clearBlob]);

  const handleStartRecording = useCallback(async () => {
    clearRecordingError();
    const { success } = await startMediaRecorder();
    if (success) {
      setControlBarStatus("recording");
    }
  }, [startMediaRecorder]);

  const handlePauseRecording = useCallback(() => {
    pauseMediaRecorder();
    setControlBarStatus("paused");
  }, [pauseMediaRecorder]);

  const handleResumeRecording = useCallback(() => {
    resumeMediaRecorder();
    setControlBarStatus("recording");
  }, [resumeMediaRecorder]);

  // Handle file upload - show preview first, let user decide to transcribe
  const handleUploadAudioWrapper = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const { success } = handleUploadAudio(event);
      if (!success) return;

      setControlBarStatus("audio-ready");
    },
    [handleUploadAudio, setControlBarStatus]
  );

  const handleStartNextRecording = useCallback(async () => {
    setTranscribeError(null); // Clear previous errors
    const { success } = await startMediaRecorder();
    if (success) {
      setControlBarStatus("recording");
    }
  }, [startMediaRecorder]);

  // Start transcript for uploaded audio
  const handleUploadedAudioTranscribe = useCallback(async () => {
    if (!audioBlob) return;
    if (!userService.checkHasPersonalApiKey()) {
      displayCompleteSettingsReminder();
      return;
    }
    await transcribeAudioBlob(audioBlob);
  }, [audioBlob, transcribeAudioBlob, userService]);

  // Discard uploaded audio
  const handleUploadedAudioDiscard = useCallback(() => {
    clearBlob();
    setControlBarStatus("idle");
  }, [clearBlob]);

  // Retry transcribe after error
  const handleRetryTranscribe = useCallback(async () => {
    if (!retryBlob) return;
    if (!userService.checkHasPersonalApiKey()) {
      displayCompleteSettingsReminder();
      return;
    }
    await transcribeAudioBlob(retryBlob);
  }, [retryBlob, transcribeAudioBlob, userService]);

  const handleReRecord = useCallback(() => {
    clearBlob();
    clearTranscript();
    setControlBarStatus("idle");
  }, [clearBlob, clearTranscript]);

  const handleConfirmReset = useCallback(() => {
    clearBlob();
    clearTranscript();
    setControlBarStatus("idle");
    setIsConfirmResetOpen(false);
  }, [clearBlob, clearTranscript]);

  return (
    <>
      <div className="max-w-5xl mx-auto flex flex-col gap-0.5">
        <div className="flex justify-end">
          <TranscribeModeSelector
            value={transcribeMode}
            onModeChange={setTranscribeMode}
            disabled={
              controlBarStatus === "recording" ||
              controlBarStatus === "transcribing"
            }
          />
        </div>
        <div className="bg-slate-900/40 border border-slate-800/50 sm:border-slate-700/50 rounded-xl px-3 sm:px-4 py-2 sm:py-4 sm:min-h-[100px] flex items-center gap-3 h-auto">
          {isTranscribing ? (
            <TranscribeProgressLoader />
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <RecordingControls
                  appStatus={controlBarStatus}
                  duration={duration}
                  onStartRecording={handleStartRecording}
                  onPauseRecording={handlePauseRecording}
                  onResumeRecording={handleResumeRecording}
                  onCompleteRecording={handleCompleteRecording}
                  onDiscardRecording={handleDiscardRecording}
                  onUploadAudio={handleUploadAudioWrapper}
                  onStartTranscribe={handleUploadedAudioTranscribe}
                  onDiscardAudio={handleUploadedAudioDiscard}
                  onStartNextRecording={handleStartNextRecording}
                  onResetButtonClick={() => setIsConfirmResetOpen(true)}
                  onRetryTranscribe={handleRetryTranscribe}
                  onReRecord={handleReRecord}
                  mediaStream={mediaStreamRef?.current ?? null}
                  audioBlob={audioBlob}
                  getPreviewBlob={getPreviewBlob}
                />
              </div>
              {controlBarStatus === "transcribed" && (
                <CopyTranscriptButton transcriptText={transcriptText ?? ""} />
              )}
            </>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={isConfirmResetOpen}
        message="確定要清除所有內容並重新開始嗎？"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsConfirmResetOpen(false)}
      />
    </>
  );
}
