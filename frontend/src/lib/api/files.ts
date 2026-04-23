import { apiRequest } from "./client";
import type {
  GetUserPdfsResponse,
  QueryPdfPayload,
  QueryPdfResponse,
  UploadPdfResponse,
} from "./types";

export const filesService = {
  getUserPdfs(userId: string) {
    return apiRequest<GetUserPdfsResponse>(`/files/users/${userId}/pdfs`);
  },

  uploadPdf(file: File, token: string) {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<UploadPdfResponse>("/files/upload-pdf", {
      method: "POST",
      body: formData,
      token,
    });
  },

  queryPdf(payload: QueryPdfPayload, token: string) {
    return apiRequest<QueryPdfResponse>("/files/query", {
      method: "POST",
      body: payload,
      token,
    });
  },
};
