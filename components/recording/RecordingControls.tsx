import { AppStatus } from "@/types";
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
  appStatus: AppStatus;
  duration: number;
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
  appStatus,
  duration,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onCompleteRecording,
  onDiscardRecording,
  onUploadAudio,
}: RecordingControlsProps) {
  // Only show recording controls when in idle/recording/paused states
  if (
    appStatus !== "idle" &&
    appStatus !== "recording" &&
    appStatus !== "paused"
  ) {
    return null;
  }

  return (
    <div className="w-full">
      {appStatus === "idle" && (
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

      {(appStatus === "recording" || appStatus === "paused") && (
        <div className="flex flex-col gap-3 bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <WaveformAnimation isActive={appStatus === "recording"} />
            <span className="px-2 py-1 text-xs font-mono text-slate-200 bg-slate-800/70 rounded">
              {formatDuration(duration)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {appStatus === "recording" ? (
              <>
                <PrimaryButton
                  onClick={onPauseRecording}
                  label="暫停"
                  icon={<PauseIcon />}
                />
                <PrimaryButton
                  onClick={onCompleteRecording}
                  label="確認送出"
                  icon={<ConfirmIcon />}
                  variant="success"
                />
                <PrimaryButton
                  onClick={onDiscardRecording}
                  label="丟掉錄音"
                  icon={<DiscardIcon />}
                  variant="ghost"
                />
              </>
            ) : (
              <>
                <PrimaryButton
                  onClick={onResumeRecording}
                  label="繼續錄音"
                  icon={<ResumeIcon />}
                />
                <PrimaryButton
                  onClick={onCompleteRecording}
                  label="確認送出"
                  icon={<ConfirmIcon />}
                  variant="success"
                />
                <PrimaryButton
                  onClick={onDiscardRecording}
                  label="丟掉錄音"
                  icon={<DiscardIcon />}
                  variant="ghost"
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
