import { useState, useEffect } from "react";
import PrimaryButton from "../buttons/PrimaryButton";
import { X, Check } from "lucide-react";
import { userService } from "@/src/services/userService";

interface SettingsModalProps {
  isOpen: boolean;
  onModalClose: () => void;
  onValidApiKeySaved: () => void;
}

export default function SettingsModal({
  isOpen,
  onModalClose,
  onValidApiKeySaved,
}: SettingsModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifyingApiKey, setIsVerifyingApiKey] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    (async () => {
      const storedOpenaiApiKey = await userService.getAndDecodeOpenaiApiKey();
      if (storedOpenaiApiKey) {
        setApiKeyInput(storedOpenaiApiKey);
      }
    })();
  }, [isOpen]);

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeyInput(event.target.value);
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleApiKeySave = async () => {
    const trimmedApiKey = apiKeyInput.trim();
    if (!trimmedApiKey) {
      return;
    }

    try {
      setIsVerifyingApiKey(true);
      const result = await userService.checkIsOpenaiApiKeyValid(trimmedApiKey);

      if (result.is_api_key_valid) {
        await userService.encodeAndSaveOpenaiApiKey(trimmedApiKey);
        setErrorMessage(null);
        onValidApiKeySaved();
        onModalClose();
        return;
      }

      if (result.has_unexpectied_validation_error) {
        setErrorMessage("驗證過程中發生未預期的錯誤，請稍後再試。");
        return;
      }

      setErrorMessage("這是無效的 OpenAI API Key，請重新輸入。");
    } finally {
      setIsVerifyingApiKey(false);
    }
  };

  const handleModalClose = () => {
    setApiKeyInput("");
    setErrorMessage(null);
    setIsVerifyingApiKey(false);
    onModalClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
        <button
          onClick={handleModalClose}
          aria-label="關閉設定"
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800 transition-all text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-semibold text-slate-100 mb-4">設定</h2>

        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKeyInput}
            onChange={handleApiKeyChange}
            placeholder="sk-..."
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
          />
          {errorMessage && (
            <p className="text-yellow-500 text-sm mt-2">{errorMessage}</p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <PrimaryButton
            onClick={handleApiKeySave}
            label={isVerifyingApiKey ? "驗證中" : "套用"}
            icon={<Check className="w-4 h-4" />}
            className="flex-1"
            isLoading={isVerifyingApiKey}
            disabled={
              isVerifyingApiKey || !apiKeyInput.trim() || !!errorMessage
            }
          />
          <PrimaryButton
            onClick={handleModalClose}
            label="取消"
            icon={<X className="w-4 h-4" />}
            variant="ghost"
            disabled={isVerifyingApiKey}
          />
        </div>
      </div>
    </div>
  );
}
