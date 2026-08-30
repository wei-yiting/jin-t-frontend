import { useEffect, useRef } from "react";
import { useClipboard } from "@/src/hooks/useClipboard";
import { Copy, Check } from "lucide-react";
import { useTranscribeContext } from "@/src/contexts";

const TEXT_AREA_THRESHOLD = 5;
const PIN_TO_BOTTOM_THRESHOLD_PX = 80;

function findScrollableAncestor(el: HTMLElement | null): HTMLElement | null {
  for (let node = el?.parentElement ?? null; node; node = node.parentElement) {
    const { overflowY } = window.getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
  }
  return null;
}

export default function TranscriptBlock() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const liveTextRef = useRef<HTMLParagraphElement>(null);
  // Auto-scroll follows new streaming text only while the user stays near the
  // bottom; scrolling up to re-read earlier chunks unpins it.
  const isPinnedToBottomRef = useRef(true);
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
    function resetScrollPinWhenTranscribeStarts() {
      if (isTranscribing) isPinnedToBottomRef.current = true;
    },
    [isTranscribing]
  );

  useEffect(
    function autoScrollToLatestLiveText() {
      if (!shouldShowLiveDetails) return;
      const scrollable = findScrollableAncestor(liveTextRef.current);
      if (!scrollable) return;

      const updatePin = () => {
        const distanceFromBottom =
          scrollable.scrollHeight -
          scrollable.scrollTop -
          scrollable.clientHeight;
        isPinnedToBottomRef.current =
          distanceFromBottom < PIN_TO_BOTTOM_THRESHOLD_PX;
      };
      scrollable.addEventListener("scroll", updatePin, { passive: true });

      if (isPinnedToBottomRef.current) {
        // Instant jump, not smooth: a smooth animation fires scroll events
        // while still far from the bottom, which updatePin reads as the user
        // scrolling up and permanently unpins auto-follow.
        scrollable.scrollTo({ top: scrollable.scrollHeight });
      }

      return () => scrollable.removeEventListener("scroll", updatePin);
    },
    [shouldShowLiveDetails, transcribeReceivedChunks, transcriptInProgress]
  );

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
    <p
      ref={liveTextRef}
      className="mt-3 w-full bg-transparent text-slate-100 text-base leading-relaxed outline-none whitespace-pre-wrap"
    >
      {renderLiveText()}
    </p>
  ) : null;

  let mainContent: React.ReactNode;
  // `null` means no transcript yet (or cleared via 重新開始); `""` means the
  // user emptied it themselves and must keep an editable textarea. Treating
  // both as falsy would drop them into the live-stream branch below and render
  // the leftover streaming text they just deleted.
  if (transcriptText !== null) {
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
  } else if (shouldShowLiveDetails) {
    mainContent = (
      <p
        ref={liveTextRef}
        className="w-full bg-transparent text-slate-100 text-base leading-relaxed outline-none min-h-[120px] whitespace-pre-wrap"
      >
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
