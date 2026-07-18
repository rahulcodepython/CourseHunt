"use client";

import { Icon } from "@/components/icon";

import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar"
import { Button } from '@package/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@package/ui/dropdown-menu"
import { signOut, useSession } from '@package/auth/auth-client'
import { cn } from '@/lib/utils'

import Link from 'next/link'
import { useRouter } from "next/navigation"
import React from 'react'
import { toast } from "sonner"

const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
]

const Header = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    const { data: session, isPending: isSessionPending } = useSession()
    const isAuthenticated = !!session;
    const user = session?.user;

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const router = useRouter()

    const [isLoggingOut, setIsLoggingOut] = React.useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await signOut()
            router.push("/login")
            toast.success("Logged out successfully")
        } catch {
            toast.error("Failed to log out")
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <header className=''>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center gap-2">
                                <Icon name="IconBook" className="h-8 w-8 text-primary" />
                                CourseHunt
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close IconMenu2' : 'Open IconMenu2'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Icon name="IconMenu2" className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <Icon name="IconX" className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                {
                                    isSessionPending ?
                                        <div className="h-10 w-10 animate-pulse bg-muted rounded-full" /> :
                                        isAuthenticated ? <DropdownMenu>
                                            <DropdownMenuTrigger asChild className="cursor-pointer">
                                                <button className="rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                                    <Avatar>
                                                        <AvatarImage src={user?.image || undefined} />
                                                        <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-56" align="start">
                                                <DropdownMenuGroup>
                                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                                    <Link href="/dashboard">
                                                        <DropdownMenuItem>Dashboard</DropdownMenuItem>
                                                    </Link>
                                                    <Link href="/dashboard/profile">
                                                        <DropdownMenuItem>Profile</DropdownMenuItem>
                                                    </Link>
                                                    {
                                                        session?.user.role === "admin" &&
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <Link href="/adminpanel">
                                                                <DropdownMenuItem>Admin Panel</DropdownMenuItem>
                                                            </Link>
                                                        </>
                                                    }
                                                </DropdownMenuGroup>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem disabled={isLoggingOut} onClick={handleLogout}>
                                                    Log out
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu> : <Link href="/login">
                                            <Button variant="outline">Sign In</Button>
                                        </Link>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

export default Header
