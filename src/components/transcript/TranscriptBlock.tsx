import { useEffect, useRef } from "react";
import { useClipboard } from "@/src/hooks/useClipboard";
import { Copy, Check } from "lucide-react";
import { useTranscribeContext } from "@/src/contexts";

const TEXT_AREA_THRESHOLD = 5;

export default function TranscriptBlock() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showIsCopied, copyToClipboard } = useClipboard();
  const { transcriptText: text, setTranscriptText: setText } =
    useTranscribeContext();

  const hasText = Boolean(text);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    // Set height to scrollHeight to fit content
    textarea.style.height = `${textarea.scrollHeight + TEXT_AREA_THRESHOLD}px`;
  }, [text]);

  const handleCopy = async () => {
    if (!text || !hasText) return;
    await copyToClipboard(text);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-slate-200">文字結果</span>
      </div>
      <div className="relative bg-slate-800/50 rounded-xl p-4">
        <textarea
          ref={textareaRef}
          value={text ?? ""}
          onChange={(event) => setText(event.target.value)}
          className="w-full bg-transparent text-slate-100 text-base leading-relaxed outline-none resize-none placeholder-slate-500 min-h-[120px]"
          placeholder="轉錄結果將顯示在此處..."
        />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!hasText}
          className={`absolute bottom-3 right-3 p-2 rounded-md transition-colors flex items-center justify-center ${
            !hasText
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
      </div>
    </div>
  );
}
