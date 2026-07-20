import { Icon } from "@package/components/icon";
import { Button } from '@package/ui/button';

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
            <Icon name="IconLoader2" className="animate-spin inline-block w-5 h-5" />
            <span className="">
                {title || 'Loading...'}
            </span>
        </Button> : children
    )
}

export default LoadingButton