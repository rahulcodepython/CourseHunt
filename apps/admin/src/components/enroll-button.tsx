"use client";

import { useSessionStore } from '@/store/session.store'
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function EnrollButton({ _id, className }: { _id: string | number, className?: string }) {
    const session = useSessionStore((s) => s.data)
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
