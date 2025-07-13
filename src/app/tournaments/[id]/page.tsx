

"use client";

import { useEffect, useState, useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Tournament } from '@/lib/data';
import { Loader2, Calendar, Trophy, Coins, Users, ShieldCheck, Gamepad2, User, UserCheck } from 'lucide-react';
import { TournamentBracket } from '@/components/tournament-bracket';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

function PrizeCard({ rank, amount }: { rank: string, amount: number }) {
    const getRankDetails = () => {
        switch (rank) {
            case '1st Place':
                return { iconColor: "text-yellow-400", borderColor: "border-yellow-400/50" };
            case '2nd Place':
                return { iconColor: "text-slate-400", borderColor: "border-slate-400/50" };
            case '3rd Place':
                return { iconColor: "text-amber-600", borderColor: "border-amber-600/50" };
            default:
                return { iconColor: "text-foreground", borderColor: "border-border" };
        }
    }
    const { iconColor, borderColor } = getRankDetails();

  return (
    <Card className={cn('relative overflow-hidden border-2', borderColor)}>
      <CardContent className="p-4 text-center">
        <Trophy className={cn("w-20 h-20 mx-auto mb-2", iconColor)} />
        <p className="text-lg font-bold">{rank}</p>
        <p className="text-2xl font-bold text-primary">₹{amount.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const tournamentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const unsubscribe = onSnapshot(tournamentRef, (docSnap) => {
      if (docSnap.exists()) {
        const tournamentData = { id: docSnap.id, ...docSnap.data() } as Tournament;
        setTournament(tournamentData);
      } else {
        console.error("Tournament not found!");
        setTournament(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching tournament data: ", error);
      setTournament(null);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [tournamentId]);

  const prizeDistribution = useMemo(() => {
    if (!tournament || !tournament.prizeDistribution) return [];
    
    const ratios = tournament.prizeDistribution.split(':').map(Number);
    const totalRatio = ratios.reduce((acc, ratio) => acc + ratio, 0);

    if (totalRatio === 0) return [];

    return ratios.map(ratio => Math.floor((ratio / totalRatio) * tournament.prizePool));
  }, [tournament]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!tournament) {
    return notFound();
  }
  
  const slotsAllotted = tournament.slotsAllotted || 0;
  const slotsPercentage = (slotsAllotted / tournament.slotsTotal) * 100;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16 md:py-24 bg-muted/20">
        <div className="container mx-auto px-4 max-w-7xl space-y-8">
          
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2">
                   <p className="text-accent font-semibold">{tournament.game} Tournament</p>
                    <h1 className="font-headline text-3xl md:text-5xl font-bold uppercase tracking-wider text-primary text-shadow-primary">
                      {tournament.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                        <div className="flex items-center text-muted-foreground"><Calendar className="w-5 h-5 mr-2 text-primary" /><span>{tournament.date} @ {tournament.time}</span></div>
                        <div className="flex items-center text-muted-foreground">{tournament.teamType === 'Solo' ? <User className="w-5 h-5 mr-2 text-primary" /> : <Users className="w-5 h-5 mr-2 text-primary" />}<span>Mode: <span className="font-bold text-foreground">{tournament.teamType}</span></span></div>
                        <div className="flex items-center text-muted-foreground"><Gamepad2 className="w-5 h-5 mr-2 text-primary" /><span>Game: <span className="font-bold text-foreground">{tournament.game}</span></span></div>
                    </div>
                </div>
                 <div className="text-center bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Prize Pool</div>
                    <div className="text-5xl font-bold text-primary text-shadow-primary">₹{tournament.prizePool.toLocaleString()}</div>
                    <Button asChild className="w-full mt-4" size="lg">
                        <Link href={`/tournaments/${tournament.id}/register`}>Register (₹{tournament.entryFee})</Link>
                    </Button>
                 </div>
              </div>
            </CardContent>
          </Card>

          {prizeDistribution.length > 0 && (
            <div>
              <h2 className="text-2xl font-headline text-accent mb-4 text-center">Prize Distribution</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <PrizeCard rank="1st Place" amount={prizeDistribution[0]} />
                {prizeDistribution.length > 1 && <PrizeCard rank="2nd Place" amount={prizeDistribution[1]} />}
                {prizeDistribution.length > 2 && <PrizeCard rank="3rd Place" amount={prizeDistribution[2]} />}
              </div>
            </div>
          )}

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
             <Tabs defaultValue="rules" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="bracket">Bracket</TabsTrigger>
                  <TabsTrigger value="rules">Rules</TabsTrigger>
                  <TabsTrigger value="teams">Teams</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="bracket">
                  <TournamentBracket tournament={tournament} />
                </TabsContent>
                <TabsContent value="rules">
                    <div className="p-4 prose prose-invert max-w-none">
                        <h4 className="font-bold flex items-center mb-2 text-lg"><ShieldCheck className="w-5 h-5 mr-2 text-accent" /> Rules & Regulations</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            {tournament.rules.map((rule, i) => <li key={i}>{rule}</li>)}
                        </ul>
                    </div>
                </TabsContent>
                <TabsContent value="teams">
                     <div className="space-y-2">
                        <div className="mb-4">
                            <Progress value={slotsPercentage} className="h-2" />
                            <p className="text-center text-sm text-muted-foreground mt-2">{slotsAllotted} of {tournament.slotsTotal} slots filled</p>
                        </div>
                        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {tournament.confirmedTeams && tournament.confirmedTeams.map(team => (
                                <li key={team.teamName} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                    <UserCheck className="w-4 h-4 text-primary shrink-0" />
                                    <span className="truncate font-medium">{team.teamName}</span>
                                </li>
                            ))}
                        </ul>
                     </div>
                </TabsContent>
              </CardContent>
             </Tabs>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
