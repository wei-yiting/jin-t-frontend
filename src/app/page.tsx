"use client";

import { useEffect, useState } from "react";
import Header from "@/src/components/layout/Header";
import TranscriptBlock from "@/src/components/transcript/TranscriptBlock";
import SettingsModal from "@/src/components/modal/SettingsModal";
import PrimaryButton from "@/src/components/buttons/PrimaryButton";
import ControlBar from "@/src/components/workspace/ControlBar";
import { userService } from "@/src/services/userService";
import { TranscribeProvider, useTranscribeContext } from "@/src/contexts";

export default function Home() {
  return (
    <TranscribeProvider>
      <HomeContent />
    </TranscribeProvider>
  );
}

function HomeContent() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [completeSettingsRequired, setIsCompleteSettingsRequired] =
    useState(false);
  const [isRecorderUnsupported, setIsRecorderUnsupported] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const { transcribeError } = useTranscribeContext();

  useEffect(function ensureDeviceIdExists() {
    (async () => {
      await userService.getOrCreateDeviceId();
    })();
  }, []);

  useEffect(function checkAndSetIsRecorderUnsupported() {
    if (!navigator.mediaDevices) {
      setIsRecorderUnsupported(true);
    }
  }, []);

  useEffect(function checkIsCompleteSettingsRequired() {
    (async () => {
      const { useOwnApiKey, allowDataCollection, customOpenaiApiKey } =
        await userService.getUserSettings();

      if (!useOwnApiKey && !allowDataCollection) {
        setIsCompleteSettingsRequired(true);
        return;
      }

      if (useOwnApiKey) {
        if (!customOpenaiApiKey) {
          setIsCompleteSettingsRequired(true);
          return;
        }

        const isValidApiKey = await userService.checkIsOpenaiApiKeyValid(
          customOpenaiApiKey
        );
        if (!isValidApiKey) {
          setIsCompleteSettingsRequired(true);
          return;
        }
      }
    })();
  }, []);

  return (
    <div className="h-dvh flex flex-col bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <section className="shrink-0 border-b border-slate-800 px-2 sm:px-6 md:px-8 lg:px-12 py-4">
        <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      </section>

      <section className="flex-1 overflow-y-auto px-2 sm:px-6 md:px-8 lg:px-12 py-6 min-h-0 custom-scrollbar">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          {isRecorderUnsupported && (
            <p className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-base text-red-200">
              瀏覽器不支援或未授權使用麥克風，請重新整理並授權同意只用麥克風，如無法授權請改用最新版本的
              Chrome。
            </p>
          )}

          {!isRecorderUnsupported && completeSettingsRequired && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base text-yellow-100">
              <span>請先開啟設定，完成設定後才能使用轉錄功能。</span>
              <PrimaryButton
                label="開啟設定"
                onClick={() => setIsSettingsOpen(true)}
              />
            </div>
          )}

          {recordingError && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-base text-red-200">
              <p className="font-medium mb-1">錄音錯誤</p>
              <p className="text-red-300 text-sm">{recordingError}</p>
            </div>
          )}

          {transcribeError && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-base text-red-200">
              <p className="font-medium mb-1">轉錄失敗</p>
              <p className="text-red-300 text-sm">{transcribeError}</p>
            </div>
          )}

          <TranscriptBlock />
        </div>
      </section>

      <section className="shrink-0 px-2 sm:px-6 md:px-8 lg:px-12 py-4">
        <ControlBar
          disaplyRecordingError={setRecordingError}
          clearRecordingError={() => setRecordingError(null)}
          displayCompleteSettingsReminder={() =>
            setIsCompleteSettingsRequired(true)
          }
        />
      </section>

      <SettingsModal
        isOpen={isSettingsOpen}
        onModalClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => setIsCompleteSettingsRequired(false)}
      />
    </div>
  );
}
