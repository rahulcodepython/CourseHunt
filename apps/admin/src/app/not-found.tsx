import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground mb-8">The page you are looking for does not exist.</p>
            <Link href="/" className="text-primary hover:underline font-medium">
                Go to Dashboard
            </Link>
        </div>
    );
}
