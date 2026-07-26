import { create } from "zustand";
import type { SessionData, SessionUser } from "@/package/schema/session.schema";

interface SessionState {
    data: SessionData | null;
    isPending: boolean;
    setSession: (data: SessionData | null) => void;
    setPending: (isPending: boolean) => void;
    updateUser: (user: Partial<SessionUser>) => void;
    clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    data: null,
    isPending: true,
    setSession: (data) => set({ data, isPending: false }),
    setPending: (isPending) => set({ isPending }),
    updateUser: (userData) =>
        set((state) => {
            if (!state.data) return state;
            return {
                data: {
                    ...state.data,
                    user: { ...state.data.user, ...userData },
                },
            };
        }),
    clear: () => set({ data: null, isPending: false }),
}));
