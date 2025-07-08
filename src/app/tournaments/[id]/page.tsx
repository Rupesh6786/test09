
"use client";

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import type { Tournament, BracketTeam, UserRegistration } from '@/lib/data';
import { Loader2, Calendar, Trophy, Coins, Users, ShieldCheck, Gamepad2, User } from 'lucide-react';
import { TournamentBracket } from '@/components/tournament-bracket';
import { Separator } from '@/components/ui/separator';

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const tournamentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [confirmedTeams, setConfirmedTeams] = useState<BracketTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    // Listener 1: Tournament document
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const unsubTournament = onSnapshot(tournamentRef, (docSnap) => {
      if (docSnap.exists()) {
        const tournamentData = { id: docSnap.id, ...docSnap.data() } as Tournament;
        setTournament(tournamentData);
      } else {
        console.error("Tournament not found!");
        setTournament(null);
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Error fetching tournament data: ", error);
      setTournament(null);
      setIsLoading(false);
    });

    // Listener 2: Confirmed registrations for the tournament
    const registrationsRef = collection(db, 'registrations');
    const q = query(registrationsRef, where('tournamentId', '==', tournamentId), where('paymentStatus', '==', 'Confirmed'));
    const unsubRegistrations = onSnapshot(q, (querySnapshot) => {
        const teams = querySnapshot.docs.map(doc => {
            const reg = doc.data() as UserRegistration;
            return {
                teamName: reg.teamName,
                gameIds: reg.gameIds,
            };
        });
        setConfirmedTeams(teams);
        // Only set loading false here, after we have registrations data
        setIsLoading(false); 
    }, (error) => {
        console.error("Error fetching registrations in real-time:", error);
        setIsLoading(false); // Also set loading false on error
    });

    // Cleanup listeners on component unmount
    return () => {
        unsubTournament();
        unsubRegistrations();
    };
  }, [tournamentId]);


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

  // Create an up-to-date tournament object to pass down to children components
  const liveTournamentData: Tournament = {
    ...tournament,
    confirmedTeams: confirmedTeams,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-accent font-semibold">{liveTournamentData.game} Tournament</p>
            <h1 className="font-headline text-4xl md:text-6xl font-bold uppercase tracking-wider text-primary text-shadow-primary">
              {liveTournamentData.title}
            </h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Bracket */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-headline text-accent mb-4">Live Bracket</h2>
              <TournamentBracket tournament={liveTournamentData} />
            </div>

            {/* Right Column: Details */}
            <div className="space-y-6">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 sticky top-24">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline text-primary">Match Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center text-muted-foreground"><Calendar className="w-5 h-5 mr-3 text-primary" /><span>{liveTournamentData.date} @ {liveTournamentData.time}</span></div>
                    <div className="flex items-center text-muted-foreground"><Trophy className="w-5 h-5 mr-3 text-primary" /><span>Prize Pool: <span className="font-bold text-foreground">₹{liveTournamentData.prizePool.toLocaleString()}</span></span></div>
                    <div className="flex items-center text-muted-foreground"><Coins className="w-5 h-5 mr-3 text-primary" /><span>Entry Fee: <span className="font-bold text-foreground">₹{liveTournamentData.entryFee}</span></span></div>
                    <div className="flex items-center text-muted-foreground">{liveTournamentData.teamType === 'Solo' ? <User className="w-5 h-5 mr-3 text-primary" /> : <Users className="w-5 h-5 mr-3 text-primary" />}<span>Mode: <span className="font-bold text-foreground">{liveTournamentData.teamType}</span></span></div>
                    <div className="flex items-center text-muted-foreground"><Gamepad2 className="w-5 h-5 mr-3 text-primary" /><span>Game: <span className="font-bold text-foreground">{liveTournamentData.game}</span></span></div>
                    
                    <Separator />

                    <div className="pt-2">
                        <h4 className="font-bold flex items-center mb-2"><ShieldCheck className="w-5 h-5 mr-2 text-accent" /> Rules</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                            {liveTournamentData.rules.map((rule, i) => <li key={i}>{rule}</li>)}
                        </ul>
                    </div>

                    <Separator />

                    <Button asChild className="w-full" size="lg">
                        <Link href={`/tournaments/${liveTournamentData.id}/register`}>Register Now</Link>
                    </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
