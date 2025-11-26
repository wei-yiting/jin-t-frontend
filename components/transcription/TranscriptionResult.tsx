import CopyButton from "../ui/CopyButton";

type TranscriptionResultProps = {
  text: string;
  onChange?: (value: string) => void;
};

export default function TranscriptionResult({
  text,
  onChange,
}: TranscriptionResultProps) {
  const hasText = Boolean(text);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">文字結果</span>
        <CopyButton text={text} disabled={!hasText} />
      </div>
      <div className="relative bg-slate-800/50 rounded-xl p-4">
        <textarea
          value={text}
          onChange={(event) => onChange?.(event.target.value)}
          rows={text ? Math.max(5, text.split("\n").length) : 5}
          className="w-full bg-transparent text-slate-100 text-sm leading-relaxed outline-none resize-none placeholder-slate-500"
          placeholder="轉錄結果將顯示在此處..."
        />
      </div>
    </div>
  );
}
