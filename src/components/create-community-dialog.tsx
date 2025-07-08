
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const communitySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(30, 'Name cannot be longer than 30 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(100, 'Description cannot be longer than 100 characters'),
});

type CommunityFormValues = z.infer<typeof communitySchema>;

interface CreateCommunityDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onCommunityCreated: () => void;
}

const communityIcons = [
    '/community_icons/icons_battle_seeker.png',
    '/community_icons/icons_frag_masters.png',
    '/community_icons/icons_the_rangers.png',
    '/community_icons/icons_warrior_kingdom.png',
];

export function CreateCommunityDialog({ isOpen, setIsOpen, onCommunityCreated }: CreateCommunityDialogProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const { toast } = useToast();

    const form = useForm<CommunityFormValues>({
        resolver: zodResolver(communitySchema),
        defaultValues: { name: '', description: '' },
    });
    
    const resetForm = () => {
        form.reset();
        setSelectedAvatar(null);
    }
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetForm();
        }
        setIsOpen(open);
    }

    const onSubmit = async (data: CommunityFormValues) => {
        const user = auth.currentUser;
        if (!user) {
            toast({ title: "Error", description: "You must be logged in to create a community.", variant: "destructive" });
            return;
        }
        if (!selectedAvatar) {
            toast({ title: "Error", description: "Please select a community icon.", variant: "destructive" });
            return;
        }
        
        setIsSaving(true);
        
        try {
            await addDoc(collection(db, "communities"), {
                name: data.name,
                description: data.description,
                avatar: selectedAvatar,
                creatorId: user.uid,
                members: 1,
                createdAt: serverTimestamp(),
                game: 'All', // Default game
                memberIds: [user.uid],
            });

            toast({ title: "Success", description: `Community "${data.name}" created.` });
            onCommunityCreated(); // Callback to refresh the list on the parent page
            handleOpenChange(false);
            
        } catch (error) {
            console.error("Failed to create community:", error);
            toast({ title: "Error", description: "Could not create community. Please try again.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create a new Community</DialogTitle>
              <DialogDescription>
                Build a new hub for players to connect. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <div>
                        <FormLabel>Choose an Icon</FormLabel>
                        <div className="grid grid-cols-4 gap-4 mt-2">
                            {communityIcons.map((icon) => (
                                <button 
                                    key={icon}
                                    type="button"
                                    onClick={() => setSelectedAvatar(icon)}
                                    className={cn(
                                        "rounded-lg p-1 border-2 transition-all",
                                        selectedAvatar === icon ? 'border-primary ring-2 ring-primary' : 'border-transparent hover:border-primary/50'
                                    )}
                                    disabled={isSaving}
                                >
                                    <Image
                                        src={icon}
                                        alt={`Community icon`}
                                        width={80}
                                        height={80}
                                        className="rounded-md aspect-square object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Community Name</FormLabel>
                                <FormControl><Input placeholder="Elite Gamers" {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea placeholder="A place for the best of the best..." {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Community
                      </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
        </Dialog>
    );
}
