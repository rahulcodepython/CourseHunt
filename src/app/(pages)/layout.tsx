"use client"

import { useAuthStore } from '@/store/auth.store'
import { Loader2 } from 'lucide-react'
import React, { useEffect } from 'react'

export default function PagesLayout({ children }: { children: React.ReactNode }) {
    const [isloading, setIsLoading] = React.useState(true)
    const { setIsAuthenticated, setUser, user, isAuthenticated } = useAuthStore()

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

                if (user) {
                    setIsAuthenticated(true)
                    setUser(user)
                }
                setIsAuthenticated(false)
                setUser(null)
            } else {
                setIsAuthenticated(false)
                setUser(null)
            }
        }

        handler().finally(() => {
            setIsLoading(false)
        })
    }, [])

    return isloading ? <main className='h-screen flex items-center justify-center'>
        <div className="flex gap-2 items-center justify-center">
            <Loader2 className="animate-spin h-6 w-6" />
            <p>Loading...</p>
        </div>
    </main>
        : children

}
