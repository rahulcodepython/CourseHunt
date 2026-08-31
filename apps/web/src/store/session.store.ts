import { create } from "zustand";
import type { SessionData, SessionUser } from "@/schema/session.schema";

export interface SessionPayload {
  user: SessionUser | null;
  session: Record<string, unknown> | null;
  roles: string[];
  permissions: string[];
  token: string | null;
  mustChangePassword: boolean;
}

interface SessionState {
  data: SessionData | null;
  user: SessionUser | null;
  token: string | null;
  mustChangePassword: boolean;
  isPending: boolean;
  roles: string[];
  permissions: string[];
  setSessionPayload: (payload: SessionPayload) => void;
  updateUser: (user: Partial<SessionUser>) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  data: null,
  user: null,
  token: null,
  mustChangePassword: false,
  isPending: true,
  roles: [],
  permissions: [],
  setSessionPayload: (payload) =>
    set({
      data: payload.user ? { user: payload.user, session: payload.session } : null,
      user: payload.user,
      token: payload.token,
      mustChangePassword: payload.mustChangePassword,
      roles: payload.roles,
      permissions: payload.permissions,
      isPending: false,
    }),
  updateUser: (userData) =>
    set((state) => {
      if (!state.data) return state;
      const updatedUser = { ...state.data.user, ...userData };
      return {
        data: {
          ...state.data,
          user: updatedUser,
        },
        user: updatedUser,
      };
    }),
  clear: () =>
    set({
      data: null,
      user: null,
      token: null,
      mustChangePassword: false,
      isPending: false,
      roles: [],
      permissions: [],
    }),
}));
