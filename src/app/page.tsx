
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ScrollingTicker } from '@/components/scrolling-ticker';
import { TournamentCard } from '@/components/tournament-card';
import { TestimonialsSection } from '@/components/testimonials-section';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import type { Tournament } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { UserCheck, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TournamentsSection />
        <WhyChooseUsSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden">
      <div className="absolute inset-0 z-0 hidden md:block">
        <Image
          src="/img/player-waking_hero_section.png"
          alt="Hiker walking towards an erupting volcano"
          data-ai-hint="volcano hiker"
          fill
          className="object-cover"
          priority
        />
      </div>
       <div className="absolute inset-0 z-0 md:hidden">
        <Image
          src="/img/mobile_responsive_hero_section.png"
          alt="Mobile gamer"
          data-ai-hint="mobile gamer"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="absolute inset-0 dark:bg-gradient-to-t dark:from-background dark:via-background/50 dark:to-transparent" />
      <div className="relative z-10 flex h-full flex-col items-center justify-end pb-20 text-center sm:pb-28">
        <h1 className="font-headline text-4xl font-bold uppercase tracking-wider text-primary text-shadow-primary sm:text-5xl md:text-6xl lg:text-7xl">
          BattleBucks
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
          Join the ultimate battleground for PUBG & Free Fire. Compete, conquer, and claim your real cash winnings.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="bg-primary/90 text-primary-foreground hover:bg-primary text-base font-bold transition-all hover:scale-105 hover:shadow-lg hover:box-shadow-primary sm:text-lg">
            <Link href="/tournaments">Join the Battle</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground text-base font-bold transition-all hover:scale-105 sm:text-lg">
            <Link href="/register">Register Now</Link>
          </Button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <ScrollingTicker />
      </div>
    </section>
  );
}

function TournamentsSection() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'tournaments'), where('status', '!=', 'Completed'), limit(4));
        const querySnapshot = await getDocs(q);
        const fetchedTournaments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tournament[];
        setTournaments(fetchedTournaments);
      } catch (error) {
        console.error("Error fetching tournaments: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTournaments();
  }, []);


  return (
    <section id="tournaments" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold uppercase tracking-wider text-primary text-shadow-primary">Tournaments</h2>
          <p className="text-lg text-muted-foreground mt-2">Upcoming Matches & Ongoing Battles</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
            ))
          ) : tournaments.length > 0 ? (
            tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground">No upcoming tournaments found.</p>
          )}
        </div>
        <div className="text-center mt-12">
          <Button asChild variant="link" className="text-primary text-lg">
            <Link href="/tournaments">View All Tournaments →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  return (
    <section className="bg-muted/40 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold uppercase tracking-wider text-accent text-shadow-accent">Why Choose Us?</h2>
          <p className="text-lg text-muted-foreground mt-2">The Ultimate Gaming Experience</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 text-center p-6 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/20 rounded-full">
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Verified & Skill-Based Matches</h3>
            <p className="text-muted-foreground">No bots. No scams. Just real competition.</p>
          </Card>
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 text-center p-6 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/20 rounded-full">
                <Zap className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Withdrawals</h3>
            <p className="text-muted-foreground">Earn and get paid in real-time via UPI/Paytm.</p>
          </Card>
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 text-center p-6 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/20 rounded-full">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Anti-Cheat System</h3>
            <p className="text-muted-foreground">Fair play only. Top-notch security and monitoring.</p>
          </Card>
        </div>
      </div>
    </section>
  );
}
