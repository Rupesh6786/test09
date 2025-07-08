
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Trophy, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative py-20 md:py-32 bg-background">
           <div className="absolute inset-0 z-0 opacity-10">
                <Image
                src="/img/player-waking_hero_section.png"
                alt="Gaming background"
                fill
                className="object-cover"
                />
            </div>
          <div className="container mx-auto px-4 relative z-10 max-w-7xl">
            <div className="text-center">
              <h1 className="font-headline text-4xl md:text-6xl font-bold uppercase tracking-wider text-primary text-shadow-primary">
                About BattleBucks
              </h1>
              <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
                The ultimate battleground for mobile esports enthusiasts. Compete, conquer, and claim your glory.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/40">
            <div className="container mx-auto px-4 max-w-7xl">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="font-headline text-3xl font-bold text-accent mb-4">Our Story</h2>
                        <p className="text-muted-foreground mb-4">
                            BattleBucks was born from a passion for competitive gaming and a desire to create a fair, accessible, and thrilling platform for players everywhere. We saw the need for a place where mobile gamers could not only test their skills against the best but also get rewarded for their dedication.
                        </p>
                        <p className="text-muted-foreground">
                            We are a team of dedicated developers, gamers, and esports fans committed to building the best possible experience for our community.
                        </p>
                    </div>
                     <div className="relative w-full max-w-[600px] aspect-[3/2] rounded-lg shadow-lg overflow-hidden mx-auto lg:mx-0">
                        <Image 
                            src="/img/media_about_section.png"
                            data-ai-hint="gaming community"
                            alt="Our Team"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl font-bold text-primary">What We Stand For</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 text-center p-6">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/20 rounded-full">
                        <Trophy className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Fair Competition</h3>
                <p className="text-muted-foreground">We ensure a level playing field with strict anti-cheat measures and transparent rules.</p>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 text-center p-6">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/20 rounded-full">
                        <Users className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Community First</h3>
                <p className="text-muted-foreground">We listen to our players and actively build a supportive and engaging community.</p>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 text-center p-6">
                 <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/20 rounded-full">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Constant Innovation</h3>
                <p className="text-muted-foreground">We are always improving our platform, adding new features and games.</p>
              </Card>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
