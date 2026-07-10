import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { ZodSchema } from "zod";

// =============================================================================
// Axios Instance
// =============================================================================

const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
    withCredentials: true,
});

// =============================================================================
// Logging
// =============================================================================

const log = {
    success: (source: string, data: unknown) =>
        process.env.NODE_ENV === "development" && console.log(`[${source}] Success:`, data),
    error: (source: string, error: unknown) =>
        process.env.NODE_ENV === "development" && console.error(`[${source}] Failure:`, error),
};

// =============================================================================
// Request Handler
// =============================================================================

/**
 * Makes an API request and validates the response `data` field using a Zod schema.
 *
 * Backend response shape:
 * { success: boolean, message: string, data?: T }
 *
 * - If `schema` is provided and `response.data.data` exists, it will be validated.
 * - On error, logs the route and error message to console.
 * - Returns `null` on failure.
 */
export async function apiRequest<T>(
    config: AxiosRequestConfig,
    schema?: ZodSchema<T>,
): Promise<T | null> {
    const route = `${config.method?.toUpperCase() ?? "REQUEST"} ${config.url}`;

    try {
        // Ensure requests are always sent as JSON.
        config.headers = {
            ...config.headers,
            "Content-Type": "application/json",
        };

        const response = await api.request(config);
        const payload = response.data?.data;
        const result = schema && payload !== undefined ? schema.parse(payload) : (payload ?? null);

        log.success(`apiRequest ${route}`, result);
        return result;
    } catch (error) {
        const message = axios.isAxiosError(error)
            ? (error.response?.data?.message ?? error.message)
            : String(error);

        log.error(`apiRequest ${route}`, message);
        return null;
    }
}

export default api;