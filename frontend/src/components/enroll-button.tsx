"use client"

import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'

export default function EnrollButton({ _id, className }: { _id: number, className?: string }) {
    const { data: session } = useSession()
    const isAuthenticated = !!session

    const router = useRouter()

    const handleEnroll = () => {
        if (!isAuthenticated) {
            router.push('/login')
            return
        } else {
            router.push(`/checkout/${_id}`)
        }
    }
    return (
        <Button className={cn("bg-green-600 hover:bg-green-700 text-white cursor-pointer", className)} onClick={handleEnroll}>
            Enroll Now
        </Button>
    )
}
