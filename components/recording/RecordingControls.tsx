import { RecordingStatus } from "@/types";
import WaveformAnimation from "../ui/WaveformAnimation";
import PrimaryButton from "../buttons/PrimaryButton";
import {
  ConfirmIcon,
  DiscardIcon,
  PauseIcon,
  ResumeIcon,
  StartIcon,
  UploadIcon,
} from "@/lib/icons";

type RecordingControlsProps = {
  status: RecordingStatus;
  duration: number;
  isTranscribing?: boolean;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onCompleteRecording: () => void;
  onDiscardRecording: () => void;
  onUploadAudio?: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
  status,
  duration,
  isTranscribing,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onCompleteRecording,
  onDiscardRecording,
  onUploadAudio,
}: RecordingControlsProps) {
  const isIdle = status === "idle";
  const isRecording = status === "recording";
  const isPaused = status === "paused";

  return (
    <div className="w-full">
      {isIdle && (
        <div className="flex flex-col sm:flex-row gap-3">
          <PrimaryButton
            onClick={onStartRecording}
            label="開始錄音"
            icon={<StartIcon />}
          />
          <label className="flex-1 px-6 py-3 bg-slate-800/60 hover:bg-slate-700/60 text-slate-100 rounded-lg border border-slate-700/70 hover:border-slate-600/70 transition-all text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
            <UploadIcon />
            上傳音檔
            <input
              type="file"
              accept="audio/*"
              onChange={onUploadAudio}
              className="hidden"
            />
          </label>
        </div>
      )}

      {(isRecording || isPaused) && (
        <div className="flex flex-col gap-3 bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WaveformAnimation isActive={isRecording} />
              <span className="px-2 py-1 text-xs font-mono text-slate-200 bg-slate-800/70 rounded">
                {formatDuration(duration)}
              </span>
            </div>
            {isRecording ? (
              <PrimaryButton
                onClick={onPauseRecording}
                label="暫停"
                icon={<PauseIcon />}
              />
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onResumeRecording}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg border border-slate-600 text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
                >
                  <ResumeIcon />
                  繼續錄音
                </button>
                <PrimaryButton
                  onClick={onCompleteRecording}
                  disabled={isTranscribing}
                  label="確認送出"
                  icon={<ConfirmIcon />}
                  variant="success"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <PrimaryButton
              onClick={onDiscardRecording}
              label="丟掉錄音"
              icon={<DiscardIcon />}
              variant="ghost"
            />
          </div>
        </div>
      )}
    </div>
  );
}
