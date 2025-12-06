import { httpClient, HttpClientType } from "./httpClient";
import { API_ENDPOINTS } from "@/src/constants";
import {
  TranscribeParams,
  TranscribeResponse,
  UserSettings,
  TaskProgressResponse,
} from "@/src/types";
import { getFileExtensionFromMimeType } from "@/src/lib/audio-helpers";

class TranscribeService {
  private httpClient: HttpClientType;
  constructor(httpClient: HttpClientType) {
    this.httpClient = httpClient;
  }

  async transcribe(
    transcribeParams: TranscribeParams,
    userSettings: UserSettings
  ): Promise<TranscribeResponse> {
    const formData = new FormData();
    const extension = getFileExtensionFromMimeType(
      transcribeParams.audioFile.type
    );
    const filename = `recording.${extension}`;
    formData.append("audio_file", transcribeParams.audioFile, filename);

    return this.httpClient.post<TranscribeResponse>(
      API_ENDPOINTS.TRANSCRIBE_TASK,
      formData,
      {
        params: {
          mode: transcribeParams.transcribeMode,
        },
        headers: {
          "X-Device-Id": userSettings.deviceId,
          "X-Consent-Data-Collection":
            userSettings.allowDataCollection.toString(),
          "X-Custom-Openai-Api-Key":
            userSettings.useOwnApiKey && userSettings.customOpenaiApiKey
              ? userSettings.customOpenaiApiKey
              : "",
          "X-Audio-Duration": transcribeParams.audioDuration?.toString() || "",
        },
      }
    );
  }

  async getTaskProgress(taskId: string): Promise<TaskProgressResponse> {
    return this.httpClient.get<TaskProgressResponse>(
      `${API_ENDPOINTS.TRANSCRIBE_TASK}/${taskId}`
    );
  }
}

export const transcribeService = new TranscribeService(httpClient);
