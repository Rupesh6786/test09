
"use client";

import { cn } from "@/lib/utils";
import { Trophy } from 'lucide-react';
import React from 'react';

type Team = {
  name: string;
};

interface TournamentBracketProps {
  teams: Team[];
  prizePool: number;
  slotsTotal: number;
}

const placeholderTeam: Team = { name: "Waiting..." };
const tbdTeam: Team = { name: "TBD" };

// A single team slot in the bracket
function TeamSlot({ name }: { name: string; }) {
    const isPlaceholder = name === placeholderTeam.name || name === tbdTeam.name;
    return (
        <div className={cn(
            "flex items-center justify-center w-32 md:w-40 h-8 md:h-10 bg-gray-700 rounded-sm text-white font-semibold text-xs md:text-sm shadow-md truncate px-2",
            isPlaceholder ? "bg-gray-700/60 text-gray-400 italic" : "bg-gray-600"
        )}>
            <span>{name}</span>
        </div>
    );
}

// A single matchup between two teams
function Matchup({ teams }: { teams: Team[] }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <TeamSlot name={teams[0].name} />
            <div className="h-3 w-px bg-gray-600" />
            <TeamSlot name={teams[1].name} />
        </div>
    );
}

// The winner display at the end of the bracket
function WinnerDisplay({ prizePool }: { prizePool: number }) {
    return (
        <div className="flex flex-col justify-center items-center gap-2">
            <Trophy className="w-10 h-10 md:w-16 md:h-16 text-yellow-400" filter="url(#gold-glow)" />
            <div className="text-center">
                <p className="font-bold text-lg text-white">WINNER</p>
                <p className="font-bold text-xl text-yellow-400">₹{prizePool.toLocaleString()}</p>
            </div>
        </div>
    );
}

export function TournamentBracket({ teams, prizePool, slotsTotal }: TournamentBracketProps) {
    // Validate that slotsTotal is a power of 2, otherwise bracket is not possible
    if (slotsTotal < 2 || !Number.isInteger(Math.log2(slotsTotal))) {
        return (
            <div className="w-full bg-gray-800 text-white rounded-lg p-8 flex flex-col items-center justify-center h-96">
                <p className="text-gray-400">Bracket cannot be generated for {slotsTotal} teams.</p>
                <p className="text-gray-400 text-sm">The number of slots must be a power of 2 (e.g., 4, 8, 16).</p>
            </div>
        );
    }
    
    // Generate the data structure for all rounds of the bracket
    const roundsData = React.useMemo(() => {
        const paddedTeams: Team[] = [...teams];
        while (paddedTeams.length < slotsTotal) {
            paddedTeams.push(placeholderTeam);
        }

        const rounds: { matchups: Team[][] }[] = [];
        let currentTeams = paddedTeams;
        while (currentTeams.length > 1) {
            const matchups: Team[][] = [];
            // Group current teams into pairs for matches
            for (let i = 0; i < currentTeams.length; i += 2) {
                matchups.push([currentTeams[i], currentTeams[i + 1]]);
            }
            rounds.push({ matchups });
            // Prepare the next round with TBD placeholders
            currentTeams = Array(currentTeams.length / 2).fill(tbdTeam);
        }
        return rounds;
    }, [teams, slotsTotal]);
    
    return (
        <div className="w-full bg-gray-800 text-white rounded-lg p-4 md:p-8 flex flex-col items-center font-body">
            {/* SVG filter for the trophy glow effect */}
            <svg width="0" height="0"><defs><filter id="gold-glow"><feGaussianBlur stdDeviation="3.5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs></svg>
            
            <h2 className="text-xl md:text-3xl font-bold uppercase tracking-wide mb-8">
              Tournament Bracket
            </h2>

            <div className="w-full overflow-x-auto pb-4">
                <div className="flex justify-start items-center min-w-max space-x-6 md:space-x-12">
                    {roundsData.map((round, roundIndex) => (
                        <div key={roundIndex} className="flex flex-col justify-around h-full space-y-8">
                            {/* Round Title */}
                            <div className="text-center font-bold text-accent text-sm -ml-6 md:-ml-12">
                                {round.matchups.length === 1 ? 'Finals' : round.matchups.length === 2 ? 'Semi-Finals' : `Round ${roundIndex + 1}`}
                            </div>
                            
                            {/* Matchups in the round */}
                            {round.matchups.map((match, matchIndex) => (
                                <div key={matchIndex} className="relative flex items-center">
                                    <Matchup teams={match} />
                                    {/* Connector lines pointing to the next stage */}
                                    <div className="absolute left-full top-1/2 w-3 md:w-6 h-px bg-gray-500" />
                                    {matchIndex % 2 === 0 && (
                                       <div className="absolute left-[calc(100%_+_12px)] md:left-[calc(100%_+_24px)] top-1/2 w-px h-[calc(100%_+_32px)] bg-gray-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                    
                    {/* Winner Section */}
                    <div className="flex flex-col justify-center items-center pl-3 md:pl-6">
                         <div className="text-center font-bold text-accent text-sm mb-4">Winner</div>
                        <WinnerDisplay prizePool={prizePool} />
                    </div>
                </div>
            </div>
        </div>
    );
}
