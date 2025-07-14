
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
import { collection, onSnapshot, query, where, limit, getDocs } from 'firebase/firestore';
import type { Tournament } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { UserCheck, ShieldCheck, Zap, Gamepad2, Trophy, Users, Award, UserPlus, LogIn } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';


// This is now an async Server Component to fetch data on the server
async function TournamentsSection() {
  // Fetch only the top 4 upcoming tournaments on the server
  const q = query(collection(db, 'tournaments'), where('status', '!=', 'Completed'), limit(4));
  const querySnapshot = await getDocs(q);
  const tournaments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tournament[];

  return (
    <section id="tournaments" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold uppercase tracking-wider text-primary text-shadow-primary">Tournaments</h2>
          <p className="text-lg text-muted-foreground mt-2">Upcoming Matches & Ongoing Battles</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-center">
          {tournaments.length > 0 ? (
            tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))
          ) : (
             Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
            ))
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


// The rest of the page remains a client component for interactivity
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
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
      return (
        <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden bg-background">
            <div className="relative z-10 flex h-full flex-col items-center justify-end pb-20 text-center sm:pb-28">
                <Skeleton className="h-16 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/2" />
            </div>
        </section>
      );
  }

  const desktopImage = theme === 'light' ? '/img/hero_section_bg-img-max.png' : '/img/player-waking_hero_section.png';
  const mobileImage = theme === 'light' ? '/img/hero_section_bg-img-min.png' : '/img/mobile_responsive_hero_section.png';
  
  return (
    <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden">
      <div className="absolute inset-0 z-0 hidden md:block">
          <Image
          src={desktopImage}
          alt="Hero background"
          data-ai-hint="gaming esports"
          fill
          className="object-cover"
          priority
          key={desktopImage}
          />
      </div>
      <div className="absolute inset-0 z-0 md:hidden">
          <Image
          src={mobileImage}
          alt="Hero background mobile"
          data-ai-hint="mobile gamer"
          fill
          className="object-cover"
          priority
          key={mobileImage}
          />
      </div>
      <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-background to-transparent",
          theme === 'light' && "opacity-80"
      )} />
      <div className="relative z-10 flex h-full flex-col items-center justify-end pb-20 text-center sm:pb-28">
        <h1 className="font-headline text-4xl font-bold uppercase tracking-wider text-primary text-shadow-primary sm:text-5xl md:text-6xl lg:text-7xl">
          BattleStacks
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


function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold uppercase tracking-wider text-primary text-shadow-primary">How It Works</h2>
          <p className="text-lg text-muted-foreground mt-2">Your Path to Victory in 4 Simple Steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center p-6 bg-card/80 backdrop-blur-sm border-border/50 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/20 rounded-full">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">1. Register</h3>
            <p className="text-muted-foreground">Create your account to get started.</p>
          </Card>
          <Card className="text-center p-6 bg-card/80 backdrop-blur-sm border-border/50 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/20 rounded-full">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">2. Join a Match</h3>
            <p className="text-muted-foreground">Browse tournaments and secure your slot.</p>
          </Card>
          <Card className="text-center p-6 bg-card/80 backdrop-blur-sm border-border/50 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/20 rounded-full">
                <Gamepad2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">3. Play & Compete</h3>
            <p className="text-muted-foreground">Receive credentials, play with skill, and dominate.</p>
          </Card>
          <Card className="text-center p-6 bg-card/80 backdrop-blur-sm border-border/50 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/20 rounded-full">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">4. Win & Withdraw</h3>
            <p className="text-muted-foreground">Winnings are credited to your wallet.</p>
          </Card>
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
