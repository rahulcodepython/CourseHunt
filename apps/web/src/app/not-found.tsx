import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { ROUTES } from "@/lib/const";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-16">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-col items-center gap-2 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon name="search" className="size-7" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
                    <p className="text-sm text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
                    </p>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Button asChild>
                        <Link href={ROUTES.HOME}>
                            <Icon name="home" className="size-4" />
                            Back to home
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
