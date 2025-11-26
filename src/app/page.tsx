"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/src/components/layout/Header";
import RecordingControls from "@/src/components/recording/RecordingControls";
import TranscriptionResult from "@/src/components/transcription/TranscriptionResult";
import TranscribeModeSelector from "@/src/components/transcription/TranscribeModeSelector";
import SettingsModal from "@/src/components/modal/SettingsModal";
import PrimaryButton from "@/src/components/buttons/PrimaryButton";
import { ConfirmModal } from "@/src/components/modal/ConfirmModal";
import { useMediaRecorder } from "@/src/hooks/useMediaRecorder";
import { useAudioBlob } from "@/src/hooks/useAudioBlob";
import { useTranscription } from "@/src/hooks/useTranscription";
import { userService } from "@/src/services/user";
import { DEFAULT_MODE } from "@/src/constants";
import { TranscribeMode, AppStatus } from "@/src/types";

const SUPPORT_MESSAGE =
  "瀏覽器不支援或未授權使用麥克風，請改用最新版本的 Chrome。";
const NO_KEY_MESSAGE = "請先設定 OpenAI API Key 才能使用轉錄功能。";

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [storedApiKey, setStoredApiKey] = useState<string | null>(null);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [transcribeMode, setTranscribeMode] =
    useState<TranscribeMode>(DEFAULT_MODE);
  const [appStatus, setAppStatus] = useState<AppStatus>("idle");

  const {
    audioBlob,
    setAudioBlob,
    retryBlob,
    setRetryBlob,
    handleUploadAudio,
    clearBlob,
  } = useAudioBlob();

  const {
    transcriptionText,
    error: transcriptionError,
    transcribe,
    setTranscriptionText,
    clearTranscription,
  } = useTranscription();

  // Transcribe the given blob (shared logic for recording and upload)
  const transcribeAudioBlob = useCallback(
    async (blob: Blob, duration?: number) => {
      // Check if API key is set// Check if API key is set
      if (!storedApiKey) {
        handleOpenSettings();
        return;
      }

      try {
        setAppStatus("transcribing");
        await transcribe({
          audio_file: blob,
          openai_api_key: storedApiKey!,
          transcribe_mode: transcribeMode,
          audio_duration:
            duration && duration > 0 ? duration.toFixed(2) : undefined,
        });
        setAppStatus("transcription-completed");
        clearBlob();
      } catch (error) {
        console.error("Transcription failed:", error);
        setRetryBlob(blob);
        setAppStatus("transcription-error");
      }
    },
    [storedApiKey, transcribeMode, transcribe, setRetryBlob, clearBlob]
  );

  // Called by useMediaRecorder when recording is complete
  const handleRecordingCompletedAndTranscribe = useCallback(
    async (blob: Blob, duration: number) => {
      setAudioBlob(blob);

      // If no API key, just save the blob and wait
      if (!storedApiKey) {
        setAppStatus("audio-ready");
        return;
      }

      // Otherwise, immediately start transcribing
      await transcribeAudioBlob(blob, duration);
    },
    [setAudioBlob, storedApiKey, transcribeAudioBlob]
  );

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
  });

  useEffect(() => {
    if (!navigator.mediaDevices) {
      setIsUnsupported(true);
    }

    const key = userService.getApiKey();
    if (key) {
      setStoredApiKey(key);
      setApiKeyInput(key);
    } else {
      setIsSettingsOpen(true);
    }
  }, []);

  const handleOpenSettings = () => {
    setApiKeyInput(storedApiKey ?? "");
    setIsSettingsOpen(true);
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      return;
    }
    userService.setApiKey(apiKeyInput.trim());
    setStoredApiKey(apiKeyInput.trim());
    setIsSettingsOpen(false);
  };

  const handleCompleteRecording = useCallback(() => {
    // Stop recording (will trigger onRecordingComplete callback)
    if (appStatus === "recording" || appStatus === "paused") {
      stopMediaRecorder();
    }
  }, [storedApiKey, appStatus, stopMediaRecorder, handleOpenSettings]);

  const handleDiscardRecording = useCallback(() => {
    discardMediaRecorder();
    clearBlob();
    setAppStatus("idle");
  }, [discardMediaRecorder, clearBlob]);

  const handleStartRecording = useCallback(() => {
    startMediaRecorder();
    setAppStatus("recording");
  }, [startMediaRecorder]);

  const handlePauseRecording = useCallback(() => {
    pauseMediaRecorder();
    setAppStatus("paused");
  }, [pauseMediaRecorder]);

  const handleResumeRecording = useCallback(() => {
    resumeMediaRecorder();
    setAppStatus("recording");
  }, [resumeMediaRecorder]);

  // Handle file upload - show preview first, let user decide to transcribe
  const handleUploadAudioWrapper = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const { success } = handleUploadAudio(event);
      if (!success) return;

      setAppStatus("audio-ready");
    },
    [handleUploadAudio, setAppStatus]
  );

  const handleStartNextRecording = useCallback(() => {
    startMediaRecorder();
    setAppStatus("recording");
  }, [startMediaRecorder]);

  const handleResetAll = useCallback(() => {
    setIsConfirmResetOpen(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    clearBlob();
    clearTranscription();
    setAppStatus("idle");
    setIsConfirmResetOpen(false);
  }, [clearBlob, clearTranscription]);

  // Start transcription for uploaded audio
  const handleUploadedAudioTranscribe = useCallback(async () => {
    if (!audioBlob || !storedApiKey) return;
    await transcribeAudioBlob(audioBlob);
  }, [audioBlob, storedApiKey, transcribeAudioBlob]);

  // Discard uploaded audio
  const handleUploadedAudioDiscard = useCallback(() => {
    clearBlob();
    setAppStatus("idle");
  }, [clearBlob]);

  // Retry transcription after error
  const handleRetryTranscription = useCallback(async () => {
    if (!retryBlob || !storedApiKey) return;
    await transcribeAudioBlob(retryBlob);
  }, [retryBlob, storedApiKey, transcribeAudioBlob]);

  const handleReRecord = useCallback(() => {
    clearBlob();
    clearTranscription();
    setAppStatus("idle");
  }, [clearBlob, clearTranscription]);

  const isApiKeyMissing = !storedApiKey;

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <section className="shrink-0 border-b border-slate-800 px-4 sm:px-6 md:px-8 lg:px-12 py-4">
        <Header onOpenSettings={handleOpenSettings} />
      </section>

      <section className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 min-h-0">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          {isUnsupported && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-sm text-red-200">
              {SUPPORT_MESSAGE}
            </div>
          )}

          {!isUnsupported && isApiKeyMissing && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-yellow-100">
              <span>{NO_KEY_MESSAGE}</span>
              <PrimaryButton label="開啟設定" onClick={handleOpenSettings} />
            </div>
          )}

          <TranscriptionResult
            text={transcriptionText ?? ""}
            onChange={setTranscriptionText}
          />
        </div>
      </section>

      {/* Recording Controls - Fixed at bottom */}
      <section className="shrink-0 px-4 sm:px-6 md:px-8 lg:px-12 py-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-0.5">
          <div className="flex justify-end">
            <TranscribeModeSelector
              value={transcribeMode}
              onModeChange={setTranscribeMode}
              disabled={
                appStatus === "recording" || appStatus === "transcribing"
              }
            />
          </div>
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 min-h-[100px] flex items-center">
            <RecordingControls
              appStatus={appStatus}
              duration={duration}
              onStartRecording={handleStartRecording}
              onPauseRecording={handlePauseRecording}
              onResumeRecording={handleResumeRecording}
              onCompleteRecording={handleCompleteRecording}
              onDiscardRecording={handleDiscardRecording}
              onUploadAudio={handleUploadAudioWrapper}
              onStartTranscription={handleUploadedAudioTranscribe}
              onDiscardAudio={handleUploadedAudioDiscard}
              onStartNextRecording={handleStartNextRecording}
              onResetAll={handleResetAll}
              onRetryTranscription={handleRetryTranscription}
              onReRecord={handleReRecord}
              transcriptionError={transcriptionError}
              mediaStream={mediaStreamRef?.current ?? null}
              audioBlob={audioBlob}
              getPreviewBlob={getPreviewBlob}
            />
          </div>
        </div>
      </section>

      <SettingsModal
        isOpen={isSettingsOpen}
        apiKey={apiKeyInput}
        onApiKeyChange={setApiKeyInput}
        onSave={handleSaveApiKey}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ConfirmModal
        isOpen={isConfirmResetOpen}
        message="確定要清除所有內容並重新開始嗎？"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsConfirmResetOpen(false)}
      />
    </div>
  );
}
