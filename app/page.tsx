"use client";

import { useState, useEffect, useRef } from "react";

type Status =
  | "unsupported"
  | "idle"
  | "recording"
  | "audio-captured"
  | "transcribing";

export default function Home() {
  const [status, setStatus] = useState<Status>("unsupported");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

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
    formData.append("audio_file", audioBlob, "recording.webm");
    try {
      const response = await fetch("http://localhost:8001/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setTranscription(data.transcription);
    } catch (error) {
      console.error(error);
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <p>Status: {status}</p>
        {audioUrl && <audio src={audioUrl} controls />}

        {status === "idle" && (
          <button onClick={handleStartRecording}>Start Recording</button>
        )}
        {status === "recording" && (
          <button onClick={handleStopRecording}>Stop Recording</button>
        )}
        {audioBlob && (
          <button onClick={handleTranscribeAudio}>Transcribe Audio</button>
        )}
        {status === "transcribing" && <p>Transcribing...</p>}
        {
          <p>
            Transcription:{" "}
            {transcription ? transcription : "No transcription available"}
          </p>
        }
      </main>
    </div>
  );
}
