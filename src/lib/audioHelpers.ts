export const getFileExtensionFromMimeType = (mimeType: string): string => {
  if (!mimeType || !mimeType.startsWith("audio/")) {
    return "dat";
  }

  if (mimeType.includes("webm")) {
    return "webm";
  }

  if (mimeType.includes("wav")) {
    return "wav";
  }

  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) {
    return "mp3";
  }

  if (mimeType.includes("ogg") || mimeType.includes("oga")) {
    return "ogg";
  }

  if (mimeType.includes("m4a") || mimeType.includes("mp4")) {
    return "m4a";
  }

  return "dat";
};

export const calculateAudioDuration = (
  startRecordingTimestamp: number
): string => {
  return ((Date.now() - startRecordingTimestamp) / 1000).toFixed(2);
};
