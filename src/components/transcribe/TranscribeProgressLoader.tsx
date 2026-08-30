import { useTranscribeContext } from "@/src/contexts";
import { TranscribeStreamEventType } from "@/src/types";

export default function TranscribeProgressLoader() {
  const { transcribeProgressMessage, transcribePhase } = useTranscribeContext();

  const getTextColorClass = () => {
    switch (transcribePhase) {
      case TranscribeStreamEventType.TASK_QUEUED:
        return "text-slate-500";
      case TranscribeStreamEventType.TASK_STARTED:
      case TranscribeStreamEventType.CHUNK_COMPLETED:
        return "text-white";
      case TranscribeStreamEventType.CHUNKS_CONSOLIDATING:
        return "text-slate-200";
      case TranscribeStreamEventType.PUNC_FIXING:
        return "text-emerald-400";
      case TranscribeStreamEventType.TASK_STARTED:
      case TranscribeStreamEventType.CHUNK_COMPLETED:
      default:
        return "text-slate-200";
    }
  };

  const colorClass = getTextColorClass();

  return (
    <div className="flex items-center justify-center w-full gap-3">
      <svg
        className={`animate-spin h-6 w-6 ${colorClass}`}
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
      <span className={`text-lg ${colorClass}`}>
        {transcribeProgressMessage || ""}
      </span>
    </div>
  );
}
