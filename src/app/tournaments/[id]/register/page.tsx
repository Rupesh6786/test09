
"use client";

import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import type { Tournament } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchRegistrationForm } from '@/components/match-registration-form';
import { Calendar, Users, Trophy, Coins, ShieldCheck, Loader2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import QRCode from 'qrcode.react';

export default function RegisterMatchPage() {
  const params = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTournament = async (id: string) => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'tournaments', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTournament({ id: docSnap.id, ...docSnap.data() } as Tournament);
        } else {
          setTournament(null);
        }
      } catch (error) {
        console.error("Error fetching tournament:", error);
        setTournament(null);
      } finally {
        setIsLoading(false);
      }
    };

    const tournamentId = Array.isArray(params.id) ? params.id[0] : params.id;

    if (tournamentId) {
      fetchTournament(tournamentId);
    } else {
      setIsLoading(false);
    }
  }, [params.id]);


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
    notFound();
  }

  const slotsAllotted = tournament.slotsAllotted || 0;
  const upiUrl = `upi://pay?pa=22rupeshthakur@oksbi&pn=Rupesh%20Thakur&am=${tournament.entryFee}&cu=INR`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="font-headline text-3xl md:text-5xl font-bold uppercase tracking-wider text-primary text-shadow-primary">
              Register for {tournament.title}
            </h1>
            <p className="text-lg text-muted-foreground mt-2">Secure your spot and get ready to battle!</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3">
              <div className="mb-4">
                <h2 className="text-2xl font-headline text-accent">Registration</h2>
              </div>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-4">
                      <h3 className="font-bold text-lg">1. Scan & Pay Entry Fee</h3>
                      <div className="p-4 bg-muted rounded-lg flex flex-col items-center text-center">
                          <div className="p-4 bg-white rounded-md border-4 border-primary">
                              <QRCode
                                  value={upiUrl}
                                  size={220}
                                  level={"H"}
                                  includeMargin={false}
                              />
                          </div>
                          <p className="mt-4 text-sm text-muted-foreground">Scan with any UPI app</p>
                          <p className="font-bold text-lg">Entry Fee: ₹{tournament.entryFee}</p>
                      </div>
                  </div>
                  <div className="space-y-4">
                      <h3 className="font-bold text-lg">2. Submit Your Details</h3>
                      <MatchRegistrationForm tournamentTitle={tournament.title} tournamentId={tournament.id} teamType={tournament.teamType} />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 sticky top-24">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-primary">Match Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center text-muted-foreground"><Calendar className="w-5 h-5 mr-3 text-primary" /><span>{tournament.date} @ {tournament.time}</span></div>
                    <div className="flex items-center text-muted-foreground"><Trophy className="w-5 h-5 mr-3 text-primary" /><span>Prize Pool: <span className="font-bold text-foreground">₹{tournament.prizePool.toLocaleString()}</span></span></div>
                    <div className="flex items-center text-muted-foreground"><Coins className="w-5 h-5 mr-3 text-primary" /><span>Entry Fee: <span className="font-bold text-foreground">₹{tournament.entryFee}</span></span></div>
                    <div className="flex items-center text-muted-foreground">{tournament.teamType === 'Solo' ? <User className="w-5 h-5 mr-3 text-primary" /> : <Users className="w-5 h-5 mr-3 text-primary" />}<span>Mode: <span className="font-bold text-foreground">{tournament.teamType}</span></span></div>
                    <div className="flex items-center text-muted-foreground"><Users className="w-5 h-5 mr-3 text-primary" /><span>Slots Left: <span className="font-bold text-foreground">{tournament.slotsTotal - slotsAllotted}</span></span></div>
                    
                    <div className="pt-4 border-t border-border/40">
                        <h4 className="font-bold flex items-center mb-2"><ShieldCheck className="w-5 h-5 mr-2 text-accent" /> Rules</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                            {tournament.rules.map((rule, i) => <li key={i}>{rule}</li>)}
                        </ul>
                    </div>
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
