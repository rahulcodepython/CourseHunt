import { JwtPayload, JwtPayloadZod } from "@/schema/common.types";

export function decodeJwtPayload(token: string): JwtPayload | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(base64);
        const parsed = JSON.parse(json);
        const validated = JwtPayloadZod.safeParse(parsed);
        return validated.success ? validated.data : (parsed as JwtPayload);
    } catch {
        return null;
    }
}
