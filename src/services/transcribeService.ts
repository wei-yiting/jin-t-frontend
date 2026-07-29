import { httpClient, HttpClientType } from "./httpClient";
import { API_ENDPOINTS } from "@/src/constants";
import {
  TranscribeParams,
  UserSettings,
  BeginTranscribeResponse,
  StreamEventResponse,
} from "@/src/types";
import { getFileExtensionFromMimeType } from "@/src/lib/audioHelpers";

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
            userSettings.useOwnApiKey &&
            userSettings.encryptedCustomOpenaiApiKey
              ? userSettings.encryptedCustomOpenaiApiKey
              : "",
          "X-Audio-Duration": transcribeParams.audioDuration?.toString() || "",
        },
      }
    );
  }

  async getTranscribeProgress(
    taskId: string,
    lastId: string = "0-0"
  ): Promise<StreamEventResponse> {
    return this.httpClient.get<StreamEventResponse>(
      `${API_ENDPOINTS.TRANSCRIBE_TASK}/${taskId}`,
      {
        params: { last_id: lastId },
      }
    );
  }
}

export const transcribeService = new TranscribeService(httpClient);
