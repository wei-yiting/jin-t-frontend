"use client";

import { useState, useEffect, useRef } from "react";

type Status =
  | "unsupported"
  | "no-api-key"
  | "idle"
  | "recording"
  | "audio-captured"
  | "transcribing"
  | "finished-transcription";

export default function Home() {
  const [status, setStatus] = useState<Status>("unsupported");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTextCopied, setIsTextCopied] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>(
    "gpt-4o-mini-transcribe"
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const uploadAudioFileExtensionRef = useRef<string | null>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem("openai_api_key");
    if (!storedApiKey) {
      setStatus("no-api-key");
      return;
    }

    if (!navigator.mediaDevices) {
      setStatus("unsupported");
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorderRef.current = new MediaRecorder(stream);
    });
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (mediaRecorderRef.current) {
      const handleDataAvailable = (event: BlobEvent) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable
      );

      return () => {
        mediaRecorderRef.current?.removeEventListener(
          "dataavailable",
          handleDataAvailable
        );
      };
    }
  }, [mediaRecorderRef.current]);

  useEffect(() => {
    if (mediaRecorderRef.current) {
      const handleStop = () => {
        const audioMimeType = mediaRecorderRef.current!.mimeType;
        const audioBlob = new Blob(chunksRef.current, { type: audioMimeType });
        setAudioBlob(audioBlob);
        chunksRef.current = [];
      };

      mediaRecorderRef.current.addEventListener("stop", handleStop);

      return () => {
        mediaRecorderRef.current?.removeEventListener("stop", handleStop);
      };
    }
  }, [mediaRecorderRef.current]);

  useEffect(() => {
    if (audioBlob) {
      setAudioUrl(URL.createObjectURL(audioBlob));

      return () => {
        URL.revokeObjectURL(audioUrl ?? "");
        setAudioUrl(null);
      };
    }
  }, [audioBlob]);

  const handleStartRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }
    mediaRecorderRef.current.start();
    setStatus("recording");
  };

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }
    mediaRecorderRef.current.stop();
    setStatus("audio-captured");
  };

  const handleTranscribeAudio = async () => {
    if (!audioBlob || !localStorage.getItem("openai_api_key")) {
      return;
    }

    setStatus("transcribing");

    const formData = new FormData();
    if (uploadAudioFileExtensionRef.current) {
      formData.append(
        "audio_file",
        audioBlob,
        "recording." + uploadAudioFileExtensionRef.current
      );
    } else {
      formData.append("audio_file", audioBlob, "recording.webm");
    }

    formData.append("openai_api_key", localStorage.getItem("openai_api_key")!);
    formData.append("model_name", selectedModel);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/transcribe`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      const newTranscription = data.transcription;

      // 如果已經有轉錄結果，則追加；否則設置新結果
      setResultText((prev) => {
        if (prev) {
          return prev + "\n" + newTranscription;
        }
        return newTranscription;
      });

      setStatus("finished-transcription");
    } catch (error) {
      console.error(error);
      setStatus("audio-captured");
    }
  };

  const handleContinueRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }
    mediaRecorderRef.current.start();
    setStatus("recording");
  };

  const handleResetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setResultText("");
    chunksRef.current = [];
    uploadAudioFileExtensionRef.current = null;
    setStatus("idle");
  };

  const handleUploadAudio = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      const fileExtension = file.name.split(".").pop();
      if (!fileExtension) {
        return;
      }
      uploadAudioFileExtensionRef.current = fileExtension.toLowerCase();
      const blob = new Blob([file], { type: file.type });
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setStatus("audio-captured");
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      return;
    }
    localStorage.setItem("openai_api_key", apiKeyInput.trim());
    setIsSettingsOpen(false);
    setApiKeyInput("");

    if (!navigator.mediaDevices) {
      setStatus("unsupported");
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorderRef.current = new MediaRecorder(stream);
    });
    setStatus("idle");
  };

  const getStatusText = () => {
    switch (status) {
      case "unsupported":
        return "瀏覽器不支援或未授權使用麥克風";
      case "no-api-key":
        return "尚未設定 OpenAI API Key";
      case "idle":
        return "待機中";
      case "recording":
        return "語音錄製中";
      case "audio-captured":
        return "音檔已錄製";
      case "transcribing":
        return "轉換中";
      case "finished-transcription":
        return "轉換完成";
      default:
        return "未知";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "unsupported":
        return "bg-slate-800/20 text-slate-400 border border-slate-700/30";
      case "no-api-key":
        return "bg-yellow-900/20 text-yellow-300 border border-yellow-700/30";
      case "idle":
        return "bg-slate-700/30 text-slate-300 border border-slate-600/30";
      case "recording":
        return "bg-slate-800/40 text-slate-200 border border-slate-500/40 animate-pulse";
      case "audio-captured":
        return "bg-slate-700/30 text-slate-300 border border-slate-600/30";
      case "transcribing":
        return "bg-slate-800/30 text-slate-300 border border-slate-600/30";
      case "finished-transcription":
        return "bg-slate-700/40 text-slate-200 border border-slate-500/40";
      default:
        return "bg-slate-800/20 text-slate-400 border border-slate-700/30";
    }
  };

  const handleCopyTranscription = async () => {
    if (resultText) {
      try {
        await navigator.clipboard.writeText(resultText);
        setIsTextCopied(true);
        setTimeout(() => {
          setIsTextCopied(false);
        }, 2000);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-800 to-slate-950 font-sans overflow-hidden">
      <main className="h-full w-full max-w-5xl flex flex-col gap-3 sm:gap-4 py-4 sm:py-6 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex flex-row items-center justify-between shrink-0 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              晶晶體
            </h1>
            <p className="text-xs text-slate-400 mt-1 sm:mt-1.5">
              中英夾雜語音輸入工具
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
              <span className="text-xs font-medium text-slate-400">狀態：</span>
              <span
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium ${getStatusColor()}`}
              >
                {getStatusText()}
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-300 transition-colors"
              title="設定"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* API Key 提示 */}
        {status === "no-api-key" && (
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-md p-3 sm:p-4 text-center shrink-0">
            <p className="text-yellow-300 text-xs sm:text-sm mb-2 sm:mb-3">
              請先設定 OpenAI API Key 才能使用語音轉文字功能
            </p>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-yellow-700/50 hover:bg-yellow-700/70 text-yellow-100 font-medium rounded-md border border-yellow-600/50 hover:border-yellow-500/50 transition-all duration-200 text-xs sm:text-sm"
            >
              開啟設定
            </button>
          </div>
        )}

        {/* 錄音控制區域 */}
        <div className="w-full shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* 音訊播放器 */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-md p-2 sm:p-3 flex-1 order-2 sm:order-0">
              {audioUrl ? (
                <audio src={audioUrl} controls className="w-full" />
              ) : (
                <div className="h-10 flex items-center text-slate-500 text-xs pl-2">
                  尚無錄音
                </div>
              )}
            </div>
            {/* 開始/停止錄音按鈕 */}
            {status === "idle" && (
              <div className="flex flex-row gap-2 sm:gap-3 shrink-0 order-1 sm:order-0">
                <button
                  onClick={handleStartRecording}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-md border border-slate-600 hover:border-slate-500 transition-all duration-200 text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  開始錄音
                </button>
                <label className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-md border border-slate-600 hover:border-slate-500 transition-all duration-200 text-xs sm:text-sm shrink-0 cursor-pointer flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  上傳音檔
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleUploadAudio}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            {status === "recording" && (
              <button
                onClick={handleStopRecording}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-md border border-slate-600 hover:border-slate-500 transition-all duration-200 text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 order-1 sm:order-0"
              >
                <svg
                  className="w-4 h-4 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                停止錄音
              </button>
            )}
            {status === "audio-captured" && (
              <button
                onClick={handleResetRecording}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-slate-200 font-medium rounded-md border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 text-xs sm:text-sm shrink-0 flex items-center justify-center gap-2 order-1 sm:order-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                重新錄音
              </button>
            )}
            {status === "finished-transcription" && (
              <div className="flex flex-row gap-2 sm:gap-3 shrink-0 order-1 sm:order-0">
                <button
                  onClick={handleContinueRecording}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-md border border-slate-600 hover:border-slate-500 transition-all duration-200 text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  繼續錄音
                </button>
                <button
                  onClick={handleResetRecording}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-slate-200 font-medium rounded-md border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  重新開始
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 轉錄按鈕區域 */}
        <div className="w-full shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={handleTranscribeAudio}
            disabled={!audioBlob || status === "transcribing"}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:text-slate-500 text-slate-100 font-medium rounded-md border border-slate-600 hover:border-slate-500 disabled:border-slate-700/50 transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2"
          >
            {status === "transcribing" ? (
              <svg
                className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
            語音轉文字
          </button>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={status === "transcribing"}
            className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-md text-slate-100 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent"
          >
            <option value="gpt-4o-mini-transcribe">
              GPT-4o Mini Transcribe
            </option>
            <option value="gpt-4o-transcribe">GPT-4o Transcribe</option>
          </select>
        </div>

        {/* 轉錄結果 */}
        <div className="w-full flex-1 flex flex-col min-h-0">
          <div className="flex flex-row items-center justify-between mb-1.5 shrink-0">
            <label className="text-sm sm:text-base font-medium text-slate-300">
              文字結果：
            </label>
            {resultText && (
              <div className="flex items-center gap-2">
                {isTextCopied ? (
                  <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-600/60 border border-slate-500/50 text-slate-100 text-xs sm:text-sm font-medium rounded-md flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    已複製
                  </span>
                ) : (
                  <button
                    onClick={handleCopyTranscription}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600/50 text-slate-300 hover:text-slate-200 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5"
                  >
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    複製文字
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-md p-3 sm:p-4 flex-1 overflow-hidden flex flex-col">
            {resultText ? (
              <textarea
                value={resultText || ""}
                onChange={(e) => setResultText(e.target.value)}
                className="w-full h-full bg-transparent text-slate-200 leading-relaxed text-xs sm:text-sm resize-none outline-none overflow-y-auto"
                placeholder="尚無轉錄結果"
              />
            ) : (
              <div className="text-slate-500 text-xs sm:text-sm">
                尚無轉錄結果
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 設定面板 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-100">
                設定
              </h2>
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setApiKeyInput("");
                }}
                className="text-slate-400 hover:text-slate-300 transition-colors"
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
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 sm:px-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveApiKey();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleSaveApiKey}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-md border border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm"
                >
                  套用
                </button>
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setApiKeyInput("");
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-slate-200 font-medium rounded-md border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
