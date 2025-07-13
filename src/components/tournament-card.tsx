
"use client";

import Link from 'next/link';
import type { Tournament } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, Trophy, Coins, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

type TournamentCardProps = {
  tournament: Tournament;
};

export function TournamentCard({ tournament }: TournamentCardProps) {
  const { toast } = useToast();
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const slotsAllotted = tournament.slotsAllotted || 0;
  const slotsPercentage = (slotsAllotted / tournament.slotsTotal) * 100;
  const slotsLeft = tournament.slotsTotal - slotsAllotted;
  const isFull = slotsAllotted >= tournament.slotsTotal;
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setAuthUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const now = new Date();
  let registrationHasEnded = false;
  let tournamentWillStart = false;

  // Check if tournament start date is in the future
  if (tournament.status === 'Upcoming' && tournament.startDate) {
      try {
          // Add T00:00:00 to avoid timezone issues where the date might be interpreted as the previous day
          const startDateTime = new Date(tournament.startDate + 'T00:00:00'); 
          if (startDateTime > now) {
              tournamentWillStart = true;
          }
      } catch(e) {
          console.error("Could not parse tournament start date:", e);
      }
  }
  
  // Only check registration deadline if the tournament isn't waiting to start
  if (!tournamentWillStart && tournament.status === 'Upcoming' && tournament.date && tournament.time) {
    try {
      const registrationDeadline = new Date(`${tournament.date}T${tournament.time}`);
      if (now > registrationDeadline) {
        registrationHasEnded = true;
      }
    } catch (e) {
      console.error("Could not parse tournament deadline:", e);
    }
  }

  const handleAlertClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
        title: "Tournament Not Started",
        description: `This tournament is scheduled to begin on ${tournament.startDate}. Check back then!`,
    });
  };

  const MainContent = () => (
    <>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-lg tracking-wide">{tournament.title}</CardTitle>
            <Image
              src={tournament.game === 'PUBG' ? '/icons/bgmi-icon.png' : '/icons/ff-icon.png'}
              alt={tournament.game}
              width={48}
              height={48}
              className="w-12 h-12 rounded-md"
            />
        </div>
        <div className="flex items-center gap-2">
            <Badge variant={tournament.status === 'Ongoing' ? 'warning' : 'success'} className="uppercase">
                {tournament.status}
            </Badge>
            <Badge variant="secondary" className="uppercase">{tournament.game}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-sm flex-grow">
        <div className="flex items-center text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Registration ends: {tournament.date} @ {tournament.time}</span>
        </div>
        {tournament.teamType && (
            <div className="flex items-center text-muted-foreground">
                {tournament.teamType === 'Solo' ? <User className="w-4 h-4 mr-2 text-primary" /> : <Users className="w-4 h-4 mr-2 text-primary" />}
                <span>Mode: <span className="font-bold text-foreground">{tournament.teamType}</span></span>
            </div>
        )}
        <div className="flex items-center text-muted-foreground">
            <Coins className="w-4 h-4 mr-2 text-primary" />
            <span>Entry Fee: <span className="font-bold text-foreground">₹{tournament.entryFee}</span></span>
        </div>
        <div className="flex items-center text-muted-foreground">
            <Trophy className="w-4 h-4 mr-2 text-primary" />
            <span>Prize Pool: <span className="font-bold text-foreground">₹{tournament.prizePool.toLocaleString()}</span></span>
        </div>
        <div>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Slots Left</span>
                </div>
                <span className="font-bold text-foreground">{slotsLeft} / {tournament.slotsTotal}</span>
            </div>
            <Progress value={slotsPercentage} className="h-2 bg-primary/20" indicatorClassName="bg-primary" />
        </div>
      </CardContent>
    </>
  );

  const getButton = () => {
    if (tournamentWillStart) {
        return (
            <Button disabled className="w-full font-bold">
                <Calendar className="w-4 h-4 mr-2" />
                Will start on {tournament.startDate}
            </Button>
        );
    }
    
    if (registrationHasEnded) {
       return (
        <Button disabled className="w-full font-bold">
            <Calendar className="w-4 h-4 mr-2" />
            Registration Ended
        </Button>
      );
    }
    
    if (isFull) {
      return (
        <Button disabled className="w-full font-bold">
          <Users className="w-4 h-4 mr-2" />
          Slots Full
        </Button>
      );
    }
    
    const registrationLink = authUser ? `/tournaments/${tournament.id}/register` : '/login';

    return (
      <Button asChild className="w-full bg-primary/90 text-primary-foreground hover:bg-primary font-bold transition-all hover:shadow-lg hover:box-shadow-primary">
        <Link href={registrationLink}>Register Now</Link>
      </Button>
    );
  };

  return (
    <Card 
      className={cn(
        "w-full max-w-sm bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden transform transition-all duration-300 flex flex-col h-full",
        "hover:scale-105 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50",
        tournamentWillStart && "cursor-pointer"
      )} 
      style={{ transformStyle: 'preserve-3d' }}
      onClick={tournamentWillStart ? handleAlertClick : undefined}
    >
      
      {tournamentWillStart ? (
          <div className="flex flex-col flex-grow">
            <MainContent />
          </div>
        ) : (
          <Link href={`/tournaments/${tournament.id}`} className="flex flex-col flex-grow cursor-pointer">
            <MainContent />
          </Link>
        )}
      
      <CardFooter className="p-4 mt-auto">
        {getButton()}
      </CardFooter>
    </Card>
  );
}
