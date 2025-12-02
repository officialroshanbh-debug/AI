'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface RecentData {
    signups: Array<{
        id: string;
        name: string | null;
        email: string;
        createdAt: string;
        _count: { chats: number };
    }>;
    chats: Array<{
        id: string;
        title: string;
        createdAt: string;
        user: { name: string | null; email: string };
        _count: { messages: number };
    }>;
}

export function RecentActivity({ recent }: { recent: RecentData }) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Signups */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Signups</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recent.signups.length > 0 ? (
                            recent.signups.map((user) => (
                                <div key={user.id} className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="text-xs">
                                            {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {user.name || 'Unknown User'}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-xs">
                                            {user._count.chats} chats
                                        </Badge>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No recent signups
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Chats */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Chats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recent.chats.length > 0 ? (
                            recent.chats.map((chat) => (
                                <div key={chat.id} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium truncate flex-1">
                                            {chat.title}
                                        </p>
                                        <Badge variant="secondary" className="text-xs ml-2">
                                            {chat._count.messages} msgs
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{chat.user.name || chat.user.email}</span>
                                        <span>•</span>
                                        <span>{new Date(chat.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No recent chats
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
