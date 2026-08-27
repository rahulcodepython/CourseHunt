import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AuthCardProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    className?: string;
}

export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
            <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" />
            <div className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-teal-500/10 blur-[120px] animate-pulse" />

            <Card className={cn(
                "relative z-10 w-full max-w-md border-zinc-800 bg-zinc-900/50 shadow-2xl backdrop-blur-xl",
                className,
            )}>
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="size-7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
                            <path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{title}</h1>
                        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
                    </div>
                </CardHeader>
                <CardContent>{children}</CardContent>
            </Card>
        </div>
    );
}
