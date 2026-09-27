import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { z } from "zod";
import { ApiResponse, ApiResponseZod } from "@/schema/common.types";
import { API_CONFIG, ERROR_MESSAGES } from "@/lib/constants/const";
import { useSessionStore } from "@/store/session.store";

export const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.DEFAULT_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useSessionStore.getState().clear();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth/login")) {
        window.location.assign("/auth/login");
      }
    }
    return Promise.reject(error);
  },
);

export class ApiError extends Error {
  constructor(
    public override message: string,
    public statusCode: number,
    public rawError?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export async function request<T>(
  config: AxiosRequestConfig,
  schema: z.ZodType<T>,
): Promise<T> {
  try {
    const response = await api.request<ApiResponse<T>>(config);
    if (response.data && !response.data.success) {
      const message =
        response.data.error ||
        response.data.message ||
        ERROR_MESSAGES.UNEXPECTED;
      throw new ApiError(message, response.status, response.data);
    }

    const parsed = ApiResponseZod(schema).safeParse(response.data);

    if (!parsed.success) {
      throw new ApiError(
        ERROR_MESSAGES.VALIDATION_FAILED,
        response.status,
        parsed.error,
      );
    }

    return (parsed.data.data ?? null) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        ERROR_MESSAGES.UNEXPECTED;
      throw new ApiError(message, error.response?.status || 500, error);
    }
    throw new ApiError(ERROR_MESSAGES.UNEXPECTED, 500, error);
  }
}

export const apiRequest = request;

export function compactParams<T extends Record<string, string | number | boolean | null | undefined>>(
  params?: T,
): Partial<T> | undefined {
  if (!params) return undefined;
  const out: Partial<T> = {};
  for (const key of Object.keys(params) as (keyof T)[]) {
    const val = params[key];
    if (val !== undefined && val !== null && val !== "") {
      out[key] = val;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export default api;
