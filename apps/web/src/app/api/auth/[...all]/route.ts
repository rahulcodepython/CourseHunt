import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { AUTH_CONFIG } from "@/lib/const";

export const { GET, POST } = toNextJsHandler(auth);

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(req: Request) {
    const origin = req.headers.get("origin") || "";
    
    // Check if origin is allowed
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(",") 
        : [AUTH_CONFIG.DEFAULT_APP_URL, "http://localhost:3000"];
        
    const allowed = allowedOrigins.includes(origin);
    
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": allowed ? origin : "",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
        },
    });
}