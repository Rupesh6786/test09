
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
import { UserCheck, ShieldCheck, Zap, Gamepad2, Trophy, Users, Award, UserPlus, LogIn } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TournamentsSection />
        <HowItWorksSection />
        <WhyChooseUsSection />
        <LiveStatsSection />
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

function HowItWorksCard({ icon, step, title, description }: { icon: React.ReactNode, step: string, title: string, description: string }) {
    return (
        <Card className="relative text-center p-8 bg-card/80 backdrop-blur-sm border-t-4 border-primary rounded-lg shadow-lg transform transition-transform duration-300 hover:-translate-y-2 overflow-hidden">
            {/* The circle on the connecting line for desktop */}
            <div className="hidden lg:flex absolute top-0 left-1/2 w-8 h-8 bg-background rounded-full border-4 border-primary/30 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                 <div className="w-3 h-3 bg-primary rounded-full" />
            </div>
            <div className="absolute -top-4 -right-4 font-headline text-8xl font-bold text-primary/5 -z-10">
                {step}
            </div>
            <div className="relative mt-4 mb-4 inline-block">
                 <div className="p-4 bg-primary/20 rounded-full">
                    {icon}
                </div>
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
        </Card>
    );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-headline text-3xl md:text-4xl font-bold uppercase tracking-wider text-primary text-shadow-primary">How It Works</h2>
          <p className="text-lg text-muted-foreground mt-2">Your Path to Victory in 4 Simple Steps</p>
        </div>
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-primary/20 -translate-y-1/2" />
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <HowItWorksCard
              step="01"
              title="Register"
              description="Create your free BattleBucks account to get started."
              icon={<UserPlus className="w-8 h-8 text-primary" />}
            />
            <HowItWorksCard
              step="02"
              title="Join a Match"
              description="Browse tournaments and pay the entry fee to secure your slot."
              icon={<LogIn className="w-8 h-8 text-primary" />}
            />
            <HowItWorksCard
              step="03"
              title="Play & Compete"
              description="You'll receive match credentials. Play with skill and dominate."
              icon={<Gamepad2 className="w-8 h-8 text-primary" />}
            />
            <HowItWorksCard
              step="04"
              title="Win & Withdraw"
              description="Winnings are credited to your wallet. Withdraw anytime."
              icon={<Trophy className="w-8 h-8 text-primary" />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}


function WhyChooseUsSection() {
  return (
    <section className="py-16 md:py-24">
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

function StatCard({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 p-6 transform transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/20 text-center">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <p className="text-3xl lg:text-4xl font-bold text-foreground">{value}</p>
      <p className="text-muted-foreground mt-1">{label}</p>
    </Card>
  );
}

function LiveStatsSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold uppercase tracking-wider text-primary text-shadow-primary">Live Stats</h2>
          <p className="text-lg text-muted-foreground mt-2">The Pulse of the Arena</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Gamepad2 className="w-12 h-12 text-primary text-shadow-primary" />} value="20,000+" label="Matches Played" />
          <StatCard icon={<Trophy className="w-12 h-12 text-primary text-shadow-primary" />} value="₹1,50,000+" label="Prize Money Won" />
          <StatCard icon={<Users className="w-12 h-12 text-primary text-shadow-primary" />} value="10,000+" label="Registered Players" />
          <StatCard icon={<Award className="w-12 h-12 text-primary text-shadow-primary" />} value="100+" label="Weekly Tournaments" />
        </div>
      </div>
    </section>
  );
}
