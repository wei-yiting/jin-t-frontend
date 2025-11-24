import { STORAGE_KEYS } from "@/constants";

//TODO: Currently using local storage, will migrate to backend later
export const userService = {
  getApiKey(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.OPENAI_API_KEY);
  },

  setApiKey(apiKey: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.OPENAI_API_KEY, apiKey.trim());
  },
};
