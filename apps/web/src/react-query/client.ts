import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { z } from "zod";
import { ApiResponse, ApiResponseZod } from "@/schema/common.types";
import { API_CONFIG, ERROR_MESSAGES } from "@/lib/const";
import { useSessionStore } from "@/store/session.store";
import useSession from "@/hooks/use-session";

// =============================================================================
// Axios Instance
// =============================================================================

const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? API_CONFIG.DEFAULT_URL,
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
// Request Handler
// =============================================================================

/**
 * Makes an API request and validates the response using the ApiResponseZod schema.
 *
 * Backend response shape:
 * { success: boolean, message: string, data?: T }
 */

export async function apiRequest<T>(config: AxiosRequestConfig, schema: z.ZodType<T>): Promise<ApiResponse<T>> {
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
        let detailedError = String(error);

        // 1. Handle Axios Network/HTTP Errors
        if (axios.isAxiosError(error)) {
            message = error.response?.data?.message || error.message;
            detailedError = error.response?.data?.error || error.code || detailedError;
        }
        // 2. Handle Zod Schema Validation Errors
        else if (error instanceof z.ZodError) {
            message = ERROR_MESSAGES.VALIDATION_FAILED;
        }
        // 3. Handle Standard JS Errors
        else if (error instanceof Error) {
            message = error.message;
        }

        // Return the exact same shape as a successful response
        return {
            success: false,
            message,
            data: null,
            error: detailedError,
        };
    }
}

export default api;