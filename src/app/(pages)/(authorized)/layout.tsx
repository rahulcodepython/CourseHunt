"use client"
import { useAuthStore } from '@/store/auth.store'
import React from 'react'

const AuthorizedLayout = ({ children }: { children: React.ReactNode }) => {
    const { setIsAuthenticated, setUser } = useAuthStore()
    return children
}

export default AuthorizedLayout