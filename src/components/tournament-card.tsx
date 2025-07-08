
"use client";

import Link from 'next/link';
import type { Tournament } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PubgIcon } from '@/components/icons/pubg-icon';
import { FreeFireIcon } from '@/components/icons/freefire-icon';
import { Users, Calendar, Trophy, Coins, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isFuture, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

type TournamentCardProps = {
  tournament: Tournament;
};

export function TournamentCard({ tournament }: TournamentCardProps) {
  const slotsAllotted = tournament.slotsAllotted || 0;
  const slotsPercentage = (slotsAllotted / tournament.slotsTotal) * 100;
  const slotsLeft = tournament.slotsTotal - slotsAllotted;

  // Check if the tournament is upcoming and its start date is in the future.
  const isUpcomingAndLocked = tournament.status === 'Upcoming' && tournament.startDate && isFuture(parseISO(tournament.startDate));

  // Determine the wrapper component and its props based on the condition.
  const WrapperComponent = isUpcomingAndLocked ? 'div' : Link;
  const wrapperProps = isUpcomingAndLocked 
    ? { className: "flex flex-col flex-grow cursor-not-allowed" } 
    : { href: `/tournaments/${tournament.id}`, className: "flex flex-col flex-grow" };

  return (
    <Card 
      className={cn(
        "w-full max-w-sm bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden transform transition-all duration-300 flex flex-col h-full",
        !isUpcomingAndLocked && "hover:scale-105 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50"
      )} 
      style={{ transformStyle: 'preserve-3d' }}
    >
      
      <WrapperComponent {...wrapperProps}>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
              <CardTitle className="font-headline text-lg tracking-wide">{tournament.title}</CardTitle>
              {tournament.game === 'PUBG' ? <PubgIcon className="w-10 h-10" /> : <FreeFireIcon className="w-10 h-10" />}
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
              <span>{tournament.date} @ {tournament.time}</span>
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
      </WrapperComponent>
      
      <CardFooter className="p-4 mt-auto">
        {tournament.status === 'Upcoming' ? (
             <Button disabled className="w-full font-bold" variant="secondary">
                <Calendar className="w-4 h-4 mr-2" />
                Starts on {tournament.startDate || tournament.date}
            </Button>
        ) : (
            <Button asChild className="w-full bg-primary/90 text-primary-foreground hover:bg-primary font-bold transition-all hover:shadow-lg hover:box-shadow-primary">
                <Link href={`/tournaments/${tournament.id}/register`}>Register Now</Link>
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
