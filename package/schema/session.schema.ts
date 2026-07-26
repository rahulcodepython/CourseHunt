import { z } from "zod";
import type { User } from "./auth.types";

export type SessionUser = User & {
  role?: string;
};

export interface SessionData {
  user: SessionUser;
  session: Record<string, unknown> | null;
}
