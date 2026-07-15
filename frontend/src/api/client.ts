import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { z, ZodSchema } from "zod";
import { ApiResponse, ApiResponseZod } from "@/types/common.types";

// =============================================================================
// Axios Instance
// =============================================================================

const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
    withCredentials: true,
});

// =============================================================================
// Request Handler
// =============================================================================

/**
 * Makes an API request and validates the response using the ApiResponseZod schema.
 *
 * Backend response shape:
 * { success: boolean, message: string, data?: T }
 *
 * - If `schema` is provided and `response.data.data` exists, it will be validated.
 * - On error, logs the route and error message to console.
 * - Returns `null` on failure.
 */

export async function apiRequest<T>(config: AxiosRequestConfig, schema: z.ZodType<T>): Promise<ApiResponse<T>> {
    try {
        config.headers = {
            ...config.headers,
            "Content-Type": "application/json",
        };

        const response = await api.request(config);
        const responseSchema = ApiResponseZod(schema);

        // Parse and return the validated response
        return responseSchema.parse(response.data);

    } catch (error) {
        let message = "An unexpected error occurred";
        let detailedError = String(error);

        // 1. Handle Axios Network/HTTP Errors
        if (axios.isAxiosError(error)) {
            message = error.response?.data?.message || error.message;
            detailedError = error.response?.data?.error || error.code || detailedError;
        }
        // 2. Handle Zod Schema Validation Errors
        else if (error instanceof z.ZodError) {
            message = "Response Validation Failed";
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