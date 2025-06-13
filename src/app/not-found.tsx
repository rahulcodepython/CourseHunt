"use client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center text-center px-4">
            <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight text-primary sm:text-7xl">
                404 - Page Not Found
            </h1>
            <p className="mt-6 text-pretty text-lg font-medium text-muted-foreground sm:text-xl/8">
                Sorry, we couldn't find the page you're looking for.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-y-3 gap-x-6">
                <Button variant="secondary" asChild className="group">
                    <Button onClick={() => window.history.back()} className="flex items-center">
                        <ArrowLeft
                            className="me-2 ms-0 opacity-60 transition-transform group-hover:-translate-x-0.5"
                            size={16}
                            strokeWidth={2}
                            aria-hidden="true"
                        />
                        Go back
                    </Button>
                </Button>
                <Link href="/">
                    <Button className="">
                        Take me home
                    </Button>
                </Link>
            </div>
        </div>
    )
}