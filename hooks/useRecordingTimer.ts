import { useState, useRef, useCallback, useEffect } from "react";

const UPDATE_INTERVAL_MS = 500;

export const useRecordingTimer = () => {
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedDurationRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateDuration = useCallback(() => {
    if (startTimeRef.current === null) {
      setDuration(accumulatedDurationRef.current);
      return;
    }

    const elapsed =
      accumulatedDurationRef.current +
      (Date.now() - startTimeRef.current) / 1000;
    setDuration(elapsed);
  }, []);

  const startInterval = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(updateDuration, UPDATE_INTERVAL_MS);
  }, [clearTimer, updateDuration]);

  const startTimer = useCallback(() => {
    accumulatedDurationRef.current = 0;
    startTimeRef.current = Date.now();
    setDuration(0);
    startInterval();
  }, [startInterval]);

  const pauseTimer = useCallback(() => {
    if (startTimeRef.current === null) {
      return;
    }

    accumulatedDurationRef.current +=
      (Date.now() - startTimeRef.current) / 1000;
    startTimeRef.current = null;
    setDuration(accumulatedDurationRef.current);
    clearTimer();
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    if (startTimeRef.current !== null) {
      return;
    }

    startTimeRef.current = Date.now();
    startInterval();
  }, [startInterval]);

  const stopTimer = useCallback(() => {
    if (startTimeRef.current !== null) {
      accumulatedDurationRef.current +=
        (Date.now() - startTimeRef.current) / 1000;
      startTimeRef.current = null;
    }

    clearTimer();
    setDuration(accumulatedDurationRef.current);
    return accumulatedDurationRef.current;
  }, [clearTimer]);

  const resetTimer = useCallback(() => {
    clearTimer();
    accumulatedDurationRef.current = 0;
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
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  };
};
