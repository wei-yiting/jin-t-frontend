import { useEffect, useRef } from "react";

type ConfirmModalProps = {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmModal = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-slate-800 border border-yellow-600/50 rounded-lg p-4 sm:p-6 w-full max-w-md relative"
      >
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-300 transition-colors"
          aria-label="關閉"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="mb-4 sm:mb-5 flex items-start gap-3 pr-6">
          <div className="shrink-0">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-slate-200 text-sm sm:text-base flex-1">
            {message}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-yellow-600/80 hover:bg-yellow-600 text-slate-100 font-medium rounded-md border border-yellow-500/50 hover:border-yellow-500 transition-all duration-200 text-sm"
          >
            確認
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-slate-200 font-medium rounded-md border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
