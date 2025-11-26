import { useState, useRef, useEffect, ReactNode } from "react";
import { TRANSCRIBE_MODES } from "@/constants";
import { TranscribeMode } from "@/types";
import { Zap, FileText, Sparkles, ChevronDown, Check } from "lucide-react";

type TranscribeModeSelectorProps = {
  value: TranscribeMode;
  onModeChange: (mode: TranscribeMode) => void;
  disabled?: boolean;
};

const MODE_DESCRIPTIONS: Record<TranscribeMode, string> = {
  fast: "最快速，但可能缺少標點符號",
  standard: "平衡品質與速度，適合一般使用",
  refined: "去除冗贅字詞且標點準確，但回覆時間較長",
};

const MODE_ICONS: Record<TranscribeMode, ReactNode> = {
  fast: <Zap className="w-4 h-4 text-emerald-400" />,
  standard: <FileText className="w-4 h-4 text-sky-400" />,
  refined: <Sparkles className="w-4 h-4 text-violet-400" />,
};

export default function TranscribeModeSelector({
  value,
  onModeChange,
  disabled,
}: TranscribeModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedMode = TRANSCRIBE_MODES.find(
    (mode) => mode.value === value
  ) ?? { value, label: "" };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (mode: TranscribeMode) => {
    onModeChange(mode);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`pl-2 pr-1.5 py-1.5 rounded-lg bg-transparent text-left flex items-center gap-1.5 text-slate-100 transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-800/30"
        }`}
      >
        <span className="flex items-center gap-1.5 text-xs">
          {MODE_ICONS[value]}
          {selectedMode.label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 bottom-full mb-2 right-0 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
          {TRANSCRIBE_MODES.map((mode) => {
            const modeValue = mode.value as TranscribeMode;
            const isActive = value === modeValue;

            return (
              <button
                type="button"
                key={mode.value}
                onClick={() => handleSelect(modeValue)}
                className={`w-full px-3 py-2 flex items-start gap-3 text-left transition-colors ${
                  isActive
                    ? "bg-slate-800/60 text-slate-100"
                    : "text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <span className="mt-0.5">{MODE_ICONS[modeValue]}</span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">
                    {mode.label}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {MODE_DESCRIPTIONS[modeValue]}
                  </span>
                </span>
                {isActive && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
