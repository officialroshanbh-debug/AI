
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

export const Markdown = dynamic(() => import('react-markdown'), {
    loading: () => <Skeleton className="h-4 w-full" />,
    ssr: false, // Markdown usually doesn't need SSR for chat apps (streaming)
});
