import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { ApiError } from "@/src/types";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

class HttpClient {
  private client: AxiosInstance;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 60000, // 60 seconds for file uploads
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        let errorMessage = "An unknown error occurred";

        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const data = error.response.data as {
            detail?: string;
            message?: string;
          };
          errorMessage = data.detail || data.message || error.message;
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = "Network error or server unavailable";
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage = error.message;
        }

        const apiError: ApiError = {
          message: errorMessage,
          code: error.response?.status?.toString(),
        };

        return Promise.reject(apiError);
      }
    );
  }

  async post<T>(
    endpoint: string,
    body: FormData | object,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const isFormData = body instanceof FormData;

    // For FormData, don't set Content-Type at all - axios will set it with boundary
    // For JSON, explicitly set Content-Type
    const headers = isFormData
      ? config?.headers
      : {
          "Content-Type": "application/json",
          ...config?.headers,
        };

    const response = await this.client.post<T>(endpoint, body, {
      ...config,
      headers,
    });
    return response.data;
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(endpoint, config);
    if (endpoint.startsWith("/transcribe-tasks")) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/f35e24fa-e6e7-428f-a9d6-25a05c1c60f1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "httpClient.ts:get:response",
            message: "http:get:response",
            data: {
              endpoint,
              status: response.status,
              dataType: typeof response.data,
              dataKeys:
                response.data && typeof response.data === "object"
                  ? Object.keys(response.data as Record<string, unknown>)
                  : null,
              dataLength:
                typeof response.data === "string" ? response.data.length : null,
              contentType: response.headers?.["content-type"] ?? null,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "pre-fix",
            hypothesisId: "H2",
          }),
        }
      ).catch(() => {});
      // #endregion
    }
    return response.data;
  }
}

export const httpClient = new HttpClient(BASE_URL || "");
export type HttpClientType = HttpClient;
