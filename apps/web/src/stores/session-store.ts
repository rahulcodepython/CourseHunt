import { create } from 'zustand'

interface SessionUser {
  id: string
  name: string
  email: string
  image?: string | null
  role?: string
  banned?: boolean
  [key: string]: unknown
}

interface Session {
  user: SessionUser
  session: Record<string, unknown> | null
}

interface SessionState {
  data: Session | null
  isPending: boolean
  setSession: (data: Session | null) => void
  setPending: (isPending: boolean) => void
  updateUser: (user: Partial<SessionUser>) => void
  clear: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  data: null,
  isPending: true,
  setSession: (data) => set({ data, isPending: false }),
  setPending: (isPending) => set({ isPending }),
  updateUser: (userData) =>
    set((state) => {
      if (!state.data) return state
      return {
        data: {
          ...state.data,
          user: { ...state.data.user, ...userData },
        },
      }
    }),
  clear: () => set({ data: null, isPending: false }),
}))
