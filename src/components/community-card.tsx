
"use client";

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Community } from '@/lib/data';
import { Users, ArrowRight } from 'lucide-react';

export function CommunityCard({ community }: { community: Community }) {
    return (
        <Link href={`/community/${community.id}`} className="group block h-full">
            <Card className="h-full text-center p-6 bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 flex flex-col items-center justify-between gap-4">
                <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24 border-2 border-accent">
                        <AvatarImage src={community.avatar} alt={community.name} />
                        <AvatarFallback className="text-4xl bg-muted">
                            {community.avatar ? community.name.charAt(0) : <Users className="w-12 h-12 text-muted-foreground" />}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <h3 className="font-bold text-lg text-foreground">{community.name}</h3>
                        <p className="text-sm text-muted-foreground">{community.members} members</p>
                    </div>
                </div>
                <div className="flex items-center text-primary font-semibold text-sm group-hover:underline">
                    View Community <ArrowRight className="ml-2 h-4 w-4" />
                </div>
            </Card>
        </Link>
    );
}
