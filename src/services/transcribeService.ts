import { httpClient } from "./httpClient";
import { API_ENDPOINTS } from "@/src/constants";
import {
  TranscribeParams,
  TranscribeResponse,
  UserSettings,
} from "@/src/types";
import { getFileExtensionFromMimeType } from "@/src/lib/audio-helpers";

export const transcribeService = {
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

    return httpClient.post<TranscribeResponse>(
      API_ENDPOINTS.TRANSCRIBE,
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
  },
};
