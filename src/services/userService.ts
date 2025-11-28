import { localStorageClient, LocalStorageClient } from "./localstorageClient";
import { httpClient } from "./httpClient";
import { USER_INFO_KEYS, CheckIsOpenaiApiKeyValidResponse } from "@/src/types";
import { API_ENDPOINTS } from "@/src/constants";

class UserService {
  private storage: LocalStorageClient;
  constructor() {
    this.storage = localStorageClient;
  }

  async getOrCreateDeviceId(): Promise<string> {
    let deviceId = "";
    try {
      deviceId = await this.storage.get(USER_INFO_KEYS.DEVICE_ID, "");
    } catch (error) {
      console.error("Error getting device ID from localStorage:", error);
      deviceId = "";
    }

    if (!deviceId) {
      deviceId = crypto.randomUUID();
      try {
        await this.storage.set(USER_INFO_KEYS.DEVICE_ID, deviceId);
      } catch (error) {
        console.error(
          "Error creating and setting device ID in localStorage:",
          error
        );
        deviceId = "";
      }
    }

    return deviceId as string;
  }

  async checkHasPersonalApiKey(): Promise<boolean> {
    try {
      const hasPersonalApiKey = await this.storage.get(
        USER_INFO_KEYS.OPENAI_API_KEY,
        null
      );
      return !!hasPersonalApiKey;
    } catch (error) {
      console.error("Error getting personal API key from localStorage:", error);
      return false;
    }
  }

  async checkIsOpenaiApiKeyValid(
    openaiApiKey: string
  ): Promise<CheckIsOpenaiApiKeyValidResponse> {
    const trimmedOpenaiApiKey = openaiApiKey.trim();
    if (!trimmedOpenaiApiKey) {
      return {
        is_api_key_valid: false,
        has_unexpectied_validation_error: true,
      };
    }

    try {
      const response = await httpClient.post<CheckIsOpenaiApiKeyValidResponse>(
        API_ENDPOINTS.CHECK_OPENAI_API_KEY,
        { openai_api_key: trimmedOpenaiApiKey }
      );

      return response;
    } catch (error) {
      console.error("Error checking OpenAI API key:", error);
      throw error;
    }
  }

  async getAndDecodeOpenaiApiKey(): Promise<string> {
    let encodedOpenaiApiKey = "";
    try {
      encodedOpenaiApiKey = await this.storage.get(
        USER_INFO_KEYS.OPENAI_API_KEY,
        null
      );

      if (encodedOpenaiApiKey === null) {
        return "";
      }
    } catch (error) {
      console.error("Error getting OpenAI API key from localStorage:", error);
      return "";
    }

    try {
      const decodedOpenaiApiKey = atob(encodedOpenaiApiKey);
      return decodedOpenaiApiKey;
    } catch (error) {
      console.error("Error decoding OpenAI API key:", error);
      return "";
    }
  }

  async encodeAndSaveOpenaiApiKey(openaiApiKey: string): Promise<void> {
    let encodedOpenaiApiKey = "";
    try {
      encodedOpenaiApiKey = btoa(openaiApiKey);
    } catch (error) {
      console.error("Error encoding OpenAI API key:", error);
      return;
    }

    try {
      await this.storage.set(
        USER_INFO_KEYS.OPENAI_API_KEY,
        encodedOpenaiApiKey
      );
    } catch (error) {
      console.error("Error saving OpenAI API key in localStorage:", error);
    }
  }

  async getIsUsingPersonalApiKey(): Promise<boolean> {
    let isUsingPersonalApiKey = null;
    try {
      isUsingPersonalApiKey = await this.storage.get(
        USER_INFO_KEYS.USE_PERSONAL_API_KEY,
        null
      );
    } catch (error) {
      console.error(
        "Error getting is using personal API key from localStorage:",
        error
      );
      isUsingPersonalApiKey = null;
    }

    if (isUsingPersonalApiKey === null) {
      isUsingPersonalApiKey = true; // Default to true so we can prompt user to set their own api key
      try {
        await this.storage.set(
          USER_INFO_KEYS.USE_PERSONAL_API_KEY,
          isUsingPersonalApiKey
        );
      } catch (error) {
        console.error(
          "Error saving is using personal API key in localStorage:",
          error
        );
      }
    }

    return isUsingPersonalApiKey;
  }

  async saveIsUsingPersonalApiKey(
    isUsingPersonalApiKey: boolean
  ): Promise<void> {
    try {
      await this.storage.set(
        USER_INFO_KEYS.USE_PERSONAL_API_KEY,
        isUsingPersonalApiKey
      );
    } catch (error) {
      console.error(
        "Error saving is using personal API key in localStorage:",
        error
      );
    }
  }

  async getOrSetDefaultConsentDataCollection(): Promise<boolean> {
    let consentDataCollection = null;
    try {
      consentDataCollection = await this.storage.get(
        USER_INFO_KEYS.CONSENT_DATA_COLLECTION,
        null
      );
    } catch (error) {
      console.error(
        "Error getting consent data collection from localStorage:",
        error
      );
      consentDataCollection = null;
    }

    if (consentDataCollection === null) {
      consentDataCollection = false; // Default to false so we can prompt user to consent to data collection
      try {
        await this.storage.set(
          USER_INFO_KEYS.CONSENT_DATA_COLLECTION,
          consentDataCollection
        );
      } catch (error) {
        console.error(
          "Error saving consent data collection in localStorage:",
          error
        );
      }
    }

    return consentDataCollection;
  }

  async saveConsentDataCollection(
    consentDataCollection: boolean
  ): Promise<void> {
    try {
      await this.storage.set(
        USER_INFO_KEYS.CONSENT_DATA_COLLECTION,
        consentDataCollection
      );
    } catch (error) {
      console.error(
        "Error saving consent data collection in localStorage:",
        error
      );
    }
  }
}

export const userService = new UserService();
