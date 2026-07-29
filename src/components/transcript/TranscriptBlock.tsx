import { useEffect, useRef } from "react";
import { useClipboard } from "@/src/hooks/useClipboard";
import { Copy, Check } from "lucide-react";
import { useTranscribeContext } from "@/src/contexts";

const TEXT_AREA_THRESHOLD = 5;

export default function TranscriptBlock() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasEditingTranscriptTextRef = useRef(false);
  const { showIsCopied, copyToClipboard } = useClipboard();
  const {
    transcriptText,
    setTranscriptText,
    isTranscribing,
    transcribeReceivedChunks,
    transcriptInProgress,
  } = useTranscribeContext();

  const isFinished = !isTranscribing && !!transcriptText;
  const shouldShowLiveDetails =
    isTranscribing &&
    (!!transcriptInProgress || transcribeReceivedChunks.length > 0);

  useEffect(() => {
    if (transcribeReceivedChunks.length > 0) {
      wasEditingTranscriptTextRef.current = false;
    }
  }, [transcribeReceivedChunks]);

  useEffect(
    function updateTranscriptTextareaHeight() {
      if (!transcriptText || wasEditingTranscriptTextRef.current) return;

      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set height to scrollHeight to fit content
      textarea.style.height = `${
        textarea.scrollHeight + TEXT_AREA_THRESHOLD
      }px`;
    },
    [transcriptText]
  );

  const handleTranscriptTextChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setTranscriptText(event.target.value);
    wasEditingTranscriptTextRef.current = true;
  };

  const renderLiveText = () => {
    if (!!transcriptInProgress) {
      return (
        <span className="breath-consolidating">{transcriptInProgress}</span>
      );
    }

    return transcribeReceivedChunks.map((chunk) => (
      <span
        key={chunk.chunk_index}
        className={`${
          chunk.status === "new" ? "breath-new fade-in" : "breath-old"
        }`}
      >
        {chunk.text}
      </span>
    ));
  };

  const liveDetailContent = shouldShowLiveDetails ? (
    <p className="mt-3 w-full bg-transparent text-slate-100 text-base leading-relaxed outline-none whitespace-pre-wrap">
      {renderLiveText()}
    </p>
  ) : null;

  let mainContent: React.ReactNode;
  if (!!transcriptText) {
    mainContent = (
      <>
        <textarea
          ref={textareaRef}
          value={transcriptText}
          onChange={handleTranscriptTextChange}
          className={`w-full bg-transparent text-slate-100 text-base leading-relaxed outline-none resize-none placeholder-slate-500 min-h-[120px] ${
            isFinished ? "fade-in-solid" : ""
          }`}
          placeholder="轉錄結果將顯示在此處..."
        />
        <button
          type="button"
          onClick={async () => {
            if (!transcriptText) return;
            await copyToClipboard(transcriptText);
          }}
          disabled={!transcriptText}
          className={`absolute bottom-3 right-3 p-2 rounded-md transition-colors flex items-center justify-center ${
            !transcriptText
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-slate-700/60 cursor-pointer"
          }`}
        >
          {showIsCopied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4 text-slate-300" />
          )}
        </button>
        {liveDetailContent}
      </>
    );
  } else if (!!transcriptInProgress || transcribeReceivedChunks.length) {
    mainContent = (
      <p className="w-full bg-transparent text-slate-100 text-base leading-relaxed outline-none min-h-[120px] whitespace-pre-wrap">
        {renderLiveText()}
      </p>
    );
  } else {
    mainContent = (
      <p className="text-slate-500 text-base leading-relaxed min-h-[120px]">
        轉錄結果將顯示在此處...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-slate-200">文字結果</span>
      </div>
      <div className="relative bg-slate-800/50 rounded-xl p-4">
        {mainContent}
      </div>
    </div>
  );
}
