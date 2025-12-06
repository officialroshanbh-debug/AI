
import PusherServer from 'pusher';
import { env } from '@/lib/env';

// Singleton Pusher instance
// Only initialize if keys are present to avoid runtime errors
export const pusherServer = (env.PUSHER_APP_ID && env.PUSHER_KEY && env.PUSHER_SECRET)
    ? new PusherServer({
        appId: env.PUSHER_APP_ID,
        key: env.PUSHER_KEY,
        secret: env.PUSHER_SECRET,
        cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
        useTLS: true,
    })
    : null;
