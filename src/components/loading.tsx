import { Loader2 } from 'lucide-react'

const Loading = () => {
    return (
        <main className='h-screen flex items-center justify-center'>
            <div className="flex gap-2 items-center justify-center">
                <Loader2 className="animate-spin h-6 w-6" />
                <p>Loading...</p>
            </div>
        </main>
    )
}

export default Loading