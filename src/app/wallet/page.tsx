
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import type { UserProfileData, UserRegistration, RedeemRequest, Tournament } from '@/lib/data';
import { Loader2, Wallet, User, PiggyBank, History } from 'lucide-react';
import { RedeemDialog } from '@/components/redeem-dialog';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function WalletPage() {
    const router = useRouter();
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
    const [redeemRequests, setRedeemRequests] = useState<RedeemRequest[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setAuthUser(user);
                setIsLoading(true);

                const userDocRef = doc(db, 'users', user.uid);
                const userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setProfile(docSnap.data() as UserProfileData);
                    } else {
                        router.push('/profile'); 
                    }
                });

                const tourneyPromise = getDocs(collection(db, "tournaments"));
                const regPromise = getDocs(query(collection(db, 'registrations'), where('userId', '==', user.uid)));
                const redeemPromise = getDocs(query(collection(db, 'redeemRequests'), where('userId', '==', user.uid)));
                
                const [tourneySnapshot, regSnapshot, redeemSnapshot] = await Promise.all([tourneyPromise, regPromise, redeemPromise]);

                const fetchedTournaments = tourneySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tournament[];
                setTournaments(fetchedTournaments);

                const fetchedRegistrations = regSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserRegistration[];
                setRegistrations(fetchedRegistrations);

                const fetchedRedeemRequests = redeemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RedeemRequest[];
                setRedeemRequests(fetchedRedeemRequests);

                setIsLoading(false);
                return () => userUnsubscribe();
            } else {
                router.push('/login');
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);
    
    const transactions = useMemo(() => {
        const registrationTxs = registrations
            .filter(reg => reg.paymentStatus === 'Confirmed')
            .map(reg => {
                const tournament = tournaments.find(t => t.id === reg.tournamentId);
                return {
                    id: reg.id,
                    date: reg.registeredAt?.toDate() || new Date(),
                    description: `Entry Fee: ${reg.tournamentTitle}`,
                    amount: -(tournament?.entryFee || 0),
                    status: reg.paymentStatus,
                };
        });

        const redeemTxs = redeemRequests.map(req => ({
            id: req.id,
            date: req.requestedAt?.toDate() || new Date(),
            description: 'Withdrawal',
            amount: -req.amount,
            status: req.status
        }));
        
        return [...registrationTxs, ...redeemTxs].sort((a, b) => b.date.getTime() - a.date.getTime());

    }, [registrations, redeemRequests, tournaments]);


    const handleRedeemSuccess = () => {
        toast({
            title: "Request Submitted",
            description: "Your redemption request has been sent for processing.",
        });
        if (authUser) {
             getDocs(query(collection(db, 'redeemRequests'), where('userId', '==', authUser.uid))).then(snapshot => {
                const fetchedRedeemRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RedeemRequest[];
                setRedeemRequests(fetchedRedeemRequests);
             });
        }
    };
    
    const getStatusBadgeVariant = (status: string): "success" | "warning" | "secondary" => {
        switch (status) {
            case 'Confirmed':
            case 'Completed':
                return 'success';
            case 'Pending':
                return 'warning';
            default:
                return 'secondary';
        }
    };


    if (isLoading || !profile) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        );
    }
    
    return (
        <>
        <RedeemDialog
            isOpen={isRedeemDialogOpen}
            setIsOpen={setIsRedeemDialogOpen}
            currentBalance={profile.walletBalance || 0}
            userProfile={profile}
            onSuccess={handleRedeemSuccess}
        />
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 py-16 md:py-24">
                <div className="container mx-auto max-w-7xl px-4 space-y-8">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div>
                            <h1 className="font-headline text-4xl font-bold text-primary">My Wallet</h1>
                            <p className="text-muted-foreground mt-1">Manage your earnings and view your transaction history.</p>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/profile"><User className="mr-2 h-4 w-4"/> View My Profile</Link>
                        </Button>
                    </div>

                    <Card className="bg-card/80 backdrop-blur-sm border-accent/50 border-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-primary">₹{(profile.walletBalance || 0).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">This is your total withdrawable winnings.</p>
                        </CardContent>
                        <div className="p-6 pt-0">
                            <Button onClick={() => setIsRedeemDialogOpen(true)} className="w-full sm:w-auto" disabled={(profile.walletBalance || 0) <= 0}>
                                <PiggyBank className="mr-2 h-4 w-4"/> Redeem Winnings
                            </Button>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><History className="w-5 h-5"/> Transaction History</CardTitle>
                            <CardDescription>A record of your tournament entries and withdrawals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.length > 0 ? transactions.map(t => (
                                            <TableRow key={t.id}>
                                                <TableCell>{format(t.date, 'PP')}</TableCell>
                                                <TableCell className="font-medium">{t.description}</TableCell>
                                                <TableCell className={cn("text-right font-mono", t.amount > 0 ? "text-primary" : "text-destructive")}>
                                                    {t.amount > 0 ? '+' : ''}₹{Math.abs(t.amount).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center"><Badge variant={getStatusBadgeVariant(t.status)}>{t.status}</Badge></TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">No transactions yet.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                           </div>
                           <div className="space-y-4 md:hidden">
                                {transactions.length > 0 ? transactions.map(t => (
                                     <div key={t.id} className="p-4 bg-muted/50 rounded-lg border">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <p className="font-bold">{t.description}</p>
                                                <p className="text-sm text-muted-foreground">{format(t.date, 'PP')}</p>
                                            </div>
                                            <p className={cn("font-bold font-mono", t.amount > 0 ? "text-primary" : "text-destructive")}>
                                                {t.amount > 0 ? '+' : '-'}₹{Math.abs(t.amount).toLocaleString()}
                                            </p>
                                        </div>
                                         <div className="mt-2">
                                             <Badge variant={getStatusBadgeVariant(t.status)}>{t.status}</Badge>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center h-24 flex items-center justify-center">
                                        <p className="text-muted-foreground">No transactions yet.</p>
                                    </div>
                                )}
                           </div>
                        </CardContent>
                    </Card>

                </div>
            </main>
            <Footer />
        </div>
        </>
    );
}
