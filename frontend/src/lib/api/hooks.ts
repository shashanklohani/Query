"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { authService } from "./auth";
import { filesService } from "./files";
import type {
  LoginUserPayload,
  QueryPdfPayload,
  RegisterUserPayload,
  UploadPdfResponse,
} from "./types";

export const queryKeys = {
  userPdfs: (userId: string) => ["user-pdfs", userId] as const,
};

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterUserPayload) => authService.register(payload),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginUserPayload) => authService.login(payload),
  });
}

export function useUserPdfs(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.userPdfs(userId),
    queryFn: () => filesService.getUserPdfs(userId),
    enabled: enabled && Boolean(userId),
  });
}

type UploadPdfVariables = {
  file: File;
  token: string;
  userId: string;
};

export function useUploadPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, token }: UploadPdfVariables) =>
      filesService.uploadPdf(file, token),
    onSuccess: (_response: UploadPdfResponse, variables: UploadPdfVariables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.userPdfs(variables.userId),
      });
    },
  });
}

type QueryPdfVariables = QueryPdfPayload & {
  token: string;
};

export function useQueryPdf() {
  return useMutation({
    mutationFn: ({ token, ...payload }: QueryPdfVariables) =>
      filesService.queryPdf(payload, token),
  });
}
