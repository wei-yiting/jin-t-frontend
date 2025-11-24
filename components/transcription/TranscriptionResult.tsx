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
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">文字結果</span>
        {hasText && <CopyButton text={text} />}
      </div>
      <div className="relative flex-1 bg-slate-900/40 border border-slate-800 rounded-xl p-3">
        <textarea
          value={text}
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full h-full bg-transparent text-slate-100 text-sm leading-relaxed outline-none resize-none"
        />
      </div>
    </div>
  );
}
