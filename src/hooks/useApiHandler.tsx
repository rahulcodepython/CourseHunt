import { useCallback, useState } from 'react';
import { toast } from 'sonner';

type ApiFunction<T = any> = () => Promise<T>;
type OnFinallyFunction = () => void;

export function useApiHandler<T = any>() {
    const [isLoading, setIsLoading] = useState(false);

    const callApi = useCallback(
        async (apiFunction: ApiFunction<T>, onFinally?: OnFinallyFunction): Promise<T | null> => {
            setIsLoading(true);
            try {
                const result = await apiFunction();
                return result;
            } catch (error: any) {
                toast.error(error.message as string);
                return null;
            } finally {
                setIsLoading(false);
                if (onFinally) onFinally();
            }
        },
        []
    );

    return { isLoading, callApi };
}
