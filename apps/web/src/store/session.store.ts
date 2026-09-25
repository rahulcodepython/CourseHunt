import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SessionData, SessionRecord, SessionUser } from "@/schema/session.schema";

export interface SessionPayload {
  user: SessionUser | null;
  session: SessionRecord | null;
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

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "coursehunt-session-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      partialize: (state) => ({
        data: state.data,
        user: state.user,
        token: state.token,
        mustChangePassword: state.mustChangePassword,
        roles: state.roles,
        permissions: state.permissions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isPending = !Boolean(state.user && state.token);
        }
      },
    },
  ),
);
