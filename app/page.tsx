"use client";

import { useState, useEffect, useRef } from "react";

type Status =
  | "unsupported"
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const uploadAudioFileExtensionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices) {
      setStatus("unsupported");
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);
      });
      setStatus("idle");
    }
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
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
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
    if (!audioBlob) {
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
    try {
      const response = await fetch("http://localhost:8001/transcribe", {
        method: "POST",
        body: formData,
      });
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

  const getStatusText = () => {
    switch (status) {
      case "unsupported":
        return "不支援";
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
      <main className="h-full w-full max-w-5xl flex flex-col gap-4 py-6 px-6 sm:px-8 lg:px-12">
        {/* 標題區域 */}
        <div className="text-center shrink-0">
          <h1 className="text-4xl font-bold tracking-tight text-slate-100 mb-1">
            晶晶體
          </h1>
          <p className="text-sm text-slate-400">中英夾雜語音輸入工具</p>
        </div>

        {/* 狀態顯示 */}
        <div className="flex items-center justify-center gap-3 shrink-0">
          <span className="text-sm font-medium text-slate-400">狀態：</span>
          <span
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${getStatusColor()}`}
          >
            {getStatusText()}
          </span>
        </div>

        {/* 錄音控制區域 */}
        <div className="w-full shrink-0">
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            輸入的音檔：
          </label>
          <div className="flex items-center gap-3">
            {/* 音訊播放器 */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-md p-3 flex-1">
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
              <>
                <button
                  onClick={handleStartRecording}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-md border border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm shrink-0 flex items-center gap-2"
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
                <label className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-md border border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm shrink-0 cursor-pointer flex items-center gap-2">
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
              </>
            )}
            {status === "recording" && (
              <button
                onClick={handleStopRecording}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-md border border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm flex items-center gap-2 shrink-0"
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
                className="px-6 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-slate-200 font-medium rounded-md border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 text-sm shrink-0 flex items-center gap-2"
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
              <>
                <button
                  onClick={handleContinueRecording}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-md border border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm shrink-0 flex items-center gap-2"
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
                  className="px-6 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-slate-200 font-medium rounded-md border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 text-sm shrink-0 flex items-center gap-2"
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
              </>
            )}
          </div>
        </div>

        {/* 轉錄按鈕區域 */}
        <div className="w-full shrink-0">
          <button
            onClick={handleTranscribeAudio}
            disabled={!audioBlob || status === "transcribing"}
            className="w-full px-6 py-3.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:text-slate-500 text-slate-100 font-medium rounded-md border border-slate-600 hover:border-slate-500 disabled:border-slate-700/50 transition-all duration-200 text-base flex items-center justify-center gap-2"
          >
            {status === "transcribing" ? (
              <svg
                className="animate-spin h-5 w-5"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
            語音轉文字
          </button>
        </div>

        {/* 轉錄結果 */}
        <div className="w-full flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1.5 shrink-0">
            <label className="text-base font-medium text-slate-300">
              文字結果：
            </label>
            {resultText && (
              <div className="flex items-center gap-2">
                {isTextCopied ? (
                  <span className="px-3 py-1.5 bg-slate-600/60 border border-slate-500/50 text-slate-100 text-sm font-medium rounded-md flex items-center gap-1.5">
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    已複製
                  </span>
                ) : (
                  <button
                    onClick={handleCopyTranscription}
                    className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600/50 text-slate-300 hover:text-slate-200 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5"
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    複製文字
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-md p-4 flex-1 overflow-hidden flex flex-col">
            {resultText ? (
              <textarea
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                className="w-full h-full bg-transparent text-slate-200 leading-relaxed text-sm resize-none outline-none overflow-y-auto"
                placeholder="尚無轉錄結果"
              />
            ) : (
              <div className="text-slate-500 text-sm">尚無轉錄結果</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
