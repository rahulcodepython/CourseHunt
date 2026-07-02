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
	try {
		// Attach the token to the request config headers
		config.headers = {
			...config.headers,
			"Content-Type": "application/json",
		};

		// 3. Make the API request
		const response = await api.request(config);
		const payload = response.data?.data;

		if (schema && payload !== undefined) {
			return schema.parse(payload);
		}

		return payload ?? null;
	} catch (error) {
		const route = `${config.method?.toUpperCase() ?? "REQUEST"} ${config.url}`;
		const message = axios.isAxiosError(error)
			? (error.response?.data?.message ?? error.message)
			: String(error);

		console.error(`[API] ${route} →`, message);
		return null;
	}
}

export default api;
