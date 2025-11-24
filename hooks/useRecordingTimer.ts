import { useState, useRef, useCallback, useEffect } from "react";

export const useRecordingTimer = () => {
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setDuration(0);
    clearTimer();

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current !== null) {
        setDuration((Date.now() - startTimeRef.current) / 1000);
      }
    }, 500);
  }, [clearTimer]);

  const stopTimer = useCallback(() => {
    clearTimer();
    if (startTimeRef.current !== null) {
      setDuration((Date.now() - startTimeRef.current) / 1000);
    }
  }, [clearTimer]);

  const resetTimer = useCallback(() => {
    clearTimer();
    startTimeRef.current = null;
    setDuration(0);
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    duration,
    startTimer,
    stopTimer,
    resetTimer,
  };
};
