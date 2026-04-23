import { apiRequest } from "./client";
import type {
  LoginUserPayload,
  LoginUserResponse,
  RegisterUserPayload,
  RegisterUserResponse,
} from "./types";

export const authService = {
  register(payload: RegisterUserPayload) {
    return apiRequest<RegisterUserResponse>("/users/register", {
      method: "POST",
      body: payload,
    });
  },

  login(payload: LoginUserPayload) {
    return apiRequest<LoginUserResponse>("/users/login", {
      method: "POST",
      body: payload,
    });
  },
};
