"use client";

import { useEffect, useRef, useState } from "react";

type WaveformAnimationProps = {
  mediaStream?: MediaStream | null;
  audioBlob?: Blob | null;
  isRecording?: boolean;
};

export default function WaveformAnimation({
  mediaStream,
  audioBlob,
  isRecording = false,
}: WaveformAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [audioUrl, setAudioUrl] = useState<string>("");

  // For recording state: real-time audio visualization
  useEffect(() => {
    if (!isRecording || !mediaStream) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    let audioContext: AudioContext | undefined;
    let analyser: AnalyserNode | undefined;
    let dataArray: Uint8Array | undefined;

    const setupAudio = async () => {
      try {
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        const draw = () => {
          if (!analyser || !dataArray || !ctx) return;

          animationRef.current = requestAnimationFrame(draw);
          // @ts-ignore - TypeScript strict mode issue with Uint8Array
          analyser.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, rect.width, rect.height);

          const barWidth = Math.max(1, (rect.width / dataArray.length) * 2);
          const gap = 1;

          for (let i = 0; i < dataArray.length; i++) {
            const value = dataArray[i];
            const barHeight = (value / 255) * rect.height * 0.9;

            const x = i * (barWidth + gap);
            const y = rect.height - barHeight;

            // Create gradient color based on amplitude
            const alpha = Math.max(0.3, value / 255);
            ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`;
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        };

        draw();
      } catch (error) {
        console.error("Error setting up recording audio visualization:", error);
      }
    };

    setupAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext) {
        audioContext.close().catch(console.error);
      }
    };
  }, [isRecording, mediaStream]);

  // For paused state: static waveform visualization + audio player
  useEffect(() => {
    if (!audioBlob || isRecording) {
      setAudioUrl("");
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const setupStaticWaveform = async () => {
      try {
        const audioContext = new AudioContext();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const channelData = audioBuffer.getChannelData(0);
        const samplesPerPixel = Math.floor(channelData.length / rect.width);

        ctx.clearRect(0, 0, rect.width, rect.height);

        // Find max amplitude for normalization
        let maxAmplitude = 0;
        for (let i = 0; i < channelData.length; i++) {
          const absValue = Math.abs(channelData[i]);
          if (absValue > maxAmplitude) {
            maxAmplitude = absValue;
          }
        }

        // Draw static waveform
        for (let i = 0; i < rect.width; i++) {
          const startSample = Math.floor(i * samplesPerPixel);
          const endSample = Math.min(
            startSample + samplesPerPixel,
            channelData.length
          );

          // Calculate RMS (Root Mean Square) for better visualization
          let sumSquares = 0;
          let count = 0;
          for (let j = startSample; j < endSample; j++) {
            sumSquares += channelData[j] * channelData[j];
            count++;
          }
          const rms = Math.sqrt(sumSquares / count);

          // Normalize and amplify for better visibility
          const normalizedAmplitude =
            maxAmplitude > 0
              ? Math.min(1, (rms / maxAmplitude) * 2) // Amplify by 2x for better visibility
              : 0;

          // Use similar height calculation as recording state (0.9 of height)
          const barHeight = Math.max(
            2,
            normalizedAmplitude * rect.height * 0.9
          );

          const x = i;
          const y = rect.height / 2 - barHeight / 2;

          // Use similar color as recording state with alpha based on amplitude
          const alpha = Math.max(0.3, normalizedAmplitude);
          ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`;
          ctx.fillRect(x, y, 1, barHeight);
        }

        audioContext.close().catch(console.error);
      } catch (error) {
        console.error("Error creating static waveform:", error);
      }
    };

    setupStaticWaveform();

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioBlob, isRecording]);

  // For paused state, show waveform + audio player
  if (audioBlob && !isRecording) {
    return (
      <div className="flex-1 flex items-center gap-3 h-14 min-w-0">
        <canvas ref={canvasRef} className="flex-1 h-14 min-w-0" />
        {audioUrl && (
          <audio
            src={audioUrl}
            controls
            className="w-32 h-10 shrink-0"
            preload="metadata"
          >
            <source src={audioUrl} type="audio/webm" />
            <source src={audioUrl} type="audio/wav" />
            <source src={audioUrl} type="audio/mpeg" />
            您的瀏覽器不支持音頻播放。
          </audio>
        )}
      </div>
    );
  }

  // For recording state, show canvas visualizer
  if (isRecording) {
    return (
      <div className="flex-1 h-14 flex items-center min-w-0">
        <canvas ref={canvasRef} className="w-full h-14" />
      </div>
    );
  }

  // Empty state
  return (
    <div className="flex-1 h-14 flex items-center justify-center">
      <span className="text-slate-500 text-sm">準備中...</span>
    </div>
  );
}
