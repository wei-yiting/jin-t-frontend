"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/src/components/layout/Header";
import RecordingControls from "@/src/components/recording/RecordingControls";
import TranscriptBlock from "@/src/components/transcription/TranscriptBlock";
import TranscribeModeSelector from "@/src/components/transcription/TranscribeModeSelector";
import SettingsModal from "@/src/components/modal/SettingsModal";
import PrimaryButton from "@/src/components/buttons/PrimaryButton";
import { ConfirmModal } from "@/src/components/modal/ConfirmModal";
import CopyTranscriptButton from "@/src/components/buttons/CopyTranscriptButton";
import { useMediaRecorder } from "@/src/hooks/useMediaRecorder";
import { useAudioBlob } from "@/src/hooks/useAudioBlob";
import { useTranscribe } from "@/src/hooks/useTranscribe";
import { userService } from "@/src/services/userService";
import { DEFAULT_MODE } from "@/src/constants";
import { TranscribeMode, AppStatus } from "@/src/types";

const SUPPORT_MESSAGE =
  "瀏覽器不支援或未授權使用麥克風，請改用最新版本的 Chrome。";
const NO_KEY_MESSAGE = "請先設定 OpenAI API Key 才能使用轉錄功能。";

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isMissingApiKey, setIsMissingApiKey] = useState(false);
  const [isRecorderUnsupported, setIsRecorderUnsupported] = useState(false);
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
    transcriptText,
    error: transcribeError,
    transcribe,
    setTranscriptText,
    clearTranscript,
  } = useTranscribe();

  useEffect(function ensureDeviceIdExists() {
    (async () => {
      await userService.getOrCreateDeviceId();
    })();
  }, []);

  useEffect(function checkAndSetIsRecorderUnsupported() {
    if (!navigator.mediaDevices) {
      setIsRecorderUnsupported(true);
    }
  }, []);

  useEffect(function checkAndSetIsMissingApiKey() {
    (async () => {
      const isUsingPersonalApiKey =
        await userService.getIsUsingPersonalApiKey();
      if (!isUsingPersonalApiKey) {
        return;
      }

      const hasPersonalApiKey = await userService.checkHasPersonalApiKey();
      setIsMissingApiKey(!hasPersonalApiKey);
    })();
  }, []);

  // Transcribe the given blob (shared logic for recording and upload)
  const transcribeAudioBlob = useCallback(
    async (blob: Blob, duration?: number) => {
      // Check if API key is set// Check if API key is set
      if (!userService.checkHasPersonalApiKey()) {
        setIsSettingsOpen(true);
        return;
      }

      const openaiApiKey = await userService.getAndDecodeOpenaiApiKey();

      try {
        setAppStatus("transcribing");
        await transcribe({
          audio_file: blob,
          openai_api_key: openaiApiKey,
          transcribe_mode: transcribeMode,
          audio_duration:
            duration && duration > 0 ? duration.toFixed(2) : undefined,
        });
        setAppStatus("transcribed");
        clearBlob();
      } catch (error) {
        console.error("Transcribe failed:", error);
        setRetryBlob(blob);
        setAppStatus("transcribe-error");
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
        setAppStatus("audio-ready");
        return;
      }

      // Otherwise, immediately start transcribing
      await transcribeAudioBlob(blob, duration);
    },
    [setAudioBlob, transcribeAudioBlob, userService]
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

  const handleApiKeySaved = useCallback(() => {
    setIsMissingApiKey(false);
  }, []);

  const handleCompleteRecording = useCallback(() => {
    // Stop recording (will trigger onRecordingComplete callback)
    if (appStatus === "recording" || appStatus === "paused") {
      stopMediaRecorder();
    }
  }, [appStatus, stopMediaRecorder]);

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
    clearTranscript();
    setAppStatus("idle");
    setIsConfirmResetOpen(false);
  }, [clearBlob, clearTranscript]);

  // Start transcript for uploaded audio
  const handleUploadedAudioTranscribe = useCallback(async () => {
    if (!audioBlob) return;
    if (!userService.checkHasPersonalApiKey()) {
      setIsSettingsOpen(true);
      return;
    }
    await transcribeAudioBlob(audioBlob);
  }, [audioBlob, transcribeAudioBlob, userService]);

  // Discard uploaded audio
  const handleUploadedAudioDiscard = useCallback(() => {
    clearBlob();
    setAppStatus("idle");
  }, [clearBlob]);

  // Retry transcribe after error
  const handleRetryTranscribe = useCallback(async () => {
    if (!retryBlob) return;
    if (!userService.checkHasPersonalApiKey()) {
      setIsSettingsOpen(true);
      return;
    }
    await transcribeAudioBlob(retryBlob);
  }, [retryBlob, transcribeAudioBlob, userService]);

  const handleReRecord = useCallback(() => {
    clearBlob();
    clearTranscript();
    setAppStatus("idle");
  }, [clearBlob, clearTranscript]);

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <section className="shrink-0 border-b border-slate-800 px-4 sm:px-6 md:px-8 lg:px-12 py-4">
        <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      </section>

      <section className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 min-h-0">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          {isRecorderUnsupported && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-sm text-red-200">
              {SUPPORT_MESSAGE}
            </div>
          )}

          {!isRecorderUnsupported && isMissingApiKey && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-yellow-100">
              <span>{NO_KEY_MESSAGE}</span>
              <PrimaryButton
                label="開啟設定"
                onClick={() => setIsSettingsOpen(true)}
              />
            </div>
          )}

          <TranscriptBlock
            text={transcriptText ?? ""}
            onChange={setTranscriptText}
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
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 min-h-[100px] flex items-center gap-3 h-auto">
            <div className="flex-1 min-w-0">
              <RecordingControls
                appStatus={appStatus}
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
                onResetAll={handleResetAll}
                onRetryTranscribe={handleRetryTranscribe}
                onReRecord={handleReRecord}
                transcribeError={transcribeError}
                mediaStream={mediaStreamRef?.current ?? null}
                audioBlob={audioBlob}
                getPreviewBlob={getPreviewBlob}
              />
            </div>
            {appStatus === "transcribed" && (
              <CopyTranscriptButton transcriptText={transcriptText ?? ""} />
            )}
          </div>
        </div>
      </section>

      <SettingsModal
        isOpen={isSettingsOpen}
        onModalClose={() => setIsSettingsOpen(false)}
        onValidApiKeySaved={() => setIsMissingApiKey(false)}
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
