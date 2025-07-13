

"use client"

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, doc, runTransaction, orderBy, onSnapshot } from 'firebase/firestore';
import type { RedeemRequest } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const revenueByMonthData = [
  { month: "Jan", revenue: 4000 },
  { month: "Feb", revenue: 3000 },
  { month: "Mar", revenue: 5000 },
  { month: "Apr", revenue: 4500 },
  { month: "May", revenue: 6000 },
  { month: "Jun", revenue: 8000 },
];

const topGrossingData = [
  { name: "Free Fire Frenzy", revenue: 2500 },
  { name: "Booyah Bonanza", revenue: 4000 },
  { name: "Weekend Warriors Cup", revenue: 4800 },
  { name: "The Grand Clash", revenue: 11000 },
];

export default function RevenuePage() {
    const [pendingRequests, setPendingRequests] = useState<RedeemRequest[]>([]);
    const [completedRequests, setCompletedRequests] = useState<RedeemRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, "redeemRequests"), orderBy("requestedAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RedeemRequest[];
            setPendingRequests(allRequests.filter(req => req.status === 'Pending'));
            setCompletedRequests(allRequests.filter(req => req.status === 'Completed'));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching revenue data:", error);
            toast({ title: "Error", description: "Failed to fetch revenue data.", variant: "destructive" });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const handleMarkAsPaid = async (request: RedeemRequest) => {
        const requestRef = doc(db, 'redeemRequests', request.id);
        const userRef = doc(db, 'users', request.userId);

        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw "User not found!";
                }
                const currentWalletBalance = (userDoc.data().walletBalance || 0);
                const newBalance = currentWalletBalance - request.amount;
                if (newBalance < 0) {
                    throw "User has insufficient balance for this transaction.";
                }
                transaction.update(requestRef, { status: 'Completed' });
                transaction.update(userRef, { walletBalance: newBalance });
            });
            
            toast({ title: "Success", description: "Request marked as paid and user balance updated.", action: <CheckCircle className="h-5 w-5 text-green-500" /> });
        } catch (error: any) {
             console.error("Error processing payment: ", error);
            let errorMessage = "Failed to process payment.";
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        }
    };

    const handleExportCSV = () => {
        if (completedRequests.length === 0) {
            toast({ title: "No Data", description: "There are no completed payments to export." });
            return;
        }

        const headers = ['Player Name', 'Email', 'Phone Number', 'Date Completed', 'Amount', 'Status'];
        
        const escapeCSV = (str: string | number) => {
            const s = String(str);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };
        
        const csvRows = [
            headers.join(','),
            ...completedRequests.map(req => {
                const row = [
                    escapeCSV(req.userName),
                    escapeCSV(req.userEmail),
                    escapeCSV(req.phoneNumber),
                    escapeCSV(req.requestedAt ? format(req.requestedAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A'),
                    escapeCSV(req.amount),
                    escapeCSV(req.status)
                ];
                return row.join(',');
            })
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `battlestacks_payments_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">Revenue</h1>
        <Button onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Month</CardTitle>
            <CardDescription>Static demo data for visualization.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByMonthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))" 
                  }} 
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Grossing Tournaments</CardTitle>
            <CardDescription>Highest revenue-generating tournaments.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topGrossingData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                    <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} interval={0} />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))" 
                      }} 
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </CardContent>
        </Card>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle>Pending Redeem Requests</CardTitle>
          <CardDescription>Review and process pending withdrawal requests from players.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : pendingRequests.length > 0 ? (
                pendingRequests.map((req) => (
                    <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.userName}<br/><span className="text-xs text-muted-foreground">{req.userEmail}</span></TableCell>
                        <TableCell className="hidden sm:table-cell">{req.requestedAt ? format(req.requestedAt.toDate(), 'PPpp') : 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono">{req.phoneNumber}</TableCell>
                        <TableCell className="font-bold text-primary">₹{req.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                           <Button size="sm" onClick={() => handleMarkAsPaid(req)}>Mark as Paid</Button>
                        </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No pending requests.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>A list of recent payments made to players.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : completedRequests.length > 0 ? (
                completedRequests.map((req) => (
                    <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.userName}</TableCell>
                        <TableCell className="hidden sm:table-cell">{req.requestedAt ? format(req.requestedAt.toDate(), 'PP') : 'N/A'}</TableCell>
                        <TableCell>₹{req.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                           <Badge variant="success">Completed</Badge>
                        </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">No completed payments found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
