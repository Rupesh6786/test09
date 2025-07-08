
"use client";

import { useEffect, useState, useRef } from 'react';
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
import type { Community, CommunityMessage, UserProfileData } from '@/lib/data';
import { Loader2, Send, Users, LogIn, UserPlus, LogOut, Crown } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ChatMessage } from '@/components/chat-message';
import Link from 'next/link';

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

  // Checks for authenticated user, redirects to login if not found.
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

  // Fetches community data only if the user is authenticated.
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

  if (isAuthLoading || isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!community) {
    return notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-7xl py-8">
            {/* Community Header */}
            <Card className="mb-6 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-primary">
                        <AvatarImage src={community.avatar} alt={community.name} />
                        <AvatarFallback className="text-4xl">{community.name.charAt(0)}</AvatarFallback>
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

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Member List */}
                <div className="lg:col-span-1">
                    <Card className="bg-card/80 backdrop-blur-sm sticky top-24">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2"><Users/>Members</CardTitle>
                            <span className="text-lg font-bold">{community.members}</span>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <ul className="space-y-3">
                                    {members.map(member => (
                                      <li key={member.uid}>
                                        <Link href={`/players/${encodeURIComponent(member.name)}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={member.photoURL} alt={member.name} />
                                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{member.name}</span>
                                            {member.uid === community.creatorId && <Crown className="w-4 h-4 text-yellow-500 ml-auto" title="Creator"/>}
                                        </Link>
                                      </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Chat Area */}
                <div className="lg:col-span-3">
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
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
