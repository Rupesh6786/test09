
"use client";

import Link from 'next/link';
import type { UserProfileData } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight } from 'lucide-react';

export function PlayerSearchResultCard({ user }: { user: UserProfileData }) {
    return (
        <Link href={`/players/${encodeURIComponent(user.name)}`} className="block group">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 h-full">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <Avatar className="h-16 w-16 border-2 border-accent flex-shrink-0">
                            <AvatarImage src={user.photoURL} alt={user.name} />
                            <AvatarFallback className="text-2xl bg-muted">
                                {user.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="truncate">
                            <h3 className="font-bold text-lg text-foreground truncate">{user.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{user.teamName}</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </CardContent>
            </Card>
        </Link>
    );
}
