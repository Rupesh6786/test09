

"use client";

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { TournamentCard } from '@/components/tournament-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useMemo } from 'react';
import type { Tournament } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'tournaments'), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const fetchedTournaments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tournament[];
        setTournaments(fetchedTournaments);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching tournaments: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const upcoming = useMemo(() => tournaments.filter(t => t.status === 'Upcoming'), [tournaments]);
  const ongoing = useMemo(() => tournaments.filter(t => t.status === 'Ongoing'), [tournaments]);

  const renderSkeletons = (count: number) => (
    <div className="mt-8 flex flex-wrap gap-6 justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="w-full max-w-sm">
            <CardContent className="p-4">
                <Skeleton className="h-[300px] w-full" />
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
                All Tournaments
              </h1>
              <p className="text-lg text-muted-foreground mt-2">Find your next challenge and claim victory.</p>
            </div>
            <Tabs defaultValue="ongoing" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto bg-card/80">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming">
                {isLoading ? renderSkeletons(4) : (
                  upcoming.length > 0 ? (
                    <div className="mt-8 flex flex-wrap gap-6 justify-center">
                      {upcoming.map((tournament) => (
                        <TournamentCard key={tournament.id} tournament={tournament} />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-8 text-center text-muted-foreground">No upcoming tournaments found.</p>
                  )
                )}
              </TabsContent>
              <TabsContent value="ongoing">
                 {isLoading ? renderSkeletons(2) : (
                  ongoing.length > 0 ? (
                    <div className="mt-8 flex flex-wrap gap-6 justify-center">
                      {ongoing.map((tournament) => (
                        <TournamentCard key={tournament.id} tournament={tournament} />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-8 text-center text-muted-foreground">No ongoing tournaments right now.</p>
                  )
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
