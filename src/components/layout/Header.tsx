import { Settings } from "lucide-react";

interface HeaderProps {
  onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100">
          晶晶體
        </h1>
        <p className="text-sm text-slate-400 mt-1">中英夾雜語音輸入</p>
      </div>
      <button
        onClick={onOpenSettings}
        aria-label="開啟設定"
        className="p-2 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-slate-100"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
}
