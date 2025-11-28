import { LOCAL_STORAGE_KEYS } from "@/src/types";

export class LocalStorageClient {
  private client: Storage | null = null;
  private initPromise: Promise<Storage> | null = null;
  private readonly MAX_WAIT_TIME = 15000; // 5 seconds timeout

  private async ensureInitialized(): Promise<Storage> {
    if (this.client) {
      return this.client;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkWindow = () => {
        if (typeof window !== "undefined" && window.localStorage) {
          this.client = window.localStorage;
          resolve(this.client);
        } else {
          const elapsed = Date.now() - startTime;
          if (elapsed >= this.MAX_WAIT_TIME) {
            reject(
              new Error(
                "LocalStorageClient: Timeout waiting for window.localStorage to be available"
              )
            );
          } else {
            setTimeout(checkWindow, 100);
          }
        }
      };

      checkWindow();
    });

    return this.initPromise;
  }

  async get<T>(
    key: (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS],
    defaultValue: T
  ): Promise<T> {
    try {
      const client = await this.ensureInitialized();
      const value = client.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      throw new Error(
        `Error getting value for key ${key} from localStorage: ${error}`
      );
    }
  }

  async set<T>(
    key: (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS],
    value: T
  ): Promise<void> {
    try {
      const client = await this.ensureInitialized();
      client.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new Error(
        `Error setting value for key ${key} in localStorage: ${error}`
      );
    }
  }

  async remove(
    key: (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS]
  ): Promise<void> {
    try {
      const client = await this.ensureInitialized();
      client.removeItem(key);
    } catch (error) {
      throw new Error(
        `Error removing value for key ${key} from localStorage: ${error}`
      );
    }
  }
}

export const localStorageClient = new LocalStorageClient();
