
"use client";

import { cn } from "@/lib/utils";
import { Award } from 'lucide-react';
import { useEffect, useState } from 'react';

type Team = {
  name: string;
};

interface TournamentBracketProps {
  teams: Team[];
}

function Matchup({ team1, team2 }: { team1?: Team, team2?: Team }) {
    const team1Name = team1?.name || 'TBD';
    const team2Name = team2?.name || 'TBD';
    
    return (
        <div className="relative flex flex-col justify-center my-2">
            <div className="flex flex-col">
                <div className="flex items-center">
                    <div className="bg-muted/80 w-48 text-sm p-2 rounded-l-md border-y border-l border-border">{team1Name}</div>
                    <div className="w-6 h-px bg-border"></div>
                </div>
                <div className="h-6 w-px bg-border ml-auto -my-[1px]"></div>
                <div className="flex items-center">
                    <div className="bg-muted/80 w-48 text-sm p-2 rounded-l-md border-y border-l border-border">{team2Name}</div>
                    <div className="w-6 h-px bg-border"></div>
                </div>
            </div>
            <div className="absolute right-0 h-12 w-px bg-border"></div>
            <div className="absolute right-[-24px] w-6 h-px bg-border"></div>
        </div>
    );
}

function Winner() {
    return (
        <div className="flex items-center gap-2 font-bold text-primary text-shadow-primary">
            <Award className="w-8 h-8" />
            <div className="flex flex-col items-center">
                <span className="text-xl">Winner</span>
                <div className="w-24 h-px bg-primary"></div>
            </div>
        </div>
    )
}

export function TournamentBracket({ teams }: TournamentBracketProps) {
  const [shuffledTeams, setShuffledTeams] = useState<Team[]>([]);

  useEffect(() => {
    // Pad the teams array with TBD teams to make it a power of 2 (e.g., 4, 8)
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(Math.max(teams.length, 2))));
    const paddedTeams = [...teams];
    while (paddedTeams.length < nextPowerOf2) {
      paddedTeams.push({ name: 'TBD' });
    }
    // Shuffle teams for random matchups
    setShuffledTeams(paddedTeams.sort(() => Math.random() - 0.5));
  }, [teams]);

  if (shuffledTeams.length === 0) {
    return <p className="text-muted-foreground">No confirmed teams yet.</p>;
  }

  const rounds = [];
  let currentTeams = [...shuffledTeams];
  
  while(currentTeams.length > 1) {
    const matchups = [];
    for (let i = 0; i < currentTeams.length; i += 2) {
      matchups.push([currentTeams[i], currentTeams[i+1]]);
    }
    rounds.push(matchups);
    currentTeams = matchups.map(() => ({name: 'TBD'}));
  }

  return (
    <div className="flex overflow-x-auto space-x-12 p-4">
      {rounds.map((round, roundIndex) => (
        <div key={roundIndex} className={cn("flex flex-col", roundIndex > 0 ? "justify-around" : "justify-between")}>
          <p className="text-center font-bold mb-4">
            {round.length === 1 ? 'Finals' : `Round ${roundIndex + 1}`}
          </p>
          {round.map((match, matchIndex) => (
            <div key={matchIndex} className="relative">
              <Matchup team1={match[0]} team2={match[1]} />
            </div>
          ))}
        </div>
      ))}
      <div className="flex flex-col justify-center items-center px-8">
         <p className="text-center font-bold mb-4">Champion</p>
        <Winner />
      </div>
    </div>
  );
}
