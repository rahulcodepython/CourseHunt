import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import React from 'react';

const LoadingButton = ({
    isLoading,
    children,
    className,
    title,
}: {
    isLoading: boolean;
    children: React.ReactNode;
    className?: string;
    title?: string;
}) => {
    return (
        isLoading ? <Button className={className} disabled={true}>
            <Loader2 className="animate-spin inline-block w-4 h-4" />
            <span className="">
                {title || 'Loading...'}
            </span>
        </Button> : children
    )
}

export default LoadingButton