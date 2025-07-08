
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Helper to create the schema dynamically based on team type
const createRegistrationSchema = (teamType: 'Solo' | 'Duo' | 'Squad') => {
    const gameIdSchema = z.string()
        .regex(/^[0-9]+$/, "Game UID must be numeric.")
        .min(8, 'Game UID must be 8-12 digits.')
        .max(12, 'Game UID must be 8-12 digits.');

    let schemaDefinition: any = {
        teamName: z.string().min(2, 'Please enter your team name'),
        upiId: z.string().min(3, 'Please enter a valid UPI ID').includes('@', {message: "UPI ID must contain '@'"}),
        player1GameId: gameIdSchema,
    };

    if (teamType === 'Duo' || teamType === 'Squad') {
        schemaDefinition.player2GameId = gameIdSchema;
    }
    if (teamType === 'Squad') {
        schemaDefinition.player3GameId = gameIdSchema;
        schemaDefinition.player4GameId = gameIdSchema;
    }

    return z.object(schemaDefinition);
};


export function MatchRegistrationForm({ tournamentTitle, tournamentId, teamType }: { tournamentTitle: string; tournamentId: string; teamType: 'Solo' | 'Duo' | 'Squad' }) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const registrationSchema = createRegistrationSchema(teamType);
    type RegistrationFormValues = z.infer<typeof registrationSchema>;

    // Dynamically set default values based on team type to avoid uncontrolled to controlled input error.
    const defaultValues: Partial<RegistrationFormValues> = {
        teamName: '',
        upiId: '',
        player1GameId: '',
    };
    if (teamType === 'Duo' || teamType === 'Squad') {
        defaultValues.player2GameId = '';
    }
    if (teamType === 'Squad') {
        defaultValues.player3GameId = '';
        defaultValues.player4GameId = '';
    }

    const form = useForm<RegistrationFormValues>({
        resolver: zodResolver(registrationSchema),
        defaultValues: defaultValues as RegistrationFormValues,
    });

    const onSubmit: SubmitHandler<RegistrationFormValues> = async (data) => {
        const user = auth.currentUser;

        if (!user) {
            toast({
                title: "Not Logged In",
                description: "You must be logged in to register for a match.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const userName = userDocSnap.exists() ? userDocSnap.data().name : user.email;

            const gameIds = [data.player1GameId];
            if ((teamType === 'Duo' || teamType === 'Squad') && data.player2GameId) {
                gameIds.push(data.player2GameId);
            }
            if (teamType === 'Squad') {
                if (data.player3GameId) gameIds.push(data.player3GameId);
                if (data.player4GameId) gameIds.push(data.player4GameId);
            }

            await addDoc(collection(db, "registrations"), {
                userId: user.uid,
                userEmail: user.email,
                tournamentId: tournamentId,
                tournamentTitle: tournamentTitle,
                gameIds: gameIds,
                teamName: data.teamName,
                upiId: data.upiId,
                registeredAt: serverTimestamp(),
                paymentStatus: 'Pending',
            });
    
            const phoneNumber = '919321738137';
            const message = `Subject: ${tournamentTitle} – Registration Confirmation

Hello Team,

I have successfully registered for the ${tournamentTitle} tournament. Please find my registration details below:

Player Name: ${userName}
Team Name: ${data.teamName}
Game UIDs: ${gameIds.join(', ')}
UPI ID for Payment: ${data.upiId}

Kindly confirm my registration at your earliest convenience.

Thank you!
Best regards,
${userName}`;

            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            
            window.open(whatsappUrl, '_blank');
            
            router.push(`/tournaments/${tournamentId}/register/success`);

        } catch (error) {
            console.error("Failed to save registration:", error);
            toast({
                title: "Registration Failed",
                description: "Could not save your registration details. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Your team's name" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="player1GameId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Player 1 Game UID (Yours)</FormLabel>
                    <FormControl>
                        <Input placeholder="Your in-game UID" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                {(teamType === 'Duo' || teamType === 'Squad') && (
                    <FormField
                        control={form.control}
                        name="player2GameId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Player 2 Game UID</FormLabel>
                            <FormControl>
                                <Input placeholder="Player 2 in-game UID" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                
                {teamType === 'Squad' && (
                    <>
                        <FormField
                            control={form.control}
                            name="player3GameId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Player 3 Game UID</FormLabel>
                                <FormControl>
                                    <Input placeholder="Player 3 in-game UID" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="player4GameId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Player 4 Game UID</FormLabel>
                                <FormControl>
                                    <Input placeholder="Player 4 in-game UID" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
                
                <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>UPI ID for Payment</FormLabel>
                    <FormControl>
                        <Input placeholder="yourname@upi" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register & Confirm on WhatsApp
                </Button>
            </form>
        </Form>
    );
}
