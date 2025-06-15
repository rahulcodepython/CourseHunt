"use client"

import loginUser from '@/api/login.api'
import LoadingButton from '@/components/loading-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiHandler } from '@/hooks/useApiHandler'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'sonner'

export default function LoginPage() {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')

    const { setUser, setIsAuthenticated } = useAuthStore()

    const { isLoading, callApi } = useApiHandler()

    const router = useRouter()

    const handleSubmit = async () => {
        const response = await callApi(() => loginUser(email, password), () => {
            setEmail('')
            setPassword('')
        })

        if (response) {
            toast.success(response.message || 'Login successful')

            setUser(response.user)
            setIsAuthenticated(true)

            router.push(response.user.role === 'admin' ? '/admin' : '/user')
        }
    }



    return (
        <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
            <div
                className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]">
                <div className="p-8 pb-6 flex flex-col gap-4">
                    <div className="text-center">
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Sign In to CourseHunt</h1>
                        <p className="text-sm">Welcome back! Sign in to continue</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="block text-sm">
                                Email
                            </Label>
                            <Input
                                type="email"
                                required
                                name="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="pwd"
                                    className="text-title text-sm">
                                    Password
                                </Label>
                            </div>
                            <Input
                                type="password"
                                required
                                name="pwd"
                                id="pwd"
                                className="input sz-md variant-mixed"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <LoadingButton isLoading={isLoading} title="Signing in..." className="w-full">
                            <Button className="w-full" onClick={handleSubmit}>Sign In</Button>
                        </LoadingButton>
                    </div>
                </div>

                <div className="bg-muted rounded-(--radius) border p-3">
                    <p className="text-accent-foreground text-center text-sm space-x-4">
                        <span>
                            Don't have an account ?
                        </span>
                        <Link href="/auth/signup">Create account</Link>
                    </p>
                </div>
            </div>
        </section>
    )
}