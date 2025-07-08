
"use client";

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import type { UserProfileData } from '@/lib/data';
import { Trophy, Award, Medal, Flame } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState<UserProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('totalEarnings', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const leaders = querySnapshot.docs.map(doc => doc.data() as UserProfileData);
        setLeaderboardData(leaders);
      } catch (error) {
        console.error("Error fetching leaderboard data: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);


  const getRankIcon = (rank: number) => {
    const iconBaseClass = "w-6 h-6";
    if (rank === 1) return <Trophy className={cn(iconBaseClass, "text-yellow-400 rank-gold-glow")} />;
    if (rank === 2) return <Award className={cn(iconBaseClass, "text-slate-300 rank-silver-glow")} />;
    if (rank === 3) return <Medal className={cn(iconBaseClass, "text-amber-500 rank-bronze-glow")} />;
    return <span className="font-bold text-lg">{rank}</span>;
  }

  const calculateWinRate = (wins?: number, gamesPlayed?: number) => {
    if (!gamesPlayed || gamesPlayed === 0) return '0%';
    return `${(((wins || 0) / gamesPlayed) * 100).toFixed(0)}%`;
  }
  
  const renderSkeletons = (count: number) => (
    Array.from({ length: count }).map((_, i) => (
      <TableRow key={i}>
        <TableCell className="w-[80px] text-center"><Skeleton className="h-6 w-6 rounded-full mx-auto" /></TableCell>
        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-6 w-32" /></div></TableCell>
        <TableCell className="text-center"><Skeleton className="h-6 w-10 mx-auto" /></TableCell>
        <TableCell className="text-center hidden lg:table-cell"><Skeleton className="h-6 w-10 mx-auto" /></TableCell>
        <TableCell className="text-center hidden lg:table-cell"><Skeleton className="h-6 w-10 mx-auto" /></TableCell>
        <TableCell className="hidden xl:table-cell text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  const renderMobileSkeletons = (count: number) => (
     <div className="space-y-4 md:hidden">
        {Array.from({ length: count }).map((_, i) => (
            <Card key={i} className="bg-card/80 backdrop-blur-sm border-border/50 text-left w-full">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-6" />
                            <Skeleton className="h-12 w-12 rounded-full border-2 border-accent" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0 space-y-2">
                           <Skeleton className="h-5 w-20 ml-auto" />
                           <Skeleton className="h-3 w-12 ml-auto" />
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-2 text-center border-t border-border/50 pt-4">
                        <div className="space-y-2"><Skeleton className="h-5 w-8 mx-auto" /><Skeleton className="h-3 w-10 mx-auto" /></div>
                        <div className="space-y-2"><Skeleton className="h-5 w-8 mx-auto" /><Skeleton className="h-3 w-10 mx-auto" /></div>
                        <div className="space-y-2"><Skeleton className="h-5 w-8 mx-auto" /><Skeleton className="h-3 w-10 mx-auto" /></div>
                    </div>
                </CardContent>
            </Card>
        ))}
     </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold uppercase tracking-wider text-primary text-shadow-primary">
                  Leaderboard
                </h1>
                <p className="text-lg text-muted-foreground mt-2">See who's dominating the arena.</p>
              </div>
              
              {/* Desktop View */}
              <div className="hidden md:block max-w-7xl mx-auto">
                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[80px] text-center">Rank</TableHead>
                                  <TableHead>Player</TableHead>
                                  <TableHead className="text-center">Games</TableHead>
                                  <TableHead className="text-center hidden lg:table-cell">Win Rate</TableHead>
                                  <TableHead className="text-center hidden lg:table-cell">Streak</TableHead>
                                  <TableHead className="hidden xl:table-cell text-center">Joined</TableHead>
                                  <TableHead className="text-right">Winnings</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? renderSkeletons(10) : leaderboardData.map((entry, index) => (
                                <TableRow 
                                    key={entry.uid} 
                                    className="font-medium hover:bg-primary/10 cursor-pointer"
                                    onClick={() => router.push(`/players/${encodeURIComponent(entry.name)}`)}
                                >
                                    <TableCell className="text-center">
                                        <div className="flex justify-center items-center h-full">
                                            {getRankIcon(index + 1)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-lg text-foreground">
                                          <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={entry.photoURL} alt={entry.name} />
                                                <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{entry.name}</span>
                                          </div>
                                    </TableCell>
                                    <TableCell className="text-center font-mono">{entry.totalMatches || 0}</TableCell>
                                    <TableCell className="text-center hidden lg:table-cell font-mono">{calculateWinRate(entry.matchesWon, entry.totalMatches)}</TableCell>
                                    <TableCell className="text-center hidden lg:table-cell font-mono">🔥 {entry.streak || 0}</TableCell>
                                    <TableCell className="hidden xl:table-cell text-center font-mono">{entry.joinedOn ? format(entry.joinedOn.toDate(), 'MMM yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right text-primary text-lg font-bold">
                                        ₹{(entry.totalEarnings || 0).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
              </div>

              {/* Mobile View */}
              <div className="space-y-4 md:hidden">
                {isLoading ? renderMobileSkeletons(10) : leaderboardData.map((entry, index) => (
                  <Link key={entry.uid} href={`/players/${encodeURIComponent(entry.name)}`} className="block">
                      <Card className="bg-card/80 backdrop-blur-sm border-border/50 text-left w-full active:scale-95 transition-transform duration-150">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 text-center">{getRankIcon(index + 1)}</div>
                                    <Avatar className="h-12 w-12 border-2 border-accent">
                                        <AvatarImage src={entry.photoURL} alt={entry.name} />
                                        <AvatarFallback className="text-xl">{entry.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                    <p className="text-lg font-bold text-foreground">{entry.name}</p>
                                    <p className="text-sm text-muted-foreground font-mono">{entry.teamName}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-primary text-lg font-bold">₹{(entry.totalEarnings || 0).toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Winnings</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center border-t border-border/50 pt-4">
                                <div>
                                    <p className="font-bold text-foreground">{entry.totalMatches || 0}</p>
                                    <p className="text-xs text-muted-foreground">Games</p>
                                </div>
                                <div>
                                    <p className="font-bold text-foreground flex items-center justify-center gap-1">
                                        <Flame className="w-4 h-4 text-destructive"/> {entry.streak || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Streak</p>
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">{calculateWinRate(entry.matchesWon, entry.totalMatches)}</p>
                                    <p className="text-xs text-muted-foreground">Win Rate</p>
                                </div>
                            </div>
                        </CardContent>
                      </Card>
                  </Link>
                ))}
              </div>

            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
