import { useClipboard } from "@/hooks/useClipboard";

type CopyButtonProps = {
  text: string;
};

export default function CopyButton({ text }: CopyButtonProps) {
  const { showCopiedToast, copyToClipboard } = useClipboard();

  const handleTextCopy = async () => {
    if (!text) return;
    await copyToClipboard(text);
  };

  return (
    <button
      type="button"
      onClick={handleTextCopy}
      className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/60 border border-slate-600/60 text-slate-200 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={
            showCopiedToast
              ? "M5 13l4 4L19 7"
              : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          }
        />
      </svg>
      {showCopiedToast ? "已複製" : "複製"}
    </button>
  );
}
