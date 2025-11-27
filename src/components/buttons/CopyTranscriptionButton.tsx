import { Copy, Check } from "lucide-react";
import { useClipboard } from "@/src/hooks/useClipboard";
import { useEffect, useRef, useState } from "react";

type CopyTranscriptionButtonProps = {
  transcriptionText: string;
};

export default function CopyTranscriptionButton({
  transcriptionText,
}: CopyTranscriptionButtonProps) {
  const { showIsCopied, copyToClipboard } = useClipboard();
  const [shouldDisplayButton, setShouldDisplayButton] = useState(true);
  const prevShowIsCopiedRef = useRef(false);

  // Reset shouldShow when transcriptionText changes (new transcription or transcription updated)
  useEffect(() => {
    setShouldDisplayButton(true);
    prevShowIsCopiedRef.current = false;
  }, [transcriptionText]);

  // When showCopiedToast changes from true to false, hide the button with animation
  useEffect(() => {
    if (prevShowIsCopiedRef.current && !showIsCopied) {
      // Start the fade-out animation with state change and css transition
      setShouldDisplayButton(false);
    }
    prevShowIsCopiedRef.current = showIsCopied;
  }, [showIsCopied]);

  const handleCopyTranscription = async () => {
    if (!transcriptionText) return;
    await copyToClipboard(transcriptionText);
  };

  return (
    <button
      onClick={handleCopyTranscription}
      className={`bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg border border-slate-600 transition-all duration-300 ease-in-out text-sm font-medium flex items-center justify-center gap-2 ${
        shouldDisplayButton
          ? "opacity-100 w-auto aspect-square shrink-0 sm:aspect-auto sm:w-[35%] px-4 py-4"
          : "opacity-0 w-0 min-w-0 h-0 min-h-0 p-0 m-0 overflow-hidden pointer-events-none aspect-auto -mr-3"
      }`}
    >
      {showIsCopied ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">複製完成</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">複製文字</span>
        </>
      )}
    </button>
  );
}
