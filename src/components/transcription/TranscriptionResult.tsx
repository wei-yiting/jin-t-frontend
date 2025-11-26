import { useEffect, useRef } from "react";
import CopyButton from "../ui/CopyButton";

const TEXT_AREA_THRESHOLD = 5;

type TranscriptionResultProps = {
  text: string;
  onChange?: (value: string) => void;
};

export default function TranscriptionResult({
  text,
  onChange,
}: TranscriptionResultProps) {
  const hasText = Boolean(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    // Set height to scrollHeight to fit content
    textarea.style.height = `${textarea.scrollHeight + TEXT_AREA_THRESHOLD}px`;
  }, [text]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">文字結果</span>
        <CopyButton text={text} disabled={!hasText} />
      </div>
      <div className="relative bg-slate-800/50 rounded-xl p-4">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full bg-transparent text-slate-100 text-sm leading-relaxed outline-none resize-none placeholder-slate-500 min-h-[120px]"
          placeholder="轉錄結果將顯示在此處..."
        />
      </div>
    </div>
  );
}
