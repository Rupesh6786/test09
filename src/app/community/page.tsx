"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Community, UserProfileData } from '@/lib/data';
import { CommunityCard } from '@/components/community-card';
import { CreateCommunityDialog } from '@/components/create-community-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerSearchResultCard } from '@/components/player-search-result-card';

export default function CommunityPage() {
    // Community state
    const [communities, setCommunities] = useState<Community[]>([]);
    const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
    const [communitySearchTerm, setCommunitySearchTerm] = useState('');
    const [isCommunityLoading, setIsCommunityLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Player state
    const [allPlayers, setAllPlayers] = useState<UserProfileData[]>([]);
    const [filteredPlayers, setFilteredPlayers] = useState<UserProfileData[]>([]);
    const [playerSearchTerm, setPlayerSearchTerm] = useState('');
    const [isPlayerLoading, setIsPlayerLoading] = useState(true);
    
    const { toast } = useToast();
    
    const fetchCommunities = async () => {
        setIsCommunityLoading(true);
        try {
            const q = query(collection(db, 'communities'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedCommunities = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Community[];
            setCommunities(fetchedCommunities);
            setFilteredCommunities(fetchedCommunities);
        } catch (error) {
            console.error("Error fetching communities:", error);
            toast({ title: "Error", description: "Failed to load communities.", variant: "destructive" });
        } finally {
            setIsCommunityLoading(false);
        }
    };

    const fetchPlayers = async () => {
        setIsPlayerLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const fetchedPlayers = querySnapshot.docs.map(doc => doc.data() as UserProfileData);
            setAllPlayers(fetchedPlayers);
            setFilteredPlayers(fetchedPlayers);
        } catch (error) {
            console.error("Error fetching players:", error);
            toast({ title: "Error", description: "Failed to load players.", variant: "destructive" });
        } finally {
            setIsPlayerLoading(false);
        }
    };
    
    useEffect(() => {
        fetchCommunities();
        fetchPlayers();
    }, []);

    // Filter communities
    useEffect(() => {
        const results = communities.filter(community =>
            community.name.toLowerCase().includes(communitySearchTerm.toLowerCase())
        );
        setFilteredCommunities(results);
    }, [communitySearchTerm, communities]);

    // Filter players
    useEffect(() => {
        if (!playerSearchTerm) {
            setFilteredPlayers(allPlayers);
            return;
        }
        const results = allPlayers.filter(player =>
            player.name.toLowerCase().includes(playerSearchTerm.toLowerCase()) ||
            (player.gameId && player.gameId.toLowerCase().includes(playerSearchTerm.toLowerCase()))
        );
        setFilteredPlayers(results);
    }, [playerSearchTerm, allPlayers]);
    
    const renderCommunitySkeletons = (count: number) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
               <div key={i} className="text-center p-6 bg-card/80 backdrop-blur-sm border-border/50 flex flex-col items-center gap-4 rounded-lg">
                   <Skeleton className="h-24 w-24 rounded-full" />
                   <Skeleton className="h-5 w-3/4" />
                   <Skeleton className="h-4 w-1/2" />
                   <Skeleton className="h-10 w-full" />
               </div>
            ))}
        </div>
    );

    const renderPlayerSkeletons = (count: number) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="p-4 bg-card/80 backdrop-blur-sm border-border/50 flex items-center gap-4 rounded-lg">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <CreateCommunityDialog 
                isOpen={isCreateDialogOpen}
                setIsOpen={setIsCreateDialogOpen}
                onCommunityCreated={fetchCommunities}
            />
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 py-16 md:py-24">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-6">
                            <h1 className="font-headline text-4xl md:text-5xl font-bold uppercase tracking-wider text-primary text-shadow-primary">
                                Community Hub
                            </h1>
                            <p className="text-lg text-muted-foreground mt-2">Find players, join communities, and grow your network.</p>
                        </div>
                        
                        <Tabs defaultValue="communities" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto bg-card/80 mb-8">
                                <TabsTrigger value="communities">Communities</TabsTrigger>
                                <TabsTrigger value="players">Players</TabsTrigger>
                            </TabsList>

                            <TabsContent value="communities">
                                <div className="max-w-4xl mx-auto mb-12">
                                   <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="relative w-full flex-grow">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder="Search for a community..."
                                                className="pl-10 h-12 text-base"
                                                value={communitySearchTerm}
                                                onChange={(e) => setCommunitySearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Button size="lg" className="w-full sm:w-auto" onClick={() => setIsCreateDialogOpen(true)}>
                                            <Plus className="mr-2 h-5 w-5" /> Create Community
                                        </Button>
                                    </div>
                                </div>
                                
                                <div>
                                     {isCommunityLoading ? (
                                        renderCommunitySkeletons(4)
                                    ) : (
                                        filteredCommunities.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                                {filteredCommunities.map(community => (
                                                    <CommunityCard key={community.id} community={community} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <p className="text-muted-foreground">No communities found matching your search.</p>
                                            </div>
                                        )
                                     )}
                                </div>
                            </TabsContent>

                            <TabsContent value="players">
                                <div className="max-w-xl mx-auto mb-12">
                                   <div className="relative w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Search players by name or game ID..."
                                            className="pl-10 h-12 text-base"
                                            value={playerSearchTerm}
                                            onChange={(e) => setPlayerSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                     {isPlayerLoading ? (
                                        renderPlayerSkeletons(8)
                                    ) : (
                                        filteredPlayers.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
                                                {filteredPlayers.map(player => (
                                                    <PlayerSearchResultCard key={player.uid} user={player} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <p className="text-muted-foreground">No players found matching your search.</p>
                                            </div>
                                        )
                                     )}
                                </div>
                            </TabsContent>
                        </Tabs>

                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}
