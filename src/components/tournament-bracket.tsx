
"use client";

import { cn } from "@/lib/utils";
import type { Tournament, BracketRound, BracketMatchup, BracketTeam } from "@/lib/data";
import { Trophy } from 'lucide-react';
import React from 'react';

// A single team slot in the bracket
function TeamSlot({ team, isWinner }: { team: BracketTeam | null; isWinner: boolean }) {
  const isPlaceholder = !team;
  return (
    <div className={cn(
      "flex items-center w-full h-8 md:h-10 rounded-sm text-xs md:text-sm font-semibold truncate px-2 transition-colors",
      isPlaceholder ? "bg-muted/30 text-muted-foreground italic" : "bg-card text-card-foreground",
      isWinner ? "border-2 border-primary" : "border border-border"
    )}>
      <span>{team?.teamName || "Waiting..."}</span>
    </div>
  );
}

// A single matchup between two teams
function Matchup({ matchup }: { matchup: BracketMatchup }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 md:gap-2 w-32 md:w-36">
      <TeamSlot team={matchup.team1} isWinner={!!matchup.winner && matchup.winner.teamName === matchup.team1?.teamName} />
      <div className="text-xs font-bold text-muted-foreground">VS</div>
      <TeamSlot team={matchup.team2} isWinner={!!matchup.winner && matchup.winner.teamName === matchup.team2?.teamName} />
    </div>
  );
}

// The winner display at the end of the bracket
function WinnerDisplay({ tournament }: { tournament: Tournament }) {
    const winnerName = tournament.winner?.teamName || "TBD";
    return (
        <div className="flex flex-col justify-center items-center gap-2 p-4 bg-background rounded-lg border-2 border-primary shadow-lg shadow-primary/20">
            <Trophy className="w-10 h-10 md:w-16 md:h-16 text-primary" />
            <div className="text-center">
                <p className="font-bold text-lg text-foreground uppercase tracking-widest">Winner</p>
                <p className="font-bold text-xl md:text-2xl text-primary">{winnerName}</p>
                <p className="font-semibold text-sm text-muted-foreground">
                    Prize: ₹{tournament.prizePool.toLocaleString()}
                </p>
            </div>
        </div>
    );
}

// A single round of the tournament bracket
function Round({ round, isLastRound }: { round: BracketRound; isLastRound: boolean; }) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center gap-8">
        <h3 className="font-headline text-lg md:text-xl text-accent font-bold">{round.title}</h3>
        <div className="flex flex-col gap-6 md:gap-10">
          {round.matchups.map((matchup, index) => (
            <div key={index} className="relative flex items-center">
              <Matchup matchup={matchup} />
              {/* Desktop Connector Line */}
              {!isLastRound && (
                <div className="hidden md:block absolute left-full top-1/2 w-4 md:w-8 h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Desktop Vertical Connector */}
      {!isLastRound && (
         <div className="hidden md:flex flex-col items-center h-full w-8 md:w-16 ml-0">
          {Array.from({ length: round.matchups.length / 2 }).map((_, index) => (
            <div key={index} className="relative flex-grow flex items-center">
                 <div className="absolute w-px h-full bg-border" style={{ height: `calc(100% + 2.5rem)`}} />
                 <div className="absolute w-full h-px bg-border" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TournamentBracket({ tournament }: { tournament: Tournament }) {
  const { bracket, status } = tournament;

  if (!bracket || bracket.length === 0) {
    return (
      <div className="w-full bg-card text-card-foreground rounded-lg p-8 flex flex-col items-center justify-center h-96 border">
        <p className="text-muted-foreground">The bracket will be generated once the tournament starts.</p>
        <p className="text-muted-foreground text-sm">Confirmed Teams: {tournament.confirmedTeams?.length || 0} / {tournament.slotsTotal}</p>
      </div>
    );
  }

  const finalWinner = status === 'Completed' ? <WinnerDisplay tournament={tournament} /> : null;
  const isFinals = bracket.length > 0 && bracket[bracket.length - 1].matchups.length === 1;

  return (
    <div className="w-full bg-card/50 text-foreground rounded-lg p-4 md:p-8 flex flex-col items-center font-body border">
      <h2 className="text-xl md:text-3xl font-bold uppercase tracking-wide mb-8 font-headline">
        Tournament Bracket
      </h2>

      {/* Desktop View */}
      <div className="hidden md:flex w-full overflow-x-auto pb-4 justify-center">
          <div className="flex items-start min-w-max mx-auto">
              {bracket.map((round, index) => (
                  <Round key={round.title} round={round} isLastRound={index === bracket.length - 1} />
              ))}
              {isFinals && (
                <div className="flex flex-col items-center justify-center ml-12 self-center">
                  <WinnerDisplay tournament={tournament}/>
                </div>
              )}
          </div>
      </div>

      {/* Mobile View */}
      <div className="w-full md:hidden flex flex-col items-center gap-6">
          {bracket.map((round, index) => (
              <Round key={`mobile-${round.title}`} round={round} isLastRound={index === bracket.length - 1} />
          ))}
          {isFinals && (
            <div className="w-full flex flex-col items-center mt-4">
              <WinnerDisplay tournament={tournament}/>
            </div>
          )}
      </div>
    </div>
  );
}
