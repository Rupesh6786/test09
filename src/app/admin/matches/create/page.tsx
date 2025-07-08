

"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Search, PlusCircle, Edit, Trash2, Award, Loader2, Shuffle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, runTransaction, where, limit, increment, arrayRemove, getDoc } from 'firebase/firestore';
import type { Tournament, BracketTeam, BracketRound, BracketMatchup } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';


export default function ManageMatchesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMatchFormOpen, setIsMatchFormOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [isBracketManagerOpen, setIsBracketManagerOpen] = useState(false);
  const [selectedTournamentForBracket, setSelectedTournamentForBracket] = useState<Tournament | null>(null);

  const { toast } = useToast();

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
        const q = query(collection(db, "tournaments"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedTournaments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tournament[];
        setTournaments(fetchedTournaments);
    } catch (error) {
        console.error("Error fetching tournaments: ", error);
        toast({ title: "Error", description: "Failed to fetch tournaments.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTournaments();
  }, []);
  
  useEffect(() => {
    // This effect ensures the dialog updates if the underlying tournament data changes while it's open.
    if (isBracketManagerOpen && selectedTournamentForBracket) {
      const updatedTournament = tournaments.find(t => t.id === selectedTournamentForBracket.id);
      // Deep compare with JSON.stringify to avoid infinite loops from object references
      if (updatedTournament && JSON.stringify(updatedTournament) !== JSON.stringify(selectedTournamentForBracket)) {
        setSelectedTournamentForBracket(updatedTournament);
      }
    }
  }, [tournaments, isBracketManagerOpen, selectedTournamentForBracket]);

  const filteredTournaments = useMemo(() => {
    return tournaments
      .filter(t => 
        searchTerm === '' || 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.game.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(t => gameFilter === 'all' || t.game === gameFilter)
      .filter(t => statusFilter === 'all' || t.status === statusFilter);
  }, [tournaments, searchTerm, gameFilter, statusFilter]);

  const handleAddNew = () => {
    setEditingTournament(null);
    setIsMatchFormOpen(true);
  };

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setIsMatchFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this match?")) return;
    try {
        await deleteDoc(doc(db, "tournaments", id));
        toast({ title: "Match Deleted", description: "The match has been removed." });
        fetchTournaments(); // Refresh list
    } catch (error) {
        console.error("Error deleting tournament: ", error);
        toast({ title: "Error", description: "Failed to delete match.", variant: "destructive" });
    }
  };

  const handleManageBracket = async (tournament: Tournament) => {
    let tournamentToOpen = tournament;

    // If bracket doesn't exist and conditions are met, generate and save it first.
    if ((!tournament.bracket || tournament.bracket.length === 0) && tournament.confirmedTeams && tournament.slotsTotal > 0 && [2, 4, 8, 16, 32].includes(tournament.slotsTotal)) {
        toast({ title: "Generating Bracket...", description: "Please wait a moment." });
        const newBracket = generateInitialBracket(tournament.confirmedTeams, tournament.slotsTotal);
        const docRef = doc(db, "tournaments", tournament.id);
        
        try {
            await updateDoc(docRef, { bracket: newBracket });
            const updatedDoc = await getDoc(docRef);
            if (updatedDoc.exists()) {
                tournamentToOpen = { id: updatedDoc.id, ...updatedDoc.data() } as Tournament;
                toast({ title: "Success", description: "Bracket generated and saved." });
            }
        } catch (error) {
            console.error("Error generating bracket:", error);
            toast({ title: "Error", description: "Could not generate the bracket.", variant: "destructive" });
            return; // Don't open the dialog if generation fails
        }
    }

    setSelectedTournamentForBracket(tournamentToOpen);
    setIsBracketManagerOpen(true);
  }

  const handleSaveMatch = async (tournamentData: Partial<Tournament>) => {
    try {
        if (editingTournament) {
            const docRef = doc(db, "tournaments", editingTournament.id);
            await updateDoc(docRef, tournamentData);
            toast({ title: "Success", description: "Match details updated." });
        } else {
            await addDoc(collection(db, "tournaments"), { ...tournamentData, slotsAllotted: 0 });
            toast({ title: "Success", description: "New match created." });
        }
        fetchTournaments(); // Refresh list
        setIsMatchFormOpen(false);
        setEditingTournament(null);
    } catch (error) {
        console.error("Error saving match: ", error);
        toast({ title: "Error", description: "Failed to save match details.", variant: "destructive" });
    }
  };

  const handleBracketUpdate = async (tournamentId: string, newBracket: BracketRound[]) => {
    const docRef = doc(db, "tournaments", tournamentId);
    await updateDoc(docRef, { bracket: newBracket });
    await fetchTournaments();
  };

  const handleFinalWinner = async (tournament: Tournament, winningTeam: BracketTeam) => {
    try {
        const registrationsRef = collection(db, 'registrations');
        const q = query(registrationsRef, where('tournamentId', '==', tournament.id), where('teamName', '==', winningTeam.teamName), limit(1));
        const regSnapshot = await getDocs(q);

        if (regSnapshot.empty) {
            throw new Error(`Could not find registration for team "${winningTeam.teamName}".`);
        }
        const registration = regSnapshot.docs[0].data();
        const winnerId = registration.userId;
        const winnerRef = doc(db, 'users', winnerId);
        const tournamentRef = doc(db, 'tournaments', tournament.id);
        const winnerLogRef = doc(collection(db, 'winners'));

        await runTransaction(db, async (transaction) => {
            const winnerDoc = await transaction.get(winnerRef);
            if (!winnerDoc.exists()) {
                throw new Error("Winner's user profile not found.");
            }

            // Update user's wallet and stats
            transaction.update(winnerRef, {
                walletBalance: increment(tournament.prizePool),
                totalEarnings: increment(tournament.prizePool),
                matchesWon: increment(1)
            });

            // Update tournament status and set winner
            transaction.update(tournamentRef, {
                status: 'Completed',
                winner: {
                    userId: winnerId,
                    teamName: winningTeam.teamName,
                    prizeMoney: tournament.prizePool,
                }
            });

            // Create a log in the winners collection
            transaction.set(winnerLogRef, {
                tournamentId: tournament.id,
                tournamentTitle: tournament.title,
                userId: winnerId,
                userName: winnerDoc.data().name,
                teamName: winningTeam.teamName,
                prizeMoney: tournament.prizePool,
                wonAt: new Date(),
            });
        });

        toast({
            title: "Winner Announced!",
            description: `${winningTeam.teamName} has been awarded ₹${tournament.prizePool.toLocaleString()}.`
        });
        fetchTournaments(); // Refresh list
        setIsBracketManagerOpen(false);
        setSelectedTournamentForBracket(null);
    } catch (error: any) {
        console.error("Error announcing winner: ", error);
        toast({ title: "Error", description: error.message || "Failed to announce winner.", variant: "destructive" });
    }
  };
  
    const handleResetBracket = async (tournamentId: string) => {
        if (!window.confirm("Are you sure you want to reset bracket progress? This will clear all match results but keep the current team matchups.")) return;

        const tournamentToReset = tournaments.find(t => t.id === tournamentId);
        if (!tournamentToReset || !tournamentToReset.confirmedTeams) {
            toast({ title: "Error", description: "Cannot reset progress, bracket not found.", variant: "destructive" });
            return;
        }

        const docRef = doc(db, "tournaments", tournamentId);
        try {
            // This now directly regenerates the bracket and saves it.
            const resetBracket = generateInitialBracket(tournamentToReset.confirmedTeams, tournamentToReset.slotsTotal);
            await updateDoc(docRef, { bracket: resetBracket });
            toast({ title: "Success", description: "Bracket progress has been reset." });
            await fetchTournaments();
        } catch (error) {
            console.error("Error resetting bracket: ", error);
            toast({ title: "Error", description: "Could not reset the bracket.", variant: "destructive" });
        }
    };
    
    const handleRemoveTeam = async (tournamentId: string, teamToRemove: BracketTeam) => {
        if (!window.confirm(`Are you sure you want to remove ${teamToRemove.teamName} from the tournament? This action will remove their registration entry and reset the bracket.`)) return;
    
        const tournamentRef = doc(db, "tournaments", tournamentId);
        const registrationsRef = collection(db, 'registrations');
        const q = query(registrationsRef, where('tournamentId', '==', tournamentId), where('teamName', '==', teamToRemove.teamName), limit(1));
    
        try {
            const regSnapshot = await getDocs(q);
            const registrationDoc = regSnapshot.docs.length > 0 ? regSnapshot.docs[0] : null;
    
            await runTransaction(db, async (transaction) => {
                const tournamentDoc = await transaction.get(tournamentRef);
                if (!tournamentDoc.exists()) {
                    throw new Error("Tournament not found!");
                }
    
                const currentTournamentData = tournamentDoc.data() as Tournament;
    
                // Filter out the team to remove
                const newConfirmedTeams = (currentTournamentData.confirmedTeams || []).filter(
                    (team) => team.teamName !== teamToRemove.teamName
                );
    
                // Regenerate the entire bracket with the updated team list
                const newBracket = generateInitialBracket(newConfirmedTeams, currentTournamentData.slotsTotal);
                
                // Update tournament doc with new teams list, decremented slot count, and the newly generated bracket
                transaction.update(tournamentRef, {
                    slotsAllotted: increment(-1),
                    confirmedTeams: newConfirmedTeams,
                    bracket: newBracket
                });
                
                // Also delete the registration document to maintain data consistency
                if (registrationDoc) {
                    transaction.delete(registrationDoc.ref);
                }
            });
    
            toast({ title: "Team Removed", description: `${teamToRemove.teamName} has been removed and the bracket has been updated.` });
            await fetchTournaments(); // Refresh data to update the dialog via the useEffect hook
        } catch (error: any) {
            console.error("Error removing team: ", error);
            toast({ title: "Error", description: error.message || "Failed to remove team.", variant: "destructive" });
        }
    };


  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'success';
      case 'Ongoing': return 'warning';
      case 'Completed': return 'secondary';
      default: return 'default';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">Tournaments</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
           <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search matches..."
              className="pl-8 sm:w-auto md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={gameFilter} onValueChange={setGameFilter}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Filter by game" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Games</SelectItem><SelectItem value="PUBG">PUBG</SelectItem><SelectItem value="Free Fire">Free Fire</SelectItem></SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Upcoming">Upcoming</SelectItem><SelectItem value="Ongoing">Ongoing</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent>
          </Select>
          <Button onClick={handleAddNew} className="w-full sm:w-auto"><PlusCircle />Add New</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead className="hidden md:table-cell">Game</TableHead>
                  <TableHead className="hidden sm:table-cell">Slots</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center h-24"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : filteredTournaments.length > 0 ? (
                  filteredTournaments.map(tournament => (
                    <TableRow key={tournament.id}>
                      <TableCell className="font-medium">{tournament.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{tournament.game}</TableCell>
                      <TableCell className="hidden sm:table-cell">{tournament.slotsAllotted || 0}/{tournament.slotsTotal}</TableCell>
                      <TableCell>₹{tournament.entryFee.toLocaleString()}</TableCell>
                      <TableCell>₹{tournament.prizePool.toLocaleString()}</TableCell>
                      <TableCell className="text-center"><Badge variant={getStatusBadgeVariant(tournament.status)}>{tournament.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tournament)} disabled={tournament.status === 'Completed'}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleManageBracket(tournament)} disabled={tournament.status !== 'Ongoing' || !tournament.confirmedTeams || tournament.confirmedTeams.length === 0}><Award className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(tournament.id)}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">No matches found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-4 p-4 md:hidden">
            {isLoading ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
            ) : filteredTournaments.length > 0 ? (
                filteredTournaments.map(tournament => (
                    <div key={tournament.id} className="p-4 bg-muted/50 rounded-lg border">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold">{tournament.title}</p>
                                <p className="text-sm text-muted-foreground">{tournament.game}</p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(tournament.status)} className="shrink-0">{tournament.status}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-muted-foreground/20 text-center">
                             <div>
                                <p className="font-semibold">{tournament.slotsAllotted || 0}/{tournament.slotsTotal}</p>
                                <p className="text-xs text-muted-foreground">Slots</p>
                            </div>
                             <div>
                                <p className="font-semibold">₹{tournament.entryFee.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Fee</p>
                            </div>
                             <div>
                                <p className="font-semibold">₹{tournament.prizePool.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Prize</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-1 mt-4 pt-4 border-t border-muted-foreground/20">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(tournament)} disabled={tournament.status === 'Completed'}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleManageBracket(tournament)} disabled={tournament.status !== 'Ongoing' || !tournament.confirmedTeams || tournament.confirmedTeams.length === 0}><Award className="w-4 h-4 mr-2" />Manage</Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(tournament.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center h-24 flex items-center justify-center">
                    <p className="text-muted-foreground">No matches found.</p>
                </div>
            )}
        </div>
        </CardContent>
      </Card>
      
      <MatchFormDialog
        isOpen={isMatchFormOpen}
        setIsOpen={setIsMatchFormOpen}
        onSave={handleSaveMatch}
        tournament={editingTournament}
      />
      <BracketManagerDialog
        isOpen={isBracketManagerOpen}
        setIsOpen={setIsBracketManagerOpen}
        tournament={selectedTournamentForBracket}
        onBracketUpdate={handleBracketUpdate}
        onFinalWinner={handleFinalWinner}
        onBracketReset={handleResetBracket}
        onTeamRemove={handleRemoveTeam}
      />
    </div>
  );
}

// Sub-component for the Add/Edit Dialog
function MatchFormDialog({ isOpen, setIsOpen, onSave, tournament }: { isOpen: boolean; setIsOpen: (open: boolean) => void; onSave: (data: Partial<Tournament>) => Promise<void>; tournament: Tournament | null }) {
    const [formData, setFormData] = useState<Partial<Tournament>>({});
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            setFormData(tournament || { status: 'Upcoming', rules: [], teamType: 'Solo' });
        }
    }, [isOpen, tournament]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        const finalValue = type === 'number' ? Number(value) : value;
        setFormData(prev => ({ ...prev, [id]: finalValue }));
    }

    const handleSelectChange = (id: string, value: string) => {
         setFormData(prev => ({ ...prev, [id]: value }));
    }

    const handleSubmit = async () => {
        if (!formData.title || !formData.game || !formData.date || !formData.time || !formData.teamType) {
            alert("Please fill all required fields.");
            return;
        }
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    }
  
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{tournament ? 'Edit Match' : 'Add New Match'}</DialogTitle>
              <DialogDescription>Fill in the details for the tournament.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-y-2 items-center md:grid-cols-4 md:gap-x-4">
                <Label htmlFor="title" className="md:text-right">Title</Label>
                <Input id="title" value={formData.title || ''} onChange={handleChange} className="md:col-span-3" disabled={isSaving} />
              </div>
              <div className="grid grid-cols-1 gap-y-2 items-center md:grid-cols-4 md:gap-x-4">
                <Label className="md:text-right">Game</Label>
                <Select value={formData.game || ''} onValueChange={(v) => handleSelectChange('game', v)} disabled={isSaving}>
                    <SelectTrigger className="md:col-span-3"><SelectValue placeholder="Select a game" /></SelectTrigger>
                    <SelectContent><SelectItem value="PUBG">PUBG</SelectItem><SelectItem value="Free Fire">Free Fire</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-y-2 items-center md:grid-cols-4 md:gap-x-4">
                <Label className="md:text-right">Team Type</Label>
                <Select value={formData.teamType || ''} onValueChange={(v) => handleSelectChange('teamType', v)} disabled={isSaving}>
                    <SelectTrigger className="md:col-span-3"><SelectValue placeholder="Select team type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Solo">Solo</SelectItem>
                        <SelectItem value="Duo">Duo</SelectItem>
                        <SelectItem value="Squad">Squad</SelectItem>
                    </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-1 gap-y-2 items-center md:grid-cols-4 md:gap-x-4">
                <Label htmlFor="date" className="md:text-right">Registration End Date & Time</Label>
                <div className="flex flex-col gap-2 sm:flex-row md:col-span-3">
                    <Input id="date" type="date" value={formData.date || ''} onChange={handleChange} className="w-full" disabled={isSaving} />
                    <Input id="time" type="time" value={formData.time || ''} onChange={handleChange} className="w-full" disabled={isSaving} />
                </div>
              </div>
               <div className="grid grid-cols-1 gap-y-2 items-center md:grid-cols-4 md:gap-x-4">
                <Label htmlFor="startDate" className="md:text-right">Start Date</Label>
                <Input id="startDate" type="date" value={formData.startDate || ''} onChange={handleChange} className="md:col-span-3" disabled={isSaving} />
              </div>
              <div className="grid grid-cols-1 gap-y-2 items-center md:grid-cols-4 md:gap-x-4">
                <Label htmlFor="entryFee" className="md:text-right">Entry Fee</Label>
                <Input id="entryFee" type="number" value={formData.entryFee || 0} onChange={handleChange} className="md:col-span-3" disabled={isSaving} />
              </div>
              <div className="grid grid-cols-1 gap-y-2 items-center md:grid-cols-4 md:gap-x-4">
                <Label htmlFor="prizePool" className="md:text-right">Prize Pool</Label>
                <Input id="prizePool" type="number" value={formData.prizePool || 0} onChange={handleChange} className="md:col-span-3" disabled={isSaving} />
              </div>
              <div className="grid grid-cols-1 gap-y-2 items-center md:grid-cols-4 md:gap-x-4">
                <Label htmlFor="slotsTotal" className="md:text-right">Total Slots</Label>
                <Input id="slotsTotal" type="number" value={formData.slotsTotal || 0} onChange={handleChange} className="md:col-span-3" disabled={isSaving} />
              </div>
              <div className="grid grid-cols-1 gap-y-2 items-center md:grid-cols-4 md:gap-x-4">
                 <Label className="md:text-right">Status</Label>
                 <Select value={formData.status || ''} onValueChange={(v) => handleSelectChange('status', v)} disabled={isSaving}>
                    <SelectTrigger className="md:col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent><SelectItem value="Upcoming">Upcoming</SelectItem><SelectItem value="Ongoing">Ongoing</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 items-start gap-y-2 md:grid-cols-4 md:gap-x-4">
                <Label htmlFor="rules" className="md:text-right pt-2">Rules</Label>
                <Textarea id="rules" value={Array.isArray(formData.rules) ? formData.rules.join('\n') : ''} onChange={(e) => setFormData(p => ({...p, rules: e.target.value.split('\n')}))} placeholder="One rule per line" className="md:col-span-3" disabled={isSaving} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Match
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    );
}

const getRoundTitle = (matchupCount: number, totalSlots: number) => {
    if (matchupCount === 1) return 'Finals';
    if (matchupCount === 2) return 'Semi-Finals';
    if (matchupCount === 4) return 'Quarter-Finals';
    return `Round of ${matchupCount * 2}`;
}

const generateInitialBracket = (teams: BracketTeam[], slotsTotal: number): BracketRound[] => {
    let rounds: BracketRound[] = [];
    let currentTeams: (BracketTeam | null)[] = [...teams];
    
    // Pad with nulls if not enough teams
    while (currentTeams.length < slotsTotal) {
        currentTeams.push(null);
    }
    
    // Shuffle teams for random matchups
    for (let i = currentTeams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentTeams[i], currentTeams[j]] = [currentTeams[j], currentTeams[i]];
    }

    let roundTeams = currentTeams;
    while (roundTeams.length >= 2) {
        const matchups: BracketMatchup[] = [];
        for (let i = 0; i < roundTeams.length; i += 2) {
            matchups.push({
                team1: roundTeams[i],
                team2: roundTeams[i+1],
                winner: null
            });
        }
        rounds.push({
            title: getRoundTitle(matchups.length, slotsTotal),
            matchups: matchups
        });
        roundTeams = Array(roundTeams.length / 2).fill(null);
    }

    return rounds;
}

function BracketManagerDialog({ 
    isOpen, setIsOpen, tournament, onBracketUpdate, onFinalWinner, onBracketReset, onTeamRemove
}: { 
    isOpen: boolean; 
    setIsOpen: (open: boolean) => void; 
    tournament: Tournament | null;
    onBracketUpdate: (tournamentId: string, newBracket: BracketRound[]) => Promise<void>;
    onFinalWinner: (tournament: Tournament, winningTeam: BracketTeam) => Promise<void>;
    onBracketReset: (tournamentId: string) => Promise<void>;
    onTeamRemove: (tournamentId: string, team: BracketTeam) => Promise<void>;
}) {
    const [bracket, setBracket] = useState<BracketRound[] | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && tournament) {
            if (tournament.bracket) {
                setBracket(JSON.parse(JSON.stringify(tournament.bracket)));
            } else {
                setBracket(undefined);
            }
        }
    }, [isOpen, tournament]);

    const allConfirmedTeams = useMemo(() => tournament?.confirmedTeams || [], [tournament]);
    
    const placedTeamNames = useMemo(() => {
        if (!bracket || !bracket[0]) return new Set<string>();
        const names = new Set<string>();
        for (const matchup of bracket[0].matchups) {
            if (matchup.team1) names.add(matchup.team1.teamName);
            if (matchup.team2) names.add(matchup.team2.teamName);
        }
        return names;
    }, [bracket]);

    const handleTeamPlacement = (matchupIndex: number, teamSlot: 'team1' | 'team2', newTeamName: string) => {
        if (!bracket) return;
    
        const newBracket = JSON.parse(JSON.stringify(bracket));
        const newTeam = newTeamName === 'none' ? null : allConfirmedTeams.find(t => t.teamName === newTeamName);
    
        // Place the new team
        newBracket[0].matchups[matchupIndex][teamSlot] = newTeam;
    
        // Reset progress from this matchup onwards
        const resetProgressFrom = (bracketToReset: BracketRound[], roundIdx: number, matchupIdx: number) => {
            // Clear current winner
            bracketToReset[roundIdx].matchups[matchupIdx].winner = null;
    
            // Clear subsequent rounds
            if (roundIdx + 1 < bracketToReset.length) {
                const nextRoundIdx = roundIdx + 1;
                const nextMatchupIdx = Math.floor(matchupIdx / 2);
                const nextTeamSlot = matchupIdx % 2 === 0 ? 'team1' : 'team2';
                
                // Only clear and recurse if the slot was actually filled
                if (bracketToReset[nextRoundIdx].matchups[nextMatchupIdx][nextTeamSlot]) {
                    bracketToReset[nextRoundIdx].matchups[nextMatchupIdx][nextTeamSlot] = null;
                    resetProgressFrom(bracketToReset, nextRoundIdx, nextMatchupIdx);
                }
            }
        }
    
        resetProgressFrom(newBracket, 0, matchupIndex);
        setBracket(newBracket);
    };

    const handleWinnerSelect = (roundIndex: number, matchupIndex: number, winner: BracketTeam | null) => {
        if (!bracket || !winner) return;
    
        // Create a deep copy to avoid state mutation issues.
        const newBracket = JSON.parse(JSON.stringify(bracket));
        const currentMatchup = newBracket[roundIndex].matchups[matchupIndex];
        
        // If the winner is already selected, do nothing.
        if (currentMatchup.winner?.teamName === winner.teamName) return;
    
        currentMatchup.winner = winner;
    
        // Propagate the winner to the next round
        if (roundIndex + 1 < newBracket.length) {
            const nextRoundMatchupIndex = Math.floor(matchupIndex / 2);
            const teamSlot = matchupIndex % 2 === 0 ? 'team1' : 'team2';
            newBracket[roundIndex + 1].matchups[nextRoundMatchupIndex][teamSlot] = winner;
        }
    
        setBracket(newBracket);
    };
    
    const handleSaveChanges = async () => {
        if (!tournament || !bracket) return;
        setIsSaving(true);
        try {
            await onBracketUpdate(tournament.id, bracket);
            toast({ title: "Success", description: "Bracket progress has been saved." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeclareFinalWinner = async () => {
        if (!tournament || !bracket) return;
        const finalWinner = bracket[bracket.length - 1].matchups[0].winner;
        if (finalWinner) {
            setIsSaving(true);
            try {
                await onFinalWinner(tournament, finalWinner);
            } finally {
                setIsSaving(false);
            }
        } else {
            toast({ title: "Error", description: "Select a winner for the final match first.", variant: "destructive" });
        }
    };
    
    const handleReset = async () => {
        if (!tournament) return;
        setIsSaving(true);
        try {
            await onBracketReset(tournament.id);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTeamRemoveClick = async (team: BracketTeam) => {
        if (!tournament) return;
        setIsSaving(true);
        try {
            await onTeamRemove(tournament.id, team);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRandomizeTeams = async () => {
        if (!tournament || !tournament.confirmedTeams) return;
        if (!window.confirm("Are you sure you want to randomize matchups? This will override any manual placements.")) return;
        
        setIsSaving(true);
        try {
            const newBracket = generateInitialBracket(tournament.confirmedTeams, tournament.slotsTotal);
            setBracket(newBracket);
            toast({ title: "Success", description: "Teams have been randomized. Click 'Save Progress' to keep the changes." });
        } catch (error) {
             toast({ title: "Error", description: "Failed to randomize teams.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (!tournament) return null;

    const finalMatchup = bracket ? bracket[bracket.length - 1].matchups[0] : null;
    const canDeclareFinalWinner = !!finalMatchup?.winner;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Bracket for "{tournament.title}"</DialogTitle>
                    <DialogDescription>
                        Select winners to advance them, manage teams, or reset progress.
                    </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="bracket" className="flex-grow flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="bracket">Bracket View</TabsTrigger>
                        <TabsTrigger value="teams">Manage Teams</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="bracket" className="flex-grow overflow-y-auto mt-4">
                        <div className="pr-4">
                             {bracket ? (
                                <div className="flex flex-col gap-6">
                                    {bracket.map((round, roundIndex) => (
                                        <div key={round.title}>
                                            <h3 className="font-bold text-lg text-primary">{round.title}</h3>
                                            <Separator className="my-2" />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {round.matchups.map((matchup, matchupIndex) => (
                                                    <Card key={matchupIndex} className="p-4 bg-muted/50 space-y-2">
                                                        {roundIndex === 0 ? (
                                                            <>
                                                                <Select 
                                                                    value={matchup.team1?.teamName || 'none'}
                                                                    onValueChange={(teamName) => handleTeamPlacement(matchupIndex, 'team1', teamName)}
                                                                    disabled={isSaving}
                                                                >
                                                                    <SelectTrigger className="h-8 text-sm">{matchup.team1?.teamName || 'Select Team 1'}</SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">-- Empty --</SelectItem>
                                                                        {matchup.team1 && <SelectItem value={matchup.team1.teamName}>{matchup.team1.teamName}</SelectItem>}
                                                                        {allConfirmedTeams
                                                                            .filter(team => !placedTeamNames.has(team.teamName))
                                                                            .map(team => <SelectItem key={team.teamName} value={team.teamName}>{team.teamName}</SelectItem>)
                                                                        }
                                                                    </SelectContent>
                                                                </Select>
                                                                <div className="text-center text-xs font-bold text-muted-foreground">VS</div>
                                                                 <Select 
                                                                    value={matchup.team2?.teamName || 'none'}
                                                                    onValueChange={(teamName) => handleTeamPlacement(matchupIndex, 'team2', teamName)}
                                                                    disabled={isSaving}
                                                                >
                                                                    <SelectTrigger className="h-8 text-sm">{matchup.team2?.teamName || 'Select Team 2'}</SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">-- Empty --</SelectItem>
                                                                        {matchup.team2 && <SelectItem value={matchup.team2.teamName}>{matchup.team2.teamName}</SelectItem>}
                                                                        {allConfirmedTeams
                                                                            .filter(team => !placedTeamNames.has(team.teamName))
                                                                            .map(team => <SelectItem key={team.teamName} value={team.teamName}>{team.teamName}</SelectItem>)
                                                                        }
                                                                    </SelectContent>
                                                                </Select>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className={cn("flex items-center space-x-2 p-2 rounded-md", { 'bg-primary/20': matchup.winner?.teamName === matchup.team1?.teamName })}>
                                                                    <p className="flex-1">{matchup.team1?.teamName || 'TBD'}</p>
                                                                </div>
                                                                <div className="text-center text-xs font-bold text-muted-foreground">VS</div>
                                                                <div className={cn("flex items-center space-x-2 p-2 rounded-md", { 'bg-primary/20': matchup.winner?.teamName === matchup.team2?.teamName })}>
                                                                    <p className="flex-1">{matchup.team2?.teamName || 'TBD'}</p>
                                                                </div>
                                                            </>
                                                        )}

                                                        <Separator className="my-1"/>
                                                        <p className="text-xs text-center text-muted-foreground font-semibold">Select Winner</p>
                                                        <RadioGroup
                                                            value={matchup.winner?.teamName}
                                                            onValueChange={(teamName) => {
                                                                const winner = matchup.team1?.teamName === teamName ? matchup.team1 : matchup.team2;
                                                                handleWinnerSelect(roundIndex, matchupIndex, winner);
                                                            }}
                                                            disabled={!matchup.team1 || !matchup.team2 || isSaving}
                                                            className="flex justify-around"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value={matchup.team1?.teamName || ''} id={`r${roundIndex}m${matchupIndex}t1`} />
                                                                <Label htmlFor={`r${roundIndex}m${matchupIndex}t1`} className="cursor-pointer">{matchup.team1?.teamName || 'Team 1'}</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value={matchup.team2?.teamName || ''} id={`r${roundIndex}m${matchupIndex}t2`} />
                                                                <Label htmlFor={`r${roundIndex}m${matchupIndex}t2`} className="cursor-pointer">{matchup.team2?.teamName || 'Team 2'}</Label>
                                                            </div>
                                                        </RadioGroup>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">
                                    This tournament does not have a generated bracket. Ensure it is "Ongoing" and has confirmed teams.
                                </p>
                            )}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="teams" className="flex-grow overflow-y-auto mt-4">
                        <div className="space-y-2 pr-4">
                            <p className="text-sm text-muted-foreground">
                                Remove teams from the tournament. This will free up a slot. The bracket will regenerate to reflect the changes.
                            </p>
                            <ul className="space-y-2">
                                {(tournament.confirmedTeams || []).length > 0 ? tournament.confirmedTeams?.map((team) => (
                                <li key={team.teamName} className="flex items-center justify-between p-2 pl-4 bg-muted rounded-md">
                                    <span className="font-medium">{team.teamName}</span>
                                    <Button variant="ghost" size="icon" onClick={() => handleTeamRemoveClick(team)} disabled={isSaving}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </li>
                                )) : (
                                    <p className="text-muted-foreground text-center py-8">No confirmed teams yet.</p>
                                )}
                            </ul>
                            </div>
                    </TabsContent>
                </Tabs>
                
                <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 pt-4 border-t mt-4 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="destructive" onClick={handleReset} disabled={isSaving}>
                            <Trash2 className="mr-2 h-4 w-4" /> Reset Progress
                        </Button>
                        <Button variant="outline" onClick={handleRandomizeTeams} disabled={isSaving}>
                            <Shuffle className="mr-2 h-4 w-4" /> Randomize Teams
                        </Button>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <DialogClose asChild><Button variant="outline" disabled={isSaving}>Close</Button></DialogClose>
                        <Button variant="secondary" onClick={handleSaveChanges} disabled={isSaving}>
                             {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Progress
                        </Button>
                        <Button onClick={handleDeclareFinalWinner} disabled={!canDeclareFinalWinner || isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Award className="mr-2 h-4 w-4" /> Declare Final Winner
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
