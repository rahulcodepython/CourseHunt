"use client"

import Loading from '@/components/loading'
import { useAuthStore } from '@/store/auth.store'
import React, { useEffect } from 'react'

export default function PagesLayout({ children }: { children: React.ReactNode }) {
    const [isloading, setIsLoading] = React.useState(true)
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
                const data = await res.json();

                const { user } = data;

                if (user === null) {
                    setIsAuthenticated(false)
                    setUser(null)
                    return
                }

                setIsAuthenticated(true)
                setUser(user)
            } else {
                setIsAuthenticated(false)
                setUser(null)
            }
        }

        handler().finally(() => {
            setIsLoading(false)
        })
    }, [])

    return isloading ? <Loading /> : children

}
