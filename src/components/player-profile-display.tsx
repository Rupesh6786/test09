
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Check, Flame, DollarSign, Target, UserPlus, MessageSquare, Users, History, Trophy, Gamepad2, Loader2 } from 'lucide-react';
import type { UserProfileData, UserRegistration } from '@/lib/data';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { PubgIcon } from './icons/pubg-icon';
import { FreeFireIcon } from './icons/freefire-icon';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

function StatCard({ title, value, children }: { title: string; value: string | number; children: React.ReactNode }) {
    return (
        <div className="bg-card/80 rounded-lg p-3 text-center">
            <div className="text-muted-foreground text-xs uppercase tracking-wider">{title}</div>
            <div className="text-xl font-bold flex items-center justify-center gap-2 mt-1">
                {children}
                <span>{value}</span>
            </div>
        </div>
    );
}

const performanceData = [
  { name: 'Jan', perf: 4 }, { name: 'Feb', perf: 3 }, { name: 'Mar', perf: 5 },
  { name: 'Apr', perf: 6 }, { name: 'May', perf: 8 }, { name: 'Jun', perf: 7 },
];

interface PlayerProfileDisplayProps {
    profile: UserProfileData;
    registrations: UserRegistration[];
    isCurrentUser?: boolean;
    isUploading?: boolean;
    handleFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef?: React.RefObject<HTMLInputElement>;
    onEditClick?: () => void;
}

export function PlayerProfileDisplay({ 
    profile, 
    registrations, 
    isCurrentUser = false,
    isUploading = false,
    handleFileChange,
    fileInputRef,
    onEditClick
}: PlayerProfileDisplayProps) {

    const winRate = (profile.totalMatches ?? 0) > 0 ? (((profile.matchesWon ?? 0) / profile.totalMatches!) * 100).toFixed(1) + '%' : '0%';
    
    const onAvatarClick = () => {
        if (isCurrentUser && !isUploading && fileInputRef?.current) {
            fileInputRef.current.click();
        }
    }

    const GameIcon = () => {
        switch (profile.preferredGame) {
            case 'PUBG':
                return <PubgIcon className="w-8 h-8 text-primary" />;
            case 'Free Fire':
                return <FreeFireIcon className="w-8 h-8 text-primary" />;
            default:
                return <Gamepad2 className="w-8 h-8 text-primary" />;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto text-foreground">
             {isCurrentUser && (
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl font-bold tracking-wider text-primary font-headline">BATTLEBUCKS</span>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={onEditClick}><Settings className="w-6 h-6" /></Button>
                </div>
             )}

            <div className="flex flex-col md:flex-row items-center gap-6">
                <div 
                    className={`relative group w-28 h-28 md:w-40 md:h-40 flex-shrink-0 ${isCurrentUser ? 'cursor-pointer' : ''}`}
                    onClick={onAvatarClick}
                >
                    <Avatar className="w-full h-full rounded-lg border-4 border-primary/50">
                        <AvatarImage src={profile.photoURL || `https://placehold.co/160x160.png`} alt={profile.name} />
                        <AvatarFallback className="rounded-lg text-4xl">{profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     {isCurrentUser && (
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : 'Change'}
                        </div>
                     )}
                    {isCurrentUser && handleFileChange && (
                        <Input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg"
                            className="hidden"
                            disabled={isUploading}
                        />
                    )}
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center md:justify-start gap-2">
                        {profile.name}
                        <Check className="w-7 h-7 text-blue-500 fill-current bg-white rounded-full p-1" />
                    </h1>
                    <p className="text-muted-foreground mt-1 max-w-prose">{profile.bio || 'New challenger in the Arena!'}</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-4 mt-2 text-muted-foreground">
                        <p className="text-sm flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Member since {profile.joinedOn ? format(profile.joinedOn.toDate(), 'MMM yyyy') : 'N/A'}
                        </p>
                        <Separator orientation="vertical" className="h-4 hidden sm:block" />
                        <p className="text-sm flex items-center gap-2">
                            <Gamepad2 className="w-4 h-4" />
                            Game UID: <span className="font-mono font-bold text-foreground">{profile.gameId}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <StatCard title="Total Matches" value={profile.totalMatches ?? 0}><History className="w-4 h-4 text-muted-foreground"/></StatCard>
                <StatCard title="Matches Won" value={profile.matchesWon ?? 0}><Trophy className="w-4 h-4 text-muted-foreground"/></StatCard>
                <StatCard title="Win Rate" value={winRate}><Target className="w-4 h-4 text-muted-foreground"/></StatCard>
                <StatCard title="Earnings" value={`₹${(profile.totalEarnings ?? 0).toLocaleString()}`}><DollarSign className="w-4 h-4 text-muted-foreground"/></StatCard>
                <StatCard title="Win Streak" value={profile.streak ?? 0}><Flame className="w-4 h-4 text-muted-foreground"/></StatCard>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card/80">
                        <CardHeader><CardTitle>Game Statistics</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex justify-between p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                    <GameIcon />
                                    <div>
                                        <div className="text-xs text-muted-foreground">Preferred Game</div>
                                        <div className="font-bold">{profile.preferredGame || 'Not Set'}</div>
                                    </div>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div className="font-bold text-2xl">3.98</div>
                                    <div className="text-xs text-muted-foreground">Kill/Death</div>
                                </div>
                                <div>
                                    <div className="font-bold text-2xl">47</div>
                                    <div className="text-xs text-muted-foreground">MVPs</div>
                                </div>
                             </div>
                             <div>
                                <h4 className="text-sm font-semibold mb-2 text-center">Recent Performance</h4>
                                <ResponsiveContainer width="100%" height={80}>
                                    <LineChart data={performanceData}>
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}/>
                                        <Line type="monotone" dataKey="perf" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                             </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-3 space-y-6">
                    <Card className="bg-card/80">
                        <CardHeader><CardTitle>Registrations</CardTitle></CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                            {registrations.length > 0 ? registrations.map(reg => (
                               <div key={reg.id} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/50 p-3 rounded-md transition-colors w-full">
                                    <div className="flex-grow">
                                        <p className="font-bold">{reg.tournamentTitle}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Registered on {reg.registeredAt ? format(reg.registeredAt.toDate(), 'PPP') : 'Date not available'}
                                        </p>
                                    </div>
                                    <Badge variant={reg.paymentStatus === 'Confirmed' ? 'success' : 'warning'} className="self-start sm:self-center">
                                        {reg.paymentStatus}
                                    </Badge>
                               </div>
                            )) : <p className="text-muted-foreground text-center py-4">This player hasn't registered for any tournaments yet.</p>}
                           </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/80">
                        <CardHeader><CardTitle>Social + Community</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex items-center justify-around text-center">
                               <div>
                                   <div className="text-xl font-bold">789</div>
                                   <div className="text-sm text-muted-foreground">Followers</div>
                               </div>
                               <div>
                                   <div className="text-xl font-bold">659</div>
                                   <div className="text-sm text-muted-foreground">Following</div>
                               </div>
                           </div>
                           <div className="flex flex-col sm:flex-row gap-4">
                                <Button className="w-full"><UserPlus className="mr-2"/>Add Friend</Button>
                                <Button variant="secondary" className="w-full"><MessageSquare className="mr-2"/>Send Message</Button>
                           </div>
                           <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5"/>
                                    <span className="font-semibold">{profile.teamName}</span>
                                </div>
                                <div className="flex -space-x-2">
                                    <Avatar className="h-6 w-6 border-2 border-card"><AvatarImage src="https://placehold.co/40x40.png" /></Avatar>
                                    <Avatar className="h-6 w-6 border-2 border-card"><AvatarImage src="https://placehold.co/40x40.png" /></Avatar>
                                    <Avatar className="h-6 w-6 border-2 border-card"><AvatarImage src="https://placehold.co/40x40.png" /></Avatar>
                                </div>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
