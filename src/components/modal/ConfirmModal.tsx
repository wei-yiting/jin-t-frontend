import { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import PrimaryButton from "../buttons/PrimaryButton";

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onConfirm();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onConfirm, onCancel]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
        <button
          onClick={onCancel}
          aria-label="關閉"
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800 transition-all text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-slate-200 text-base flex-1 pr-6">{message}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-2 border bg-yellow-600/80 hover:bg-yellow-600 text-slate-100 border-yellow-500/50 hover:border-yellow-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500"
          >
            確認
          </button>
          <PrimaryButton
            onClick={onCancel}
            label="取消"
            variant="ghost"
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
