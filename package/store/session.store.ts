import { create } from "zustand";
import type { SessionData, SessionUser } from "@package/schema/session.schema";

interface SessionState {
  data: SessionData | null;
  user: SessionUser | null;
  isPending: boolean;
  setSession: (data: SessionData | null) => void;
  setPending: (isPending: boolean) => void;
  updateUser: (user: Partial<SessionUser>) => void;
  clear: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  data: null,
  user: null,
  isPending: true,
  setSession: (data) => set({ data, user: data?.user ?? null, isPending: false }),
  setPending: (isPending) => set({ isPending }),
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
  clear: () => set({ data: null, user: null, isPending: false }),
  clearSession: () => set({ data: null, user: null, isPending: false }),
}));
