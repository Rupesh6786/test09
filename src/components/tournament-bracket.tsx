
"use client";

import { cn } from "@/lib/utils";
import { Award } from 'lucide-react';

function BattleBucksBIcon({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-14 h-14 rounded-full bg-primary flex items-center justify-center border-4 border-gray-900 shadow-lg",
        className
      )}
      {...props}
    >
      <span className="text-4xl font-bold text-primary-foreground select-none">B</span>
    </div>
  );
}

type Team = {
  name: string;
};

interface TournamentBracketProps {
  teams: Team[];
  prizePool: number;
}

const placeholderTeam: Team = { name: "Waiting..." };

function TeamSlot({ name }: { name: string }) {
    const isPlaceholder = name === placeholderTeam.name;
    return (
        <div className={cn(
            "flex items-center justify-center text-center w-48 h-12 bg-gray-200 rounded-md text-gray-900 font-bold text-sm shadow-md",
            isPlaceholder && "bg-gray-700/60 text-gray-300 italic font-normal"
        )}>
            {name}
        </div>
    );
}

export function TournamentBracket({ teams, prizePool }: TournamentBracketProps) {
    const paddedTeams: Team[] = [...teams];
    while (paddedTeams.length < 8) {
        paddedTeams.push(placeholderTeam);
    }
    const finalTeams = paddedTeams.slice(0, 8);
    
    const [team1, team2, team3, team4, team5, team6, team7, team8] = finalTeams;

    return (
        <div className="w-full bg-gray-800 text-white rounded-lg p-4 md:p-8 flex flex-col items-center font-body">
            {/* Header */}
            <div className="flex flex-col items-center mb-12">
                <BattleBucksBIcon />
                <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-[0.2em] mt-2">BattleBucks</h2>
            </div>
            
            {/* Main Bracket Area */}
            <div className="flex justify-center items-center w-full">
                {/* Left Column */}
                <div className="flex flex-col space-y-8">
                    {/* Group A */}
                    <div className="flex items-center">
                        <div className="flex flex-col items-end">
                            <p className="text-gray-400 text-xs font-semibold uppercase self-start ml-2 mb-2">Group A</p>
                            <div className="flex flex-col gap-4">
                                <TeamSlot name={team1.name} />
                                <TeamSlot name={team2.name} />
                            </div>
                        </div>
                        <div className="w-6 h-16 border-r border-b border-t border-gray-400 rounded-tr-md rounded-br-md"></div>
                    </div>
                    {/* Group C */}
                    <div className="flex items-center">
                        <div className="flex flex-col items-end">
                            <p className="text-gray-400 text-xs font-semibold uppercase self-start ml-2 mb-2">Group C</p>
                            <div className="flex flex-col gap-4">
                                <TeamSlot name={team3.name} />
                                <TeamSlot name={team4.name} />
                            </div>
                        </div>
                        <div className="w-6 h-16 border-r border-b border-t border-gray-400 rounded-tr-md rounded-br-md"></div>
                    </div>
                </div>

                {/* Center Column */}
                <div className="flex flex-col items-center h-full mx-4">
                    <div className="h-full w-40 flex items-center justify-center relative">
                        {/* Vertical Connector */}
                        <div className="w-px bg-gray-400 h-40"></div>
                        {/* Horizontal Line into VS */}
                        <div className="w-10 h-px bg-gray-400 absolute left-0 top-1/2"></div>
                        <div className="w-10 h-px bg-gray-400 absolute right-0 top-1/2"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-gray-600 px-4 py-1 rounded-md text-lg font-bold shadow-lg">VS</div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col space-y-8">
                    {/* Group B */}
                    <div className="flex items-center">
                        <div className="w-6 h-16 border-l border-b border-t border-gray-400 rounded-tl-md rounded-bl-md"></div>
                        <div className="flex flex-col items-start">
                             <p className="text-gray-400 text-xs font-semibold uppercase self-end mr-2 mb-2">Group B</p>
                            <div className="flex flex-col gap-4">
                                <TeamSlot name={team5.name} />
                                <TeamSlot name={team6.name} />
                            </div>
                        </div>
                    </div>
                    {/* Group D */}
                    <div className="flex items-center">
                         <div className="w-6 h-16 border-l border-b border-t border-gray-400 rounded-tl-md rounded-bl-md"></div>
                        <div className="flex flex-col items-start">
                             <p className="text-gray-400 text-xs font-semibold uppercase self-end mr-2 mb-2">Group D</p>
                            <div className="flex flex-col gap-4">
                                <TeamSlot name={team7.name} />
                                <TeamSlot name={team8.name} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Prize */}
            <div className="flex flex-col items-center mt-12 relative">
                <div className="w-px h-8 bg-gray-400"></div>
                {/* Connecting lines to trophy */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gray-400">
                    <div className="absolute -top-10 left-0 w-px h-10 bg-gray-400"></div>
                    <div className="absolute -top-10 right-0 w-px h-10 bg-gray-400"></div>
                </div>
                <Award className="w-16 h-16 text-yellow-400" />
                <p className="text-xl font-bold mt-2">Prize: ₹{prizePool.toLocaleString()}</p>
            </div>
        </div>
    );
}
