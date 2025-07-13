

"use client";

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Loader2, Search, UserX, UserCheck, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { UserProfileData, WinnerLog } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isWinsDialogOpen, setIsWinsDialogOpen] = useState(false);
  const [selectedUserForWins, setSelectedUserForWins] = useState<UserProfileData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const fetchedUsers = snapshot.docs.map(doc => doc.data() as UserProfileData);
        setUsers(fetchedUsers);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching users: ", error);
        toast({
            title: "Error",
            description: "Failed to fetch users.",
            variant: "destructive"
        });
        setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [toast]);

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => 
        searchTerm === '' || 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(u => statusFilter === 'all' || u.status === statusFilter);
  }, [users, searchTerm, statusFilter]);

  const handleStatusChange = async (uid: string, newStatus: 'active' | 'banned') => {
    const userRef = doc(db, 'users', uid);
    try {
      await updateDoc(userRef, { status: newStatus });
      toast({
        title: "Success",
        description: `User has been ${newStatus === 'banned' ? 'banned' : 'unbanned'}.`
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user status.", variant: "destructive"});
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
        await deleteDoc(doc(db, "users", uid));
        toast({
            title: "User Deleted",
            description: "The user's data has been removed from Firestore.",
        });
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete user.", variant: "destructive"});
    }
  };

  const handleViewWins = (user: UserProfileData) => {
    setSelectedUserForWins(user);
    setIsWinsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">Players / Users</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search players..."
              className="pl-8 sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.teamName}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'banned' ? 'destructive' : 'success'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewWins(user)}><Eye className="w-4 h-4" /></Button>
                        {user.status === 'active' ? (
                          <Button variant="ghost" size="icon" onClick={() => handleStatusChange(user.uid, 'banned')}>
                            <UserX className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleStatusChange(user.uid, 'active')}>
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user's
                                data from the database.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.uid)}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No users found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile Card View */}
          <div className="space-y-4 p-4 md:hidden">
            {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                    <div key={user.uid} className="p-4 bg-muted/50 rounded-lg border">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <p className="font-bold">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <p className="text-xs text-muted-foreground">Team: {user.teamName}</p>
                            </div>
                            <Badge variant={user.status === 'banned' ? 'destructive' : 'success'} className="shrink-0 capitalize">{user.status}</Badge>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/20 flex justify-end space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleViewWins(user)}><Eye className="w-4 h-4" /></Button>
                             {user.status === 'active' ? (
                                <Button variant="ghost" size="icon" onClick={() => handleStatusChange(user.uid, 'banned')}>
                                <UserX className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button variant="ghost" size="icon" onClick={() => handleStatusChange(user.uid, 'active')}>
                                <UserCheck className="w-4 h-4" />
                                </Button>
                            )}
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the user's data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteUser(user.uid)}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))
            ) : (
              <div className="text-center h-24 flex items-center justify-center">
                  <p className="text-muted-foreground">No users found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <UserWinsDialog 
        isOpen={isWinsDialogOpen}
        setIsOpen={setIsWinsDialogOpen}
        user={selectedUserForWins}
      />
    </div>
  );
}

function UserWinsDialog({ isOpen, setIsOpen, user }: { isOpen: boolean, setIsOpen: (open: boolean) => void, user: UserProfileData | null }) {
    const [wins, setWins] = useState<WinnerLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            const fetchWins = async () => {
                setIsLoading(true);
                setWins([]);
                try {
                    const q = query(collection(db, 'winners'), where('userId', '==', user.uid), orderBy('wonAt', 'desc'));
                    const querySnapshot = await getDocs(q);
                    setWins(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}) as WinnerLog));
                } catch (e) {
                    console.error("Error fetching wins", e);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchWins();
        }
    }, [isOpen, user]);

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Win History for {user.name}</DialogTitle>
                    <DialogDescription>A list of all tournaments won by this player.</DialogDescription>
                </DialogHeader>
                <div className="max-h-80 overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-24"><Loader2 className="w-6 h-6 animate-spin" /></div>
                    ) : wins.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tournament</TableHead>
                                    <TableHead>Prize</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {wins.map(win => (
                                    <TableRow key={win.id}>
                                        <TableCell>{win.tournamentTitle}</TableCell>
                                        <TableCell>₹{win.prizeMoney.toLocaleString()}</TableCell>
                                        <TableCell>{win.wonAt ? format(win.wonAt.toDate(), 'PP') : 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">This player has not won any tournaments yet.</p>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
