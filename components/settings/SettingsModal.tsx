import PrimaryButton from "../buttons/PrimaryButton";
import IconButton from "../buttons/IconButton";
import { CloseIcon, ConfirmIcon, DiscardIcon } from "@/lib/icons";

type SettingsModalProps = {
  isOpen: boolean;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export default function SettingsModal({
  isOpen,
  apiKey,
  onApiKeyChange,
  onSave,
  onClose,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
        <IconButton
          onClick={onClose}
          icon={<CloseIcon />}
          ariaLabel="關閉設定"
          className="absolute top-4 right-4"
        />

        <h2 className="text-lg font-semibold text-slate-100 mb-4">設定</h2>

        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <PrimaryButton
            onClick={onSave}
            label="套用"
            icon={<ConfirmIcon />}
            className="flex-1"
          />
          <PrimaryButton
            onClick={onClose}
            label="取消"
            icon={<DiscardIcon />}
            variant="ghost"
          />
        </div>
      </div>
    </div>
  );
}
