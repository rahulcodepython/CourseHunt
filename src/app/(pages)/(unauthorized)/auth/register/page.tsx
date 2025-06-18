"use client"

import registerNewUser from '@/api/create.user.api'
import LoadingButton from '@/components/loading-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiHandler } from '@/hooks/useApiHandler'
import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'sonner'

export default function RegisterPage() {
    const [firstName, setFirstName] = React.useState('')
    const [lastName, setLastName] = React.useState('')
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')

    const { setUser, setIsAuthenticated } = useAuthStore()

    const { isLoading, callApi } = useApiHandler()

    const router = useRouter()

    const handleSubmit = async () => {
        const response = await callApi(() => registerNewUser(firstName, lastName, email, password), () => {
            setEmail('')
            setPassword('')
            setFirstName('')
            setLastName('')
        })

        if (response) {
            toast.success(response.message || 'Registration successful')

            setUser(response.user)
            setIsAuthenticated(true)

            router.push(response.user.role === 'admin' ? '/admin' : '/user')
        }
    }



    return (
        <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
            <div
                className="bg-card m-auto h-fit w-full max-w-md rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]">
                <div className="p-8 pb-6 flex flex-col gap-8">
                    <div className="text-center">
                        <h1 className="mb-1 text-xl font-semibold">Sign Up to CourseHunt</h1>
                        <p className="text-sm">Welcome aboard! Create your account to continue</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="firstName"
                                className="block text-sm">
                                First Name
                            </Label>
                            <Input
                                type="text"
                                required
                                name="firstName"
                                id="firstName"
                                placeholder='Enter your first name'
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="lastName"
                                className="block text-sm">
                                Last Name
                            </Label>
                            <Input
                                type="text"
                                required
                                name="lastName"
                                id="lastName"
                                placeholder='Enter your last name'
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>

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
                                placeholder='example@email.com'
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
                                placeholder='********'
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
                            Do have an account ?
                        </span>
                        <Link href="/auth/login">Log In</Link>
                    </p>
                </div>
            </div>
        </section>
    )
}