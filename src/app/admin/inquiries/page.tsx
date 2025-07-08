
"use client";

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Loader2, MailCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Inquiry } from '@/lib/data';
import { format } from 'date-fns';

export default function AdminInquiriesPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const { toast } = useToast();

    const fetchInquiries = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, "inquiries"), orderBy("submittedAt", "desc"));
            const querySnapshot = await getDocs(q);
            const fetchedInquiries = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Inquiry[];
            setInquiries(fetchedInquiries);
        } catch (error) {
            console.error("Error fetching inquiries: ", error);
            toast({ title: "Error", description: "Failed to fetch inquiries.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, []);
    
    const filteredInquiries = useMemo(() => {
        return inquiries
            .filter(i => statusFilter === 'all' || i.status === statusFilter);
    }, [inquiries, statusFilter]);

    const handleMarkAsRead = async (inquiryId: string) => {
        const inquiryRef = doc(db, 'inquiries', inquiryId);
        try {
            await updateDoc(inquiryRef, { status: 'Read' });
            await fetchInquiries(); // Re-fetch to update UI
            toast({
                title: "Success",
                description: "Inquiry marked as read."
            });
        } catch (error) {
            console.error("Error updating inquiry: ", error);
            toast({ title: "Error", description: "Failed to update inquiry.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-3xl font-bold text-primary shrink-0">Contact Inquiries</h1>
                <div className="flex w-full items-center justify-start gap-2 md:w-auto md:justify-end">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Read">Read</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : filteredInquiries.length > 0 ? (
                                    filteredInquiries.map(inquiry => (
                                        <TableRow key={inquiry.id}>
                                            <TableCell className="hidden font-mono text-xs md:table-cell">
                                                {inquiry.submittedAt ? format(inquiry.submittedAt.toDate(), 'PPpp') : 'N/A'}
                                            </TableCell>
                                            <TableCell className="font-medium">{inquiry.name}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{inquiry.email}</TableCell>
                                            <TableCell className="max-w-[150px] sm:max-w-xs truncate">{inquiry.message}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={inquiry.status === 'Read' ? 'secondary' : 'success'}>
                                                    {inquiry.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                            {inquiry.status === 'New' && (
                                                    <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(inquiry.id)}>
                                                        <MailCheck className="mr-0 h-4 w-4 md:mr-2" />
                                                        <span className="hidden md:inline">Mark Read</span>
                                                    </Button>
                                            )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">No inquiries found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-24">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : filteredInquiries.length > 0 ? (
                            <div className="space-y-4 p-4">
                                {filteredInquiries.map(inquiry => (
                                    <div key={inquiry.id} className="p-4 bg-muted/50 rounded-lg border">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <p className="font-bold">{inquiry.name}</p>
                                                <p className="text-sm text-muted-foreground">{inquiry.email}</p>
                                                <p className="text-xs text-muted-foreground font-mono mt-1">
                                                    {inquiry.submittedAt ? format(inquiry.submittedAt.toDate(), 'PPp') : 'N/A'}
                                                </p>
                                            </div>
                                            <Badge variant={inquiry.status === 'Read' ? 'secondary' : 'success'} className="shrink-0 capitalize">{inquiry.status}</Badge>
                                        </div>
                                        <p className="mt-4 text-sm bg-background/50 p-3 rounded-md">{inquiry.message}</p>
                                        {inquiry.status === 'New' && (
                                            <div className="mt-4 pt-4 border-t border-border/20 flex justify-end">
                                                <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(inquiry.id)}>
                                                    <MailCheck className="mr-2 h-4 w-4" />
                                                    Mark as Read
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="flex justify-center items-center h-24">
                                <p className="text-muted-foreground">No inquiries found.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
