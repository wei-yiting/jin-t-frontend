import { useState, useEffect } from "react";
import PrimaryButton from "../buttons/PrimaryButton";
import { X, Check, Info, ExternalLink } from "lucide-react";
import { userService } from "@/src/services/userService";
import { BillingOption } from "@/src/types";

interface SettingsModalProps {
  isOpen: boolean;
  onModalClose: () => void;
  onSettingsSaved: () => void;
}

export default function SettingsModal({
  isOpen,
  onModalClose,
  onSettingsSaved,
}: SettingsModalProps) {
  const [billingOption, setBillingOption] = useState<BillingOption>("free");
  const [consentDataCollection, setConsentDataCollection] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifyingApiKey, setIsVerifyingApiKey] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    (async () => {
      const userSettings = await userService.getUserSettings();

      if (userSettings.useOwnApiKey) {
        setBillingOption("byok");
      } else {
        setBillingOption("free");
      }

      if (userSettings.customOpenaiApiKey) {
        setApiKeyInput(userSettings.customOpenaiApiKey);
      }

      setConsentDataCollection(userSettings.allowDataCollection);
    })();
  }, [isOpen]);

  const handleBillingOptionChange = (option: BillingOption) => {
    setBillingOption(option);

    // If switching to free tier, consent must be true
    if (option === "free") {
      setConsentDataCollection(true);
    }

    // Clear error when switching options
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleConsentToggle = () => {
    // Only allow toggle if using own API key
    if (billingOption === "byok") {
      setConsentDataCollection(!consentDataCollection);

      if (errorMessage) {
        setErrorMessage(null);
      }
    }
  };

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeyInput(event.target.value);
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSettingsSave = async () => {
    try {
      setIsVerifyingApiKey(true);

      // Free tier option
      if (billingOption === "free") {
        await userService.saveConsentDataCollection(true);
        await userService.saveIsUsingPersonalApiKey(false);
        setErrorMessage(null);
        onSettingsSaved();
        onModalClose();
        return;
      }

      // Own API key option - must provide valid API key
      const trimmedApiKey = apiKeyInput.trim();
      if (!trimmedApiKey) {
        setErrorMessage("請提供您的 OpenAI API Key");
        return;
      }

      // Validate the API key
      const result = await userService.checkIsOpenaiApiKeyValid(trimmedApiKey);

      if (result.is_api_key_valid) {
        await userService.encodeAndSaveOpenaiApiKey(trimmedApiKey);
        await userService.saveConsentDataCollection(consentDataCollection);
        await userService.saveIsUsingPersonalApiKey(true);
        setErrorMessage(null);
        onSettingsSaved();
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

  const shouldDisableSaveButton = () => {
    if (!!errorMessage || isVerifyingApiKey) {
      return true;
    }

    if (billingOption === "free" && !consentDataCollection) {
      return true;
    }

    if (billingOption === "byok" && !apiKeyInput.trim()) {
      return true;
    }

    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-xl relative">
        <button
          onClick={handleModalClose}
          aria-label="關閉設定"
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800 transition-all text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-semibold text-slate-100 mb-6">設定</h2>

        {/* Section 1: API Key Option Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            選擇使用方式
          </h3>

          <div className="space-y-3">
            {/* Free Tier Radio */}
            <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
              <input
                type="radio"
                name="apiKeyOption"
                value="free"
                checked={billingOption === "free"}
                onChange={() => handleBillingOptionChange("free")}
                className="mt-0.5 w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="text-base font-medium text-slate-100">
                  使用免費版
                </div>
                <div className="text-sm text-slate-400 mt-0.5">
                  無需提供 API Key，有使用額度限制
                </div>
              </div>
            </label>

            {/* Own API Key Radio */}
            <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
              <input
                type="radio"
                name="apiKeyOption"
                value="own"
                checked={billingOption === "byok"}
                onChange={() => handleBillingOptionChange("byok")}
                className="mt-0.5 w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="text-base font-medium text-slate-100">
                  使用自己的 API Key
                </div>
                <div className="text-sm text-slate-400 mt-0.5">
                  無使用限制，需自行負擔費用
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Free Tier Details */}
        {billingOption === "free" && (
          <>
            {/* Usage Quota */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                免費版額度
              </h3>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span>每小時最多 5 次轉錄</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span>每小時最多轉錄總時長 10 分鐘</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span>每天最多轉錄總時長 30 分鐘</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Collection - Required (No title) */}
            <div className="mb-6">
              <div className="bg-slate-800/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base text-slate-100">
                    同意資料蒐集{" "}
                    <span className="text-red-400 text-sm">(必要)</span>
                  </span>
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600/50 cursor-not-allowed">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-slate-400">
                  <Info className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
                  <div className="space-y-1">
                    <p>您的協助是我們能持續改善轉錄品質的關鍵</p>
                    <p>資料蒐集僅用於優化服務，我們嚴格遵守個人資料保護法</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Section 3: Own API Key Details */}
        {billingOption === "byok" && (
          <>
            {/* API Key Input */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  OpenAI API Key
                </h3>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  如何取得
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <input
                type="password"
                value={apiKeyInput}
                onChange={handleApiKeyChange}
                placeholder="sk-..."
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Data Collection - Optional (No title) */}
            <div className="mb-6">
              <div className="bg-slate-800/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base text-slate-100">
                    同意資料蒐集{" "}
                    <span className="text-slate-500 text-sm">(可選)</span>
                  </span>
                  <button
                    onClick={handleConsentToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      consentDataCollection ? "bg-blue-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        consentDataCollection
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-start gap-2 text-sm text-slate-400">
                  <Info className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
                  <div className="space-y-1">
                    <p>希望您能幫助我們優化轉錄品質</p>
                    <p>資料蒐集僅用於改善服務，我們嚴格遵守個人資料保護法</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
            <p className="text-yellow-200 text-base">{errorMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <PrimaryButton
            onClick={handleSettingsSave}
            label={isVerifyingApiKey ? "驗證中" : "套用"}
            icon={<Check className="w-4 h-4" />}
            className="flex-1"
            isLoading={isVerifyingApiKey}
            disabled={shouldDisableSaveButton()}
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
