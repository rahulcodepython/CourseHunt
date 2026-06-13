import { authClient } from "@/lib/auth-client";

const CACHE_KEY = "cache-jwt";
const EXPIRY_KEY = "cache-jwt-expiry";
const DURATION_50_MINUTES = 50 * 60 * 1000;

const getToken = async (): Promise<string> => {
	const cachedToken = sessionStorage.getItem(CACHE_KEY);
	const cachedExpiry = sessionStorage.getItem(EXPIRY_KEY);
	const now = Date.now();

	// Check if the token exists and is still valid
	if (cachedToken && cachedExpiry && now < parseInt(cachedExpiry, 10)) {
		return cachedToken;
	}

	const { data, error } = await authClient.token();
	if (error) throw new Error(error.message);
	if (!data?.token) throw new Error("No token found");

	// Calculate the new expiry timestamp
	const expiryTime = now + DURATION_50_MINUTES;

	// Save token and expiry timestamp to session storage
	sessionStorage.setItem(CACHE_KEY, data.token);
	sessionStorage.setItem(EXPIRY_KEY, expiryTime.toString());

	return data.token;
};

export default getToken;
