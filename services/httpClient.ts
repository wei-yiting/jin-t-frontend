import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { ApiError } from "@/types";

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
    return response.data;
  }
}

export const httpClient = new HttpClient(BASE_URL || "");
