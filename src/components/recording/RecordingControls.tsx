import { AppStatus } from "@/src/types";
import WaveformAnimation from "../ui/WaveformAnimation";
import PrimaryButton from "../buttons/PrimaryButton";
import IconButton from "../buttons/IconButton";
import {
  Mic,
  Upload,
  Pause,
  Check,
  Trash2,
  Play,
  RotateCcw,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";

type RecordingControlsProps = {
  appStatus: AppStatus;
  duration: number;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onCompleteRecording: () => void;
  onDiscardRecording: () => void;
  onUploadAudio?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onStartTranscribe?: () => void;
  onDiscardAudio?: () => void;
  onStartNextRecording: () => void;
  onResetAll: () => void;
  onRetryTranscribe?: () => void;
  onReRecord?: () => void;
  transcribeError?: string | null;
  mediaStream: MediaStream | null;
  audioBlob?: Blob | null;
  getPreviewBlob?: () => Blob | null;
};

const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(duration % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export default function RecordingControls({
  appStatus,
  duration,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onCompleteRecording,
  onDiscardRecording,
  onUploadAudio,
  onStartTranscribe,
  onDiscardAudio,
  onStartNextRecording,
  onResetAll,
  onRetryTranscribe,
  onReRecord,
  transcribeError,
  mediaStream,
  audioBlob,
  getPreviewBlob,
}: RecordingControlsProps) {
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  // Update preview blob when paused
  useEffect(() => {
    if (appStatus === "paused" && getPreviewBlob) {
      setPreviewBlob(getPreviewBlob());
    } else {
      setPreviewBlob(null);
    }
  }, [appStatus, getPreviewBlob]);

  // Use audioBlob if available, otherwise use previewBlob
  const displayBlob = audioBlob || previewBlob;

  return (
    <div className="w-full">
      {appStatus === "idle" && (
        <div className="flex gap-3 w-full">
          <label className="w-[40%] sm:w-[30%] px-4 py-4 bg-slate-800/60 hover:bg-slate-700/60 text-slate-100 rounded-lg border border-slate-700/70 hover:border-slate-600/70 transition-all text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            上傳音檔
            <input
              type="file"
              accept="audio/*"
              onChange={onUploadAudio}
              className="hidden"
            />
          </label>
          <button
            onClick={onStartRecording}
            className="w-[60%] sm:w-[70%] px-6 py-4 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg border border-slate-600 transition-all text-sm font-medium flex items-center justify-center gap-2"
          >
            <Mic className="w-5 h-5 text-sky-400" />
            開始錄音
          </button>
        </div>
      )}

      {(appStatus === "recording" || appStatus === "paused") && (
        <div className="flex items-center gap-3 w-full min-w-0">
          <span className="text-sm sm:text-xl font-mono text-slate-200 shrink-0">
            {formatDuration(duration)}
          </span>
          <div className="flex-1 min-w-0">
            {appStatus === "recording" ? (
              <WaveformAnimation mediaStream={mediaStream} isRecording={true} />
            ) : (
              <WaveformAnimation audioBlob={displayBlob} isRecording={false} />
            )}
          </div>
          <div className="flex gap-2 shrink-0 flex-nowrap">
            {appStatus === "recording" ? (
              <>
                <button
                  onClick={onPauseRecording}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                >
                  <Pause className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="hidden sm:inline">暫停錄音</span>
                </button>
                <button
                  onClick={onDiscardRecording}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-800/50 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                >
                  <Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="hidden sm:inline">重錄</span>
                </button>
                <button
                  onClick={onCompleteRecording}
                  className="px-3 sm:px-8 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                >
                  <Check className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="hidden sm:inline">轉錄文字</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onDiscardRecording}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-800/50 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                >
                  <Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="hidden sm:inline">重錄</span>
                </button>
                <button
                  onClick={onResumeRecording}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                >
                  <Mic className="w-4 sm:w-5 h-4 sm:h-5 text-sky-400" />
                  <span className="hidden sm:inline">繼續錄音</span>
                </button>
                <button
                  onClick={onCompleteRecording}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                >
                  <Check className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="hidden sm:inline">轉錄文字</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {appStatus === "audio-ready" && (
        <div className="flex items-center gap-3 w-full min-w-0">
          <div className="flex-1 min-w-0">
            <WaveformAnimation audioBlob={audioBlob} isRecording={false} />
          </div>
          <div className="flex gap-2 shrink-0 flex-nowrap">
            <PrimaryButton
              onClick={onStartTranscribe}
              label="開始轉錄"
              icon={<Check className="w-4 h-4" />}
              variant="success"
              className="whitespace-nowrap"
            />
            <button
              onClick={onDiscardAudio}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 border bg-transparent text-red-400 hover:text-red-300 border-transparent hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              丟棄
            </button>
          </div>
        </div>
      )}

      {appStatus === "transcribing" && (
        <div className="flex items-center justify-center w-full gap-3">
          <svg
            className="animate-spin h-6 w-6 text-slate-300"
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
          <span className="text-base text-slate-200">轉錄中...</span>
        </div>
      )}

      {appStatus === "transcribed" && (
        <div className="flex gap-3 w-full transition-all duration-300 ease-in-out">
          <button
            onClick={onResetAll}
            className="w-[40%] sm:w-[30%] px-4 py-4 bg-slate-800/60 hover:bg-slate-700/60 text-slate-100 rounded-lg border border-slate-700/70 hover:border-slate-600/70 transition-all text-sm font-medium flex items-center justify-center gap-2 shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="sm:hidden">重置</span>
            <span className="hidden sm:inline">重新開始</span>
          </button>
          <button
            onClick={onStartNextRecording}
            className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg border border-slate-600 transition-all duration-300 ease-in-out text-sm font-medium flex items-center justify-center gap-2"
          >
            <Mic className="w-5 h-5 text-sky-400" />
            <span className="sm:hidden">下段錄音</span>
            <span className="hidden sm:inline">開始下一段錄音</span>
          </button>
        </div>
      )}

      {appStatus === "transcribe-error" && (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-start gap-3 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-200 text-sm font-medium mb-1">轉錄失敗</p>
              {transcribeError && (
                <p className="text-red-300 text-xs">{transcribeError}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <PrimaryButton
              onClick={onReRecord}
              label="重新錄音"
              icon={<Mic className="w-4 h-4" />}
              variant="ghost"
              className="w-[30%]"
            />
            <PrimaryButton
              onClick={onRetryTranscribe}
              label="重試轉錄"
              icon={<RefreshCw className="w-4 h-4" />}
              className="w-[70%]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
