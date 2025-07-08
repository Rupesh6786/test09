
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
import { Search, PlusCircle, Edit, Trash2, Award, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, runTransaction, where, limit, increment } from 'firebase/firestore';
import type { Tournament } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


export default function ManageMatchesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false);
  const [selectedTournamentForWinner, setSelectedTournamentForWinner] = useState<Tournament | null>(null);

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
    setIsDialogOpen(true);
  };

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setIsDialogOpen(true);
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

  const handleAnnounce = (tournament: Tournament) => {
    setSelectedTournamentForWinner(tournament);
    setIsWinnerDialogOpen(true);
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
        setIsDialogOpen(false);
        setEditingTournament(null);
    } catch (error) {
        console.error("Error saving match: ", error);
        toast({ title: "Error", description: "Failed to save match details.", variant: "destructive" });
    }
  };

  const handleSaveWinner = async (tournament: Tournament, winningTeam: { teamName: string; gameIds: string[] }) => {
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
        setIsWinnerDialogOpen(false);
        setSelectedTournamentForWinner(null);
    } catch (error: any) {
        console.error("Error announcing winner: ", error);
        toast({ title: "Error", description: error.message || "Failed to announce winner.", variant: "destructive" });
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
                        <Button variant="ghost" size="icon" onClick={() => handleAnnounce(tournament)} disabled={tournament.status !== 'Ongoing' || !tournament.confirmedTeams || tournament.confirmedTeams.length === 0}><Award className="w-4 h-4" /></Button>
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
                            <Button variant="ghost" size="sm" onClick={() => handleAnnounce(tournament)} disabled={tournament.status !== 'Ongoing' || !tournament.confirmedTeams || tournament.confirmedTeams.length === 0}><Award className="w-4 h-4 mr-2" />Announce</Button>
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
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onSave={handleSaveMatch}
        tournament={editingTournament}
      />
      <WinnerAnnouncementDialog
        isOpen={isWinnerDialogOpen}
        setIsOpen={setIsWinnerDialogOpen}
        tournament={selectedTournamentForWinner}
        onConfirm={handleSaveWinner}
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
                <Input id="entryFee" type="number" value={formData.entryFee || ''} onChange={handleChange} className="md:col-span-3" disabled={isSaving} />
              </div>
              <div className="grid grid-cols-1 gap-y-2 items-center md:grid-cols-4 md:gap-x-4">
                <Label htmlFor="prizePool" className="md:text-right">Prize Pool</Label>
                <Input id="prizePool" type="number" value={formData.prizePool || ''} onChange={handleChange} className="md:col-span-3" disabled={isSaving} />
              </div>
              <div className="grid grid-cols-1 gap-y-2 items-center md:grid-cols-4 md:gap-x-4">
                <Label htmlFor="slotsTotal" className="md:text-right">Total Slots</Label>
                <Input id="slotsTotal" type="number" value={formData.slotsTotal || ''} onChange={handleChange} className="md:col-span-3" disabled={isSaving} />
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

function WinnerAnnouncementDialog({ isOpen, setIsOpen, tournament, onConfirm }: { isOpen: boolean; setIsOpen: (open: boolean) => void; onConfirm: (tournament: Tournament, winningTeam: { teamName: string; gameIds: string[] }) => Promise<void>; tournament: Tournament | null }) {
    const [selectedTeamName, setSelectedTeamName] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSelectedTeamName('');
            setIsSaving(false);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!tournament || !selectedTeamName) {
            toast({ title: "Error", description: "Please select a winning team.", variant: "destructive" });
            return;
        }
        const winningTeam = tournament.confirmedTeams?.find(t => t.teamName === selectedTeamName);
        if (!winningTeam) {
            toast({ title: "Error", description: "Selected team not found.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        await onConfirm(tournament, winningTeam);
        setIsSaving(false);
    };

    if (!tournament) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Announce Winner for "{tournament.title}"</DialogTitle>
                    <DialogDescription>
                        Select the winning team from the list of confirmed participants. This action is irreversible and will distribute the prize pool.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label>Confirmed Teams</Label>
                    <RadioGroup
                        value={selectedTeamName}
                        onValueChange={setSelectedTeamName}
                        className="mt-2 max-h-60 overflow-y-auto pr-2"
                        disabled={isSaving}
                    >
                        {(tournament.confirmedTeams && tournament.confirmedTeams.length > 0) ? tournament.confirmedTeams.map(team => (
                            <div key={team.teamName} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                <RadioGroupItem value={team.teamName} id={team.teamName} />
                                <Label htmlFor={team.teamName} className="flex-1 cursor-pointer">{team.teamName}</Label>
                            </div>
                        )) : (
                            <p className="text-muted-foreground text-sm text-center py-4">No confirmed teams for this tournament.</p>
                        )}
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSaving || !selectedTeamName}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Winner
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
