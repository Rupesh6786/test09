
"use client";

import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User, updateProfile } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { UserProfileData, UserRegistration } from '@/lib/data';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlayerProfileDisplay } from './player-profile-display';
import { EditProfileDialog } from './edit-profile-dialog';

export function UserProfile() {
    const [authUser, setAuthUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async (uid: string) => {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfileData);
            } else {
                console.log("No such user profile!");
            }
        };

        const fetchRegistrations = async (uid: string) => {
            const q = query(collection(db, 'registrations'), where('userId', '==', uid));
            const querySnapshot = await getDocs(q);
            const userRegistrations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserRegistration[];
            userRegistrations.sort((a, b) => a.registeredAt && b.registeredAt ? b.registeredAt.toMillis() - a.registeredAt.toMillis() : 0);
            setRegistrations(userRegistrations);
        };

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setAuthUser(user);
                await fetchUserData(user.uid);
                await fetchRegistrations(user.uid);
            } else {
                setAuthUser(null);
                setProfile(null);
                setRegistrations([]);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && authUser) {
            handleImageUpload(file, authUser);
        }
    };

    const handleImageUpload = async (file: File, user: User) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const { path: downloadURL } = await response.json();

            await updateProfile(user, { photoURL: downloadURL });
            await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });

            setProfile(prev => prev ? { ...prev, photoURL: downloadURL } : null);
            toast({ title: "Success", description: "Profile picture updated!" });
        } catch (error) {
            console.error("Upload failed:", error);
            toast({ title: "Upload Failed", description: "Could not upload your image.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleProfileUpdate = async (data: Partial<UserProfileData>) => {
        if (!authUser) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }
        
        try {
            const userDocRef = doc(db, 'users', authUser.uid);
            await updateDoc(userDocRef, data);
            
            if (data.name && data.name !== authUser.displayName) {
                await updateProfile(authUser, { displayName: data.name });
            }

            setProfile(prev => prev ? { ...prev, ...data } : null);
            toast({ title: "Success", description: "Your profile has been updated." });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        }
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    if (!authUser || !profile) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Please Log In</h2>
                <p className="text-muted-foreground">You need to be logged in to view your profile.</p>
                <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
            </div>
        );
    }
    
    return (
        <>
            <PlayerProfileDisplay
                profile={profile}
                registrations={registrations}
                isCurrentUser={true}
                isUploading={isUploading}
                handleFileChange={handleFileChange}
                fileInputRef={fileInputRef}
                onEditClick={() => setIsEditDialogOpen(true)}
            />
            <EditProfileDialog
                isOpen={isEditDialogOpen}
                setIsOpen={setIsEditDialogOpen}
                profile={profile}
                onSave={handleProfileUpdate}
            />
        </>
    );
}
