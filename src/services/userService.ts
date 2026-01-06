import { localStorageClient, LocalStorageClient } from "./localstorageClient";
import { httpClient } from "./httpClient";
import {
  USER_INFO_KEYS,
  ValidateOpenaiApiKeyResponse,
  UserSettings,
} from "@/src/types";
import { API_ENDPOINTS } from "@/src/constants";
import { encryptApiKey } from "@/src/lib/apiKeyEncryptor";

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
      const hasEncryptedApiKey = await this.storage.get(
        USER_INFO_KEYS.ENCRYPTED_OPENAI_API_KEY,
        null
      );

      const hasMaskedApiKey = await this.storage.get(
        USER_INFO_KEYS.MASKED_OPENAI_API_KEY,
        null
      );

      return !!hasEncryptedApiKey && !!hasMaskedApiKey;
    } catch (error) {
      console.error("Error getting personal API key from localStorage:", error);
      return false;
    }
  }

  async checkIsOpenaiApiKeyValid(
    openaiApiKey: string
  ): Promise<ValidateOpenaiApiKeyResponse> {
    const trimmedOpenaiApiKey = openaiApiKey.trim();
    if (!trimmedOpenaiApiKey) {
      return {
        is_api_key_valid: false,
        has_unexpectied_validation_error: true,
      };
    }

    try {
      const response = await httpClient.post<ValidateOpenaiApiKeyResponse>(
        API_ENDPOINTS.VALIDATE_OPENAI_API_KEY,
        { encrypted_openai_api_key: encryptApiKey(trimmedOpenaiApiKey) }
      );

      return response;
    } catch (error) {
      console.error("Error checking OpenAI API key:", error);
      return {
        is_api_key_valid: false,
        has_unexpectied_validation_error: true,
      };
    }
  }

  async validateSavedOpenaiApiKey(): Promise<boolean> {
    const encryptedCustomOpenaiApiKey =
      await this.getEncryptedCustomOpenaiApiKey();
    const maskedCustomOpenaiApiKey = await this.getMaskedCustomOpenaiApiKey();

    if (!maskedCustomOpenaiApiKey || !encryptedCustomOpenaiApiKey) {
      return false;
    }

    try {
      const response = await httpClient.post<ValidateOpenaiApiKeyResponse>(
        API_ENDPOINTS.VALIDATE_OPENAI_API_KEY,
        { encrypted_openai_api_key: encryptedCustomOpenaiApiKey }
      );

      return response.is_api_key_valid;
    } catch (error) {
      console.error("Error checking OpenAI API key:", error);
      return false;
    }
  }

  async getEncryptedCustomOpenaiApiKey(): Promise<string> {
    try {
      const encryptedCustomOpenaiApiKey = await this.storage.get(
        USER_INFO_KEYS.ENCRYPTED_OPENAI_API_KEY,
        null
      );

      if (!encryptedCustomOpenaiApiKey) {
        return "";
      }

      return encryptedCustomOpenaiApiKey;
    } catch (error) {
      console.error(
        "Error getting encrypted custom OpenAI API key from localStorage:",
        error
      );
      return "";
    }
  }

  async encryptAndSaveOpenaiApiKey(customOpenaiApiKey: string): Promise<void> {
    try {
      await this.storage.set(
        USER_INFO_KEYS.ENCRYPTED_OPENAI_API_KEY,
        encryptApiKey(customOpenaiApiKey)
      );
    } catch (error) {
      console.error("Error saving OpenAI API key in localStorage:", error);
    }
  }

  async getMaskedCustomOpenaiApiKey(): Promise<string> {
    try {
      const maskedCustomOpenaiApiKey = await this.storage.get(
        USER_INFO_KEYS.MASKED_OPENAI_API_KEY,
        null
      );

      if (!maskedCustomOpenaiApiKey) {
        return "";
      }

      return maskedCustomOpenaiApiKey;
    } catch (error) {
      console.error(
        "Error getting masked custom OpenAI API key from localStorage:",
        error
      );
      return "";
    }
  }

  async saveMaskedCustomOpenaiApiKey(
    customOpenaiApiKey: string
  ): Promise<void> {
    const maskedApiKey = `sk-${".".repeat(30)}${customOpenaiApiKey.slice(-4)}`;
    try {
      await this.storage.set(
        USER_INFO_KEYS.MASKED_OPENAI_API_KEY,
        maskedApiKey
      );
    } catch (error) {
      console.error(
        "Error saving masked custom OpenAI API key in localStorage:",
        error
      );
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
      consentDataCollection = false; // Default to false to make sure user fully consent to data collection
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

  async getUserSettings(): Promise<UserSettings> {
    const isUsingPersonalApiKey = await this.getIsUsingPersonalApiKey();

    const userSettings: UserSettings = {
      deviceId: await this.getOrCreateDeviceId(),
      useOwnApiKey: isUsingPersonalApiKey,
      allowDataCollection: await this.getOrSetDefaultConsentDataCollection(),
      encryptedCustomOpenaiApiKey: await this.getEncryptedCustomOpenaiApiKey(),
      maskedCustomOpenaiApiKey: await this.getMaskedCustomOpenaiApiKey(),
    };

    return userSettings;
  }
}

export const userService = new UserService();
