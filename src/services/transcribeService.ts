import { httpClient, HttpClientType } from "./httpClient";
import { API_ENDPOINTS } from "@/src/constants";
import {
  TranscribeParams,
  UserSettings,
  TranscribeProgressResponse,
  BeginTranscribeResponse,
} from "@/src/types";
import { getFileExtensionFromMimeType } from "@/src/lib/audio-helpers";

class TranscribeService {
  private httpClient: HttpClientType;
  constructor(httpClient: HttpClientType) {
    this.httpClient = httpClient;
  }

  async beginTranscribe(
    transcribeParams: TranscribeParams,
    userSettings: UserSettings
  ): Promise<BeginTranscribeResponse> {
    const formData = new FormData();
    const extension = getFileExtensionFromMimeType(
      transcribeParams.audioFile.type
    );
    const filename = `recording.${extension}`;
    formData.append("audio_file", transcribeParams.audioFile, filename);

    return this.httpClient.post<BeginTranscribeResponse>(
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

  async getTranscribeProgress(
    taskId: string
  ): Promise<TranscribeProgressResponse> {
    return this.httpClient.get<TranscribeProgressResponse>(
      `${API_ENDPOINTS.TRANSCRIBE_TASK}/${taskId}`
    );
  }
}

export const transcribeService = new TranscribeService(httpClient);
