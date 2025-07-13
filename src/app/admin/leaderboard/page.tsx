
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { WinnerLog } from '@/lib/data';
import { format } from 'date-fns';

export default function AdminLeaderboardPage() {
  const [winners, setWinners] = useState<WinnerLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "winners"), orderBy("wonAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedWinners = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WinnerLog[];
        setWinners(fetchedWinners);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching winners:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-primary">Winners Log</h1>
          <p className="text-muted-foreground">A record of all tournament champions.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Winners</CardTitle>
          <CardDescription>List of players who have won recent tournaments.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Date Won</TableHead>
                  <TableHead className="text-right">Prize Money</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : winners.length > 0 ? (
                  winners.map((winner) => (
                    <TableRow key={winner.id}>
                      <TableCell className="font-medium">{winner.userName} <span className="text-muted-foreground">({winner.teamName})</span></TableCell>
                      <TableCell>{winner.tournamentTitle}</TableCell>
                      <TableCell>{winner.wonAt ? format(winner.wonAt.toDate(), 'PPP') : 'N/A'}</TableCell>
                      <TableCell className="text-right font-bold text-primary">₹{winner.prizeMoney.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">No winners have been announced yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
