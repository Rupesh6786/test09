
"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import type { Community, CommunityMessage, UserProfileData, BracketTeam } from '@/lib/data';
import { Loader2, Send, Users, UserPlus, LogOut, Crown, Shield, Star, Flame, Trophy, Megaphone, CalendarDays, Bell, UserCheck, UserX } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ChatMessage } from '@/components/chat-message';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// --- New Sub-components for the redesigned page ---

function Announcements({ announcements }: { announcements: Community['announcements'] }) {
    if (!announcements || announcements.length === 0) return null;

    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Megaphone /> Pinned Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {announcements.map((ann, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">{ann.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">by {ann.author} on {ann.date}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

const achievementIcons = {
  Trophy: Trophy,
  Flame: Flame,
  Star: Star,
};

function Achievements({ achievements }: { achievements: Community['achievements'] }) {
    if (!achievements || achievements.length === 0) return null;
    
    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Trophy /> Clan Achievements</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                {achievements.map((ach, index) => {
                    const Icon = achievementIcons[ach.icon];
                    return (
                        <div key={index} className="bg-muted/50 p-3 rounded-lg text-center">
                            <Icon className="w-8 h-8 text-primary mx-auto mb-2"/>
                            <p className="text-sm font-semibold">{ach.title}</p>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function ClanEvents({ events }: { events: Community['events'] }) {
    if (!events || events.length === 0) return null;

    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><CalendarDays /> Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {events.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.date}</p>
                        </div>
                        <Button variant="ghost" size="icon"><Bell className="w-4 h-4" /></Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function JoinRequests({ requests }: { requests: Community['joinRequests'] }) {
    if (!requests || requests.length === 0) return null;

    return (
         <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><UserPlus /> Join Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                 {requests.map((req) => (
                    <div key={req.userId} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={req.userAvatar} />
                                <AvatarFallback>{req.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{req.userName}</span>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="text-green-500 hover:bg-green-500/10 hover:text-green-500"><UserCheck className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10 hover:text-red-500"><UserX className="w-4 h-4" /></Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}


// --- Main Page Component ---

export default function CommunityDetailPage() {
  const params = useParams<{ id: string }>();
  const communityId = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<UserProfileData[]>([]);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isMember, setIsMember] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // --- Placeholder Data for New Features ---
  const placeholderData = useMemo(() => ({
    announcements: [
      { text: "Reminder: Scrims tonight at 8 PM sharp!", author: "Leader", date: "Aug 23, 2024" },
      { text: "Congrats to the team for placing 2nd in the weekly!", author: "Co-Leader", date: "Aug 21, 2024" }
    ],
    achievements: [
        { title: "Weekly Champs", icon: 'Trophy' as const },
        { title: "10-Win Streak", icon: 'Flame' as const },
        { title: "Top Scorer", icon: 'Star' as const },
        { title: "MVP of the Month", icon: 'Star' as const },
    ],
    events: [
        { title: "Weekend Warriors Cup", date: "Aug 25, 2024 @ 7 PM" },
        { title: "Practice Scrim vs. Titans", date: "Aug 27, 2024 @ 9 PM" }
    ],
    joinRequests: [
        { userId: 'user123', userName: 'NewPlayer_1', userAvatar: 'https://placehold.co/40x40.png?text=N' },
        { userId: 'user456', userName: 'ProGamer_2', userAvatar: 'https://placehold.co/40x40.png?text=P' }
    ]
  }), []);


  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser(user);
      } else {
        router.push('/login');
      }
      setIsAuthLoading(false);
    });
    return () => authUnsubscribe();
  }, [router]);

  useEffect(() => {
    if (communityId && authUser) {
      const communityRef = doc(db, 'communities', communityId);
      const unsubscribeCommunity = onSnapshot(communityRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Community;
          setCommunity(data);
          fetchMembers(data.memberIds || []);
        } else {
          notFound();
        }
        setIsLoading(false);
      });

      return () => unsubscribeCommunity();
    }
  }, [communityId, authUser]);
  
  useEffect(() => {
    if (community && authUser) {
      setIsMember(community.memberIds && community.memberIds.includes(authUser.uid));
    } else {
      setIsMember(false);
    }
  }, [community, authUser]);

  useEffect(() => {
    if (communityId && isMember) {
      const messagesRef = collection(db, 'communities', communityId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
        const fetchedMessages = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CommunityMessage[];
        setMessages(fetchedMessages);
      });
      return () => unsubscribeMessages();
    } else {
      setMessages([]);
    }
  }, [communityId, isMember]);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMembers = async (memberIds: string[]) => {
    if (!memberIds || memberIds.length === 0) {
        setMembers([]);
        return;
    };
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', 'in', memberIds));
    const querySnapshot = await getDocs(q);
    const fetchedMembers = querySnapshot.docs.map(doc => doc.data() as UserProfileData);
    setMembers(fetchedMembers);
  };

  const handleJoinLeave = async () => {
    if (!authUser) {
      toast({ title: "Login Required", description: "You must be logged in to join.", variant: "destructive" });
      return;
    }
    setIsActionLoading(true);
    const communityRef = doc(db, 'communities', communityId);
    try {
      if (isMember) {
        await updateDoc(communityRef, {
          memberIds: arrayRemove(authUser.uid),
          members: increment(-1)
        });
        toast({ title: "You have left the community." });
      } else {
        await updateDoc(communityRef, {
          memberIds: arrayUnion(authUser.uid),
          members: increment(1)
        });
        toast({ title: "Welcome to the community!" });
      }
    } catch (error) {
      console.error("Error joining/leaving community:", error);
      toast({ title: "Error", description: "Could not perform action. Please try again.", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !authUser || !isMember) return;
    
    const userDocRef = doc(db, 'users', authUser.uid);
    const userSnap = await getDoc(userDocRef);
    const userData = userSnap.data();

    const messagesRef = collection(db, 'communities', communityId, 'messages');
    try {
      await addDoc(messagesRef, {
        text: newMessage,
        createdAt: serverTimestamp(),
        userId: authUser.uid,
        userName: userData?.name || authUser.email,
        userAvatar: userData?.photoURL || ''
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Leader': return <Crown className="w-4 h-4 text-yellow-500" title="Leader"/>;
      case 'Co-Leader': return <Shield className="w-4 h-4 text-blue-500" title="Co-Leader"/>;
      default: return null;
    }
  };
  
  if (isAuthLoading || isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!community) {
    return notFound();
  }
  
  const isCreator = authUser?.uid === community.creatorId;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-7xl py-8">
            <Card className="mb-6 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-primary rounded-md">
                        <AvatarImage src={community.avatar} alt={community.name} />
                        <AvatarFallback className="text-4xl rounded-md">{community.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">{community.name}</h1>
                        <p className="text-muted-foreground">{community.description}</p>
                    </div>
                    <div>
                        <Button onClick={handleJoinLeave} disabled={isActionLoading}>
                            {isActionLoading ? <Loader2 className="animate-spin" /> : (isMember ? <LogOut /> : <UserPlus />)}
                            {isMember ? 'Leave Community' : 'Join Community'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="bg-card/80 backdrop-blur-sm sticky top-24">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2"><Users/>Members</CardTitle>
                            <span className="text-lg font-bold">{community.members}</span>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <ul className="space-y-1 pr-2">
                                    {members.map(member => {
                                        const role = member.uid === community.creatorId ? 'Leader' : 'Member';
                                        return (
                                            <li key={member.uid}>
                                                <Link href={`/players/${encodeURIComponent(member.name)}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                                    <div className="relative">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={member.photoURL} alt={member.name} />
                                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                                                    </div>
                                                    <span className="font-medium flex-grow truncate">{member.name}</span>
                                                    {getRoleIcon(role)}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Center Column */}
                <div className="lg:col-span-5 space-y-6">
                     <Announcements announcements={placeholderData.announcements} />
                     <Card className="bg-card/80 backdrop-blur-sm flex flex-col h-[70vh]">
                        <CardHeader><CardTitle className="text-xl">Community Chat</CardTitle></CardHeader>
                        <CardContent className="flex-grow overflow-hidden">
                            <ScrollArea className="h-full pr-4" ref={chatContainerRef}>
                                {isMember ? (
                                    messages.length > 0 ? (
                                        <div className="space-y-6">
                                            {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                                        </div>
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <p className="text-muted-foreground">No messages yet. Say hello!</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <p className="text-muted-foreground">Join the community to see and send messages.</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                        <div className="p-4 border-t">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input 
                                    placeholder={isMember ? "Type a message..." : "Join to chat"} 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={!isMember || isActionLoading}
                                />
                                <Button type="submit" disabled={!isMember || !newMessage.trim() || isActionLoading}>
                                    <Send/>
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>

                {/* Right Column */}
                 <div className="lg:col-span-4 space-y-6">
                    <Achievements achievements={placeholderData.achievements} />
                    <ClanEvents events={placeholderData.events} />
                    {isCreator && <JoinRequests requests={placeholderData.joinRequests} />}
                 </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

