import { SettingsIcon } from "@/lib/icons";
import IconButton from "../buttons/IconButton";

type HeaderProps = {
  onOpenSettings: () => void;
};

export default function Header({ onOpenSettings }: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100">
          晶晶體
        </h1>
        <p className="text-xs text-slate-400 mt-1">中英夾雜語音輸入</p>
      </div>
      <IconButton
        onClick={onOpenSettings}
        icon={<SettingsIcon />}
        ariaLabel="開啟設定"
      />
    </div>
  );
}
