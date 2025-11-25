"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import RecordingControls from "@/components/recording/RecordingControls";
import TranscriptionResult from "@/components/transcription/TranscriptionResult";
import SettingsModal from "@/components/settings/SettingsModal";
import TranscribeModeSelector from "@/components/transcription/TranscribeModeSelector";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { useAudioBlob } from "@/hooks/useAudioBlob";
import { useTranscription } from "@/hooks/useTranscription";
import { userService } from "@/services/user";
import { DEFAULT_MODE } from "@/constants";
import { TranscribeMode, AppStatus } from "@/types";

const SUPPORT_MESSAGE =
  "瀏覽器不支援或未授權使用麥克風，請改用最新版本的 Chrome。";
const NO_KEY_MESSAGE = "請先設定 OpenAI API Key 才能使用轉錄功能。";

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [storedApiKey, setStoredApiKey] = useState<string | null>(null);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [transcribeMode, setTranscribeMode] =
    useState<TranscribeMode>(DEFAULT_MODE);
  const [appStatus, setAppStatus] = useState<AppStatus>("idle");

  const { audioBlob, setAudioBlob, handleUploadAudio } = useAudioBlob();
  const handleRecordingCompleted = useCallback(
    (blob: Blob) => {
      setAudioBlob(blob);
    },
    [setAudioBlob]
  );

  const {
    startRecording,
    pauseRecording,
    resumeRecording,
    completeRecording,
    discardRecording,
    duration,
  } = useMediaRecorder({ onRecordingCompleted: handleRecordingCompleted });

  const {
    transcriptionText,
    error: transcriptionError,
    transcribe,
    setTranscriptionText,
    clearTranscription,
  } = useTranscription();

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

  const handleTranscribeAudio = useCallback(async () => {
    if (!audioBlob || appStatus === "transcribing" || !storedApiKey) {
      return;
    }

    setAppStatus("transcribing");

    try {
      await transcribe({
        audio_file: audioBlob,
        openai_api_key: storedApiKey,
        transcribe_mode: transcribeMode,
        audio_duration: duration > 0 ? duration.toFixed(2) : undefined,
      });
      // Success: move to completed state
      setAppStatus("transcription-completed");
      setAudioBlob(null);
    } catch (error) {
      // Error: go back to audio-ready state to allow retry
      console.error("Transcription failed:", error);
      setAppStatus("audio-ready");
    }
  }, [
    audioBlob,
    appStatus,
    storedApiKey,
    transcribeMode,
    duration,
    transcribe,
    setAudioBlob,
  ]);

  const handleCompleteRecording = useCallback(() => {
    if (!storedApiKey) {
      handleOpenSettings();
      return;
    }
    if (appStatus === "recording" || appStatus === "paused") {
      completeRecording();
      setAppStatus("audio-ready");
    }
  }, [storedApiKey, appStatus, completeRecording]);

  const handleDiscardRecording = useCallback(() => {
    discardRecording();
    setAudioBlob(null);
    setAppStatus("idle");
  }, [discardRecording, setAudioBlob]);

  const handleStartRecording = useCallback(() => {
    startRecording();
    setAppStatus("recording");
  }, [startRecording]);

  const handlePauseRecording = useCallback(() => {
    pauseRecording();
    setAppStatus("paused");
  }, [pauseRecording]);

  const handleResumeRecording = useCallback(() => {
    resumeRecording();
    setAppStatus("recording");
  }, [resumeRecording]);

  const handleUploadAudioWrapper = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleUploadAudio(event);
      // After upload, audioBlob will be set, move to audio-ready
      setAppStatus("audio-ready");
    },
    [handleUploadAudio]
  );

  const handleContinueRecording = useCallback(() => {
    setAppStatus("idle");
  }, []);

  const handleResetAll = useCallback(() => {
    setAudioBlob(null);
    clearTranscription();
    setAppStatus("idle");
  }, [setAudioBlob, clearTranscription]);

  const isApiKeyMissing = !storedApiKey;

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <main className="w-full max-w-5xl flex flex-col gap-6 py-6 px-4 sm:px-6 md:px-8 lg:px-12">
        <Header onOpenSettings={handleOpenSettings} />

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

        {audioBlob && appStatus === "audio-ready" && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-md p-2 sm:p-3">
            <audio
              src={URL.createObjectURL(audioBlob)}
              controls
              className="w-full"
            />
          </div>
        )}

        <div className="flex flex-col gap-4">
          <RecordingControls
            appStatus={appStatus}
            duration={duration}
            onStartRecording={handleStartRecording}
            onPauseRecording={handlePauseRecording}
            onResumeRecording={handleResumeRecording}
            onCompleteRecording={handleCompleteRecording}
            onDiscardRecording={handleDiscardRecording}
            onUploadAudio={handleUploadAudioWrapper}
          />

          {appStatus === "audio-ready" && (
            <div className="flex flex-col gap-3">
              <TranscribeModeSelector
                value={transcribeMode}
                onModeChange={setTranscribeMode}
              />
              <div className="flex gap-2">
                <PrimaryButton
                  onClick={handleTranscribeAudio}
                  disabled={!audioBlob || appStatus !== "audio-ready"}
                  label="開始轉錄"
                />
                <PrimaryButton
                  onClick={handleDiscardRecording}
                  label="丟棄錄音"
                  variant="ghost"
                />
              </div>
            </div>
          )}

          {appStatus === "transcribing" && (
            <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-slate-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm text-slate-200">轉錄中...</span>
              </div>
            </div>
          )}

          {appStatus === "transcription-completed" && (
            <div className="flex gap-2">
              <PrimaryButton
                onClick={handleContinueRecording}
                label="繼續錄音"
              />
              <PrimaryButton
                onClick={handleResetAll}
                label="重新開始"
                variant="ghost"
              />
            </div>
          )}
        </div>

        {transcriptionError && (
          <div className="bg-red-900/20 border border-red-700/40 text-red-200 rounded-xl px-3 py-2 text-sm">
            {transcriptionError}
          </div>
        )}

        <TranscriptionResult
          text={transcriptionText ?? ""}
          onChange={setTranscriptionText}
        />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        apiKey={apiKeyInput}
        onApiKeyChange={setApiKeyInput}
        onSave={handleSaveApiKey}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
