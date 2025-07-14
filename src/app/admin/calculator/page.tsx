
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader2, Trophy, Award, Medal, FileDown, RotateCcw, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tournament, BracketTeam, UserRegistration } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type LeaderboardEntry = {
    teamName: string;
    match1: number;
    match2: number;
    match3: number;
    total: number;
    rank: number;
};

const getPlacementPoints = (placement: number): number => {
    if (placement === 1) return 15;
    if (placement === 2) return 12;
    if (placement === 3) return 10;
    if (placement === 4) return 8;
    if (placement === 5) return 6;
    if (placement === 6) return 4;
    if (placement === 7) return 2;
    if (placement >= 8 && placement <= 12) return 1;
    return 0;
};

export default function CalculatorPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Form state
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
    const [selectedTeamName, setSelectedTeamName] = useState<string>('');
    
    // Using a more structured state for match inputs
    const [matchInputs, setMatchInputs] = useState<{ [key: string]: { placement: string, kills: string } }>({
        match1: { placement: '', kills: '' },
        match2: { placement: '', kills: '' },
        match3: { placement: '', kills: '' },
    });

    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        setIsLoading(true);
        const tourneyQuery = query(collection(db, "tournaments"), where("status", "==", "Ongoing"));
        const unsubTournaments = onSnapshot(tourneyQuery, (snapshot) => {
            setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tournament[]);
        });

        const regQuery = query(collection(db, "registrations"), where("paymentStatus", "==", "Confirmed"));
        const unsubRegistrations = onSnapshot(regQuery, (snapshot) => {
            setRegistrations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserRegistration[]);
            setIsLoading(false);
        });

        return () => {
            unsubTournaments();
            unsubRegistrations();
        };
    }, []);

    const availableTeams = useMemo(() => {
        if (!selectedTournamentId) return [];
        return registrations
            .filter(r => r.tournamentId === selectedTournamentId)
            .map(r => ({ value: r.teamName, label: r.teamName }));
    }, [registrations, selectedTournamentId]);

    useEffect(() => {
        setSelectedTeamName('');
        setLeaderboard([]);
    }, [selectedTournamentId]);
    
    const handleAddPoints = () => {
        if (!selectedTeamName) {
            toast({ title: "Error", description: "Please select a team.", variant: "destructive" });
            return;
        }

        const match1Points = getPlacementPoints(Number(matchInputs.match1.placement)) + Number(matchInputs.match1.kills);
        const match2Points = getPlacementPoints(Number(matchInputs.match2.placement)) + Number(matchInputs.match2.kills);
        const match3Points = getPlacementPoints(Number(matchInputs.match3.placement)) + Number(matchInputs.match3.kills);

        setLeaderboard(prev => {
            const existingEntryIndex = prev.findIndex(e => e.teamName === selectedTeamName);
            let newLeaderboard = [...prev];

            if (existingEntryIndex > -1) {
                newLeaderboard[existingEntryIndex] = {
                    ...newLeaderboard[existingEntryIndex],
                    match1: match1Points,
                    match2: match2Points,
                    match3: match3Points,
                    total: match1Points + match2Points + match3Points,
                };
            } else {
                newLeaderboard.push({
                    teamName: selectedTeamName,
                    match1: match1Points,
                    match2: match2Points,
                    match3: match3Points,
                    total: match1Points + match2Points + match3Points,
                    rank: 0,
                });
            }

            // Recalculate ranks
            newLeaderboard.sort((a, b) => b.total - a.total);
            return newLeaderboard.map((entry, index) => ({ ...entry, rank: index + 1 }));
        });
        
        // Reset inputs
        setMatchInputs({ match1: { placement: '', kills: '' }, match2: { placement: '', kills: '' }, match3: { placement: '', kills: '' } });
        setSelectedTeamName('');
        toast({ title: "Success", description: `Points for ${selectedTeamName} have been added/updated.` });
    };

    const handleReset = () => {
        setLeaderboard([]);
        toast({ title: "Leaderboard Reset", description: "All points have been cleared." });
    };
    
    const handleExport = () => {
        if (leaderboard.length === 0) {
            toast({title: "No data to export", variant: "destructive"});
            return;
        }
        const headers = ["Rank", "Team Name", "Match 1", "Match 2", "Match 3", "Total Points"];
        const csvRows = [
            headers.join(','),
            ...leaderboard.map(row => [row.rank, row.teamName, row.match1, row.match2, row.match3, row.total].join(','))
        ].join('\n');

        const blob = new Blob([csvRows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        const tournamentName = tournaments.find(t=>t.id === selectedTournamentId)?.title || 'leaderboard';
        a.setAttribute('download', `${tournamentName.replace(/ /g, "_")}.csv`);
        a.click();
    }
    
    const handleSave = () => {
      toast({title: "Coming Soon!", description: "This feature is under construction."});
    }
    
    const topWinners = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Tournament Points Calculator</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Calculate Points</CardTitle>
                        <CardDescription>Select a tournament and team, then enter match data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label>1. Select Tournament</Label>
                             <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
                                <SelectTrigger><SelectValue placeholder="Choose an ongoing tournament..." /></SelectTrigger>
                                <SelectContent>
                                    {tournaments.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>2. Select Team</Label>
                            <Select value={selectedTeamName} onValueChange={setSelectedTeamName} disabled={!selectedTournamentId}>
                                <SelectTrigger><SelectValue placeholder="Choose a team..." /></SelectTrigger>
                                <SelectContent>
                                    {availableTeams.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-4">
                           <h4 className="font-semibold">3. Enter Match Data</h4>
                           {['match1', 'match2', 'match3'].map((match, index) => (
                               <div key={match} className="grid grid-cols-2 gap-4 items-end">
                                   <div className="space-y-1">
                                       <Label htmlFor={`${match}-placement`}>Match {index + 1} Placement</Label>
                                       <Input id={`${match}-placement`} type="number" placeholder="e.g., 1" value={matchInputs[match].placement} onChange={e => setMatchInputs(prev => ({...prev, [match]: {...prev[match], placement: e.target.value}}))} />
                                   </div>
                                    <div className="space-y-1">
                                       <Label htmlFor={`${match}-kills`}>Match {index + 1} Kills</Label>
                                       <Input id={`${match}-kills`} type="number" placeholder="e.g., 5" value={matchInputs[match].kills} onChange={e => setMatchInputs(prev => ({...prev, [match]: {...prev[match], kills: e.target.value}}))}/>
                                   </div>
                               </div>
                           ))}
                        </div>

                        <Button onClick={handleAddPoints} className="w-full">Add/Update Team Points</Button>
                    </CardContent>
                </Card>
                
                <div className="space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Final Leaderboard</CardTitle>
                             <CardDescription>Calculated standings for the selected tournament.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaderboard.length > 0 ? (
                                        leaderboard.map(entry => (
                                            <TableRow key={entry.teamName}>
                                                <TableCell className="font-bold">{entry.rank}</TableCell>
                                                <TableCell>{entry.teamName}</TableCell>
                                                <TableCell className="text-right font-mono">{entry.total}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">No data yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    
                    {topWinners.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-center text-accent">Winner Announcement</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-around items-end gap-4">
                                {topWinners[1] && <WinnerPod rank={2} team={topWinners[1].teamName} points={topWinners[1].total} />}
                                {topWinners[0] && <WinnerPod rank={1} team={topWinners[0].teamName} points={topWinners[0].total} />}
                                {topWinners[2] && <WinnerPod rank={3} team={topWinners[2].teamName} points={topWinners[2].total} />}
                            </CardContent>
                        </Card>
                    )}
                    
                    <Card>
                      <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Button variant="outline" onClick={handleExport} disabled={leaderboard.length === 0}><FileDown/>Export</Button>
                        <Button variant="destructive" onClick={handleReset}><RotateCcw/>Reset</Button>
                        <Button onClick={handleSave} disabled={leaderboard.length === 0}><Save/>Confirm & Save</Button>
                      </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


function WinnerPod({ rank, team, points }: { rank: number, team: string, points: number }) {
    const rankDetails = {
        1: { icon: <Trophy className="w-12 h-12 text-yellow-400" />, height: 'h-40', color: 'bg-yellow-400/20' },
        2: { icon: <Award className="w-10 h-10 text-slate-400" />, height: 'h-32', color: 'bg-slate-400/20' },
        3: { icon: <Medal className="w-8 h-8 text-amber-600" />, height: 'h-24', color: 'bg-amber-600/20' }
    }[rank] || {};

    return (
        <div className="flex flex-col items-center gap-2 text-center">
            {rankDetails.icon}
            <div className={`flex flex-col justify-end p-2 text-center rounded-t-lg w-24 ${rankDetails.height} ${rankDetails.color}`}>
                <p className="font-bold text-sm truncate">{team}</p>
                <p className="text-xs font-mono">{points} pts</p>
            </div>
        </div>
    );
}

