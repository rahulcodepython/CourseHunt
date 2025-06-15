"use client"

import { useAuthStore } from '@/store/authStore'
import React, { useEffect } from 'react'

export default function PagesLayout({ children }: { children: React.ReactNode }) {
    const { setIsAuthenticated, setUser } = useAuthStore()

    useEffect(() => {
        const handler = async () => {
            const res = await fetch('/api/auth/authenticate', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            })

            if (res.ok) {
                const { user } = await res.json()
                setIsAuthenticated(true)
                setUser(user)
            } else {
                setIsAuthenticated(false)
                setUser(null)
            }
        }

        handler()
    }, [])
    return (
        children
    )
}
