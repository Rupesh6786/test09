"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, where, runTransaction, increment, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Loader2, Users, Trophy, DollarSign, Award, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tournament } from '@/lib/data';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

type Registration = {
    id: string; // Firestore document ID
    userId: string;
    tournamentId: string;
    tournamentTitle: string;
    userEmail: string;
    teamName: string;
    gameIds: string[];
    upiId: string;
    paymentStatus: 'Pending' | 'Confirmed';
};

export default function AdminDashboardPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    liveTournaments: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
          // Fetch users for total players count
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const totalPlayers = usersSnapshot.size;

          // Fetch tournaments to calculate revenue and live count
          const tournamentsSnapshot = await getDocs(collection(db, 'tournaments'));
          const fetchedTournaments = tournamentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data()})) as Tournament[];
          setAllTournaments(fetchedTournaments);
          
          // Fetch registrations for revenue and recent activity
          const regQuery = query(collection(db, 'registrations'), orderBy('registeredAt', 'desc'));
          const regSnapshot = await getDocs(regQuery);
          const fetchedRegistrations = regSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
          })) as Registration[];
          setRegistrations(fetchedRegistrations);
          
          // Calculate stats
          const liveTournaments = fetchedTournaments.filter(t => t.status === 'Ongoing').length;
          
          const confirmedRegistrations = fetchedRegistrations.filter(r => r.paymentStatus === 'Confirmed');
          const totalRevenue = confirmedRegistrations.reduce((acc, reg) => {
              const tournament = fetchedTournaments.find(t => t.id === reg.tournamentId);
              return acc + (tournament?.entryFee || 0);
          }, 0);

          setStats({ totalPlayers, liveTournaments, totalRevenue });

      } catch (error) {
          console.error("Error fetching dashboard data: ", error);
          toast({
              title: "Error",
              description: "Failed to fetch dashboard data.",
              variant: "destructive"
          })
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleConfirmPayment = async (registration: Registration) => {
      if (!registration.tournamentId || typeof registration.tournamentId !== 'string') {
          toast({
              title: "Error",
              description: "This registration has an invalid or missing tournament ID.",
              variant: "destructive"
          });
          return;
      }

      const registrationRef = doc(db, 'registrations', registration.id);
      const tournamentRef = doc(db, 'tournaments', registration.tournamentId);
      try {
          await runTransaction(db, async (transaction) => {
            const tournamentDoc = await transaction.get(tournamentRef);
            if (!tournamentDoc.exists()) {
                throw "Tournament not found!";
            }
            
            const tournamentData = tournamentDoc.data();
            if (tournamentData.slotsAllotted >= tournamentData.slotsTotal) {
                throw "No slots left in this tournament.";
            }

            transaction.update(registrationRef, { paymentStatus: 'Confirmed' });
            transaction.update(tournamentRef, { 
                slotsAllotted: increment(1),
                confirmedTeams: arrayUnion({ teamName: registration.teamName || '', gameIds: registration.gameIds || [] })
            });
        });
        
        // Draft confirmation email
        const tournament = allTournaments.find(t => t.id === registration.tournamentId);
        const userRef = doc(db, 'users', registration.userId);
        const userSnap = await getDoc(userRef);
        const userName = userSnap.exists() ? userSnap.data().name : registration.userEmail;

        if (tournament && userName) {
            const subject = `Registration Confirmed: ${tournament.title}`;
            const body = `Hi ${userName},\n\nCongratulations! Your registration for the "${tournament.title}" tournament is confirmed.\n\nMatch Details:\n- Date: ${tournament.date}\n- Time: ${tournament.time}\n- Entry Fee Paid: ₹${tournament.entryFee}\n\nWe're excited to see you in the arena! The total prize pool is ₹${tournament.prizePool.toLocaleString()}.\n\nIf you have any questions, feel free to contact us at teambattlebucks@gmail.com.\n\nGood luck!\n\nThe BattleBucks Team`;
            
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${registration.userEmail}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(gmailUrl, '_blank');
        }


        // Re-fetch to update stats and list
        await fetchDashboardData();
        toast({
            title: "Success",
            description: "Payment confirmed. An email draft has been opened.",
            action: <CheckCircle className="h-5 w-5 text-green-500" />
        })
      } catch (error: any) {
          console.error("Error confirming payment: ", error);
          let errorMessage = "Failed to confirm payment.";
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive"
        })
      }
  };

  const handleMarkAsPending = async (registration: Registration) => {
    if (!registration.tournamentId || typeof registration.tournamentId !== 'string') {
        toast({
            title: "Error",
            description: "This registration has an invalid or missing tournament ID.",
            variant: "destructive"
        });
        return;
    }
    const registrationRef = doc(db, 'registrations', registration.id);
    const tournamentRef = doc(db, 'tournaments', registration.tournamentId);
    try {
        await runTransaction(db, async (transaction) => {
            transaction.update(registrationRef, { paymentStatus: 'Pending' });
            transaction.update(tournamentRef, { 
                slotsAllotted: increment(-1),
                confirmedTeams: arrayRemove({ teamName: registration.teamName || '', gameIds: registration.gameIds || [] })
            });
        });

        await fetchDashboardData();
        toast({
            title: "Success",
            description: "Registration marked as pending.",
            action: <XCircle className="h-5 w-5 text-yellow-500" />
        });
    } catch (error: any) {
        console.error("Error marking as pending: ", error);
        toast({
            title: "Error",
            description: "Failed to update registration.",
            variant: "destructive"
        });
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/revenue">
                <Card className="hover:bg-muted/80 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-xl lg:text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div></CardContent>
                </Card>
            </Link>
            <Link href="/admin/users">
                <Card className="hover:bg-muted/80 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-xl lg:text-2xl font-bold">{stats.totalPlayers}</div></CardContent>
                </Card>
            </Link>
            <Link href="/admin/matches/create">
                <Card className="hover:bg-muted/80 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Live Tournaments</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-xl lg:text-2xl font-bold">{stats.liveTournaments}</div></CardContent>
                </Card>
            </Link>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Winner Today</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl lg:text-2xl font-bold">SniperQueen</div>
                    <p className="text-xs text-muted-foreground">in Free Fire Frenzy</p>
                </CardContent>
            </Card>
        </div>

        {/* Recent Registrations */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Registrations</CardTitle>
                <Link href="/admin/registrations" className="text-sm font-medium text-primary hover:underline">
                    View All
                </Link>
            </CardHeader>
            <CardContent>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tournament</TableHead>
                                <TableHead className="max-w-[200px]">User Email</TableHead>
                                <TableHead className="max-w-[200px]">Game UIDs</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registrations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No registered users found.</TableCell>
                                </TableRow>
                            ) : (
                                registrations.slice(0, 5).map(reg => (
                                    <TableRow key={reg.id}>
                                        <TableCell className="font-medium">{reg.tournamentTitle}</TableCell>
                                        <TableCell className="truncate">{reg.userEmail}</TableCell>
                                        <TableCell className="font-mono truncate">{(reg.gameIds || []).join(', ')}</TableCell>
                                        <TableCell>
                                             <Badge variant={reg.paymentStatus === 'Confirmed' ? 'success' : 'warning'}>
                                                {reg.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {reg.paymentStatus === 'Pending' ? (
                                                <Button size="sm" onClick={() => handleConfirmPayment(reg)}>Confirm</Button>
                                            ) : (
                                                <Button variant="secondary" size="sm" onClick={() => handleMarkAsPending(reg)}>Mark Unpaid</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Mobile Card View */}
                <div className="space-y-4 md:hidden">
                    {registrations.length === 0 ? (
                         <div className="text-center h-24 flex items-center justify-center">
                            <p className="text-muted-foreground">No registered users found.</p>
                        </div>
                    ) : (
                        registrations.slice(0, 5).map(reg => (
                            <div key={reg.id} className="p-4 bg-muted/50 rounded-lg border">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <p className="font-bold">{reg.tournamentTitle}</p>
                                        <p className="text-sm text-muted-foreground truncate">{reg.userEmail}</p>
                                        <p className="text-xs text-muted-foreground font-mono truncate">Game UIDs: {(reg.gameIds || []).join(', ')}</p>
                                    </div>
                                    <Badge variant={reg.paymentStatus === 'Confirmed' ? 'success' : 'warning'} className="shrink-0">{reg.paymentStatus}</Badge>
                                </div>
                                <div className="mt-4 pt-4 border-t border-muted-foreground/20 flex justify-end">
                                    {reg.paymentStatus === 'Pending' ? (
                                        <Button size="sm" onClick={() => handleConfirmPayment(reg)}>Confirm</Button>
                                    ) : (
                                        <Button variant="secondary" size="sm" onClick={() => handleMarkAsPending(reg)}>Mark Unpaid</Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
