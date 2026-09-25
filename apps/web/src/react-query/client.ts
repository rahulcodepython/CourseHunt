import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { z } from "zod";
import { ApiResponse, ApiResponseZod } from "@/schema/common.types";
import { API_CONFIG, ERROR_MESSAGES } from "@/lib/constants/const";
import { useSessionStore } from "@/store/session.store";

// =============================================================================
// Axios Instance
// =============================================================================

const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.DEFAULT_URL,
  withCredentials: true,
});

// Attach Authorization: Bearer <token> header from the Zustand session store.
api.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 from the Go API means the JWT is missing/expired/invalid. Clear the
// store and force the user back to the login page.
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

// =============================================================================
// Request Handler & ApiError
// =============================================================================

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

/**
 * Makes an API request and validates the response using the ApiResponseZod schema.
 * Throws ApiError on HTTP failure or schema validation failure.
 *
 * Backend response shape:
 * { success: boolean, message: string, data?: T }
 */
export async function apiRequest<T>(
  config: AxiosRequestConfig,
  schema: z.ZodType<T>,
): Promise<ApiResponse<T>> {
  try {
    config.headers = {
      ...config.headers,
      "Content-Type": API_CONFIG.CONTENT_TYPE_JSON,
    };

    const response = await api.request(config);
    const responseSchema = ApiResponseZod(schema);

    // Parse and return the validated response
    return responseSchema.parse(response.data);
  } catch (error) {
    let message: string = ERROR_MESSAGES.UNEXPECTED;
    let statusCode = 500;
    let detailedError = String(error);

    // 1. Handle Axios Network/HTTP Errors
    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status || 500;
      message = error.response?.data?.message || error.message;
      detailedError = error.response?.data?.error || error.code || detailedError;
    }
    // 2. Handle Zod Schema Validation Errors
    else if (error instanceof z.ZodError) {
      statusCode = 422;
      message = ERROR_MESSAGES.VALIDATION_FAILED;
      detailedError = JSON.stringify(error.flatten());
    }
    // 3. Handle Standard JS Errors
    else if (error instanceof Error) {
      message = error.message;
    }

    throw new ApiError(message, statusCode, error);
  }
}

// =============================================================================
// Params Helper
// =============================================================================

/**
 * Drops falsy keys (undefined, "", 0, false) from a params object before
 * handing it to axios's `params` option. Axios itself only skips
 * undefined/null, so this replaces the old per-file pattern of
 * `if (params?.x) searchParams.set(...)` — every query-hook that built a
 * URLSearchParams by hand used a truthy check, which also meant "don't send
 * ?search=" for an empty string. This keeps that exact behavior while
 * letting axios handle the actual serialization.
 */
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
