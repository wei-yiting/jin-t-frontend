import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { ApiError } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

class HttpClient {
  private client: AxiosInstance;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
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
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    const isFormData = body instanceof FormData;

    const requestConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...config.headers,
        // Axios automatically sets Content-Type to multipart/form-data when body is FormData
        // so we only need to set it for JSON if it's not FormData
        ...(!isFormData && { "Content-Type": "application/json" }),
      },
    };

    const response = await this.client.post<T>(endpoint, body, requestConfig);
    return response.data;
  }
}

export const httpClient = new HttpClient(BASE_URL || "");
