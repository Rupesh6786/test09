
"use client";

import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Loader2 } from 'lucide-react';
import type { UserProfileData, UserRegistration } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { PlayerProfileDisplay } from '@/components/player-profile-display';

export default function PlayerProfilePage() {
  const params = useParams<{ username: string }>();
  const encodedUsername = params.username;
  const [player, setPlayer] = useState<UserProfileData | null>(null);
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPlayerData = async (name: string) => {
        setIsLoading(true);
        setError(false);
        try {
            // Fetch user profile first
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("name", "==", name), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError(true);
                return; // Exit early if player is not found
            }
            
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data() as UserProfileData;
            setPlayer(userData);

            // Do not fetch registrations for public profiles to avoid permission errors.
            // The registrations will only be shown on the user's own profile page.

        } catch (err) {
            console.error("Error fetching player data:", err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (encodedUsername) {
        const usernameToFetch = Array.isArray(encodedUsername) ? encodedUsername[0] : encodedUsername;
        const username = decodeURIComponent(usernameToFetch);
        fetchPlayerData(username);
    }
  }, [encodedUsername]);


  if (isLoading) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 flex items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </main>
            <Footer />
        </div>
    );
  }
  
  if (error || !player) {
    notFound();
  }
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4">
            <PlayerProfileDisplay profile={player} registrations={registrations} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
