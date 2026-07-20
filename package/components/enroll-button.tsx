"use client";

import { useSession } from '@package/auth/auth-client'
import { cn } from "@package/lib/utils"
import { useRouter } from 'next/navigation'
import { Button } from '@package/ui/button'

export default function EnrollButton({ _id, className }: { _id: string | number, className?: string }) {
    const { data: session } = useSession()
    const isAuthenticated = !!session
    const router = useRouter()

    const handleEnroll = () => {
        if (!isAuthenticated) {
            router.push('/login')
            return
        }
        router.push(`/checkout/${_id}`)
    }

    return (
        <Button className={cn("bg-green-600 hover:bg-green-700 text-white cursor-pointer", className)} onClick={handleEnroll}>
            Enroll Now
        </Button>
    )
}
