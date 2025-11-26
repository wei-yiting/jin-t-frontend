import { useClipboard } from "@/hooks/useClipboard";
import { Copy, Check } from "lucide-react";

type CopyButtonProps = {
  text: string;
  disabled?: boolean;
};

export default function CopyButton({ text, disabled }: CopyButtonProps) {
  const { showCopiedToast, copyToClipboard } = useClipboard();

  const handleTextCopy = async () => {
    if (!text || disabled) return;
    await copyToClipboard(text);
  };

  return (
    <button
      type="button"
      onClick={handleTextCopy}
      disabled={disabled}
      className={`px-3 py-1.5 bg-slate-800/50 border border-slate-600/60 text-slate-200 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-slate-700/60 cursor-pointer"
      }`}
    >
      {showCopiedToast ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {showCopiedToast ? "已複製" : "複製"}
    </button>
  );
}
