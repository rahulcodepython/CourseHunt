import { UserType } from '@/types/user.type'
import { create } from 'zustand'

type State = {
    isAuthenticated: boolean
    user: Omit<UserType, 'password'> | null
}

type Actions = {
    setUser: (user: State['user']) => void
    setIsAuthenticated: (isAuthenticated: boolean) => void
}

export const useAuthStore = create<State & Actions>((set) => ({
    isAuthenticated: false,
    user: null,
    setUser: (user) => set({ user }),
    setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
}))