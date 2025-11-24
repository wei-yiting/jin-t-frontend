import { httpClient } from "./httpClient";
import { API_ENDPOINTS } from "@/constants";
import { TranscribeRequest, TranscribeResponse } from "@/types";
import { getFileExtensionFromMimeType } from "@/lib/audio-helpers";

export const transcriptionService = {
  async transcribe(request: TranscribeRequest): Promise<TranscribeResponse> {
    const formData = new FormData();

    const extension = getFileExtensionFromMimeType(request.audio_file.type);
    const filename = `recording.${extension}`;

    formData.append("audio_file", request.audio_file, filename);
    formData.append("openai_api_key", request.openai_api_key); // TODO: Remove when supabae db store api key
    formData.append("transcribe_mode", request.transcribe_mode);

    if (request.audio_duration) {
      formData.append("audio_duration", request.audio_duration);
    }

    return httpClient.post<TranscribeResponse>(
      API_ENDPOINTS.TRANSCRIBE,
      formData
    );
  },
};
