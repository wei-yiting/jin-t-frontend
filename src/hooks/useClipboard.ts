import { useState, useCallback } from "react";

export const useClipboard = (timeout = 2000) => {
  const [showIsCopied, setShowIsCopied] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string) => {
      if (!navigator?.clipboard) {
        console.warn("Clipboard not supported");
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setShowIsCopied(true);

        setTimeout(() => {
          setShowIsCopied(false);
        }, timeout);

        return true;
      } catch (error) {
        console.error("Copy failed", error);
        return false;
      }
    },
    [timeout]
  );

  return { showIsCopied, copyToClipboard };
};
