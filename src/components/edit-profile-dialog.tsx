
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from 'lucide-react';
import type { UserProfileData } from '@/lib/data';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  gameId: z.string().min(3, 'Game ID must be at least 3 characters.'),
  teamName: z.string().min(2, 'Team name must be at least 2 characters.'),
  phoneNumber: z.string().min(10, 'Please enter a valid 10-digit phone number.').max(10, 'Please enter a valid 10-digit phone number.'),
  bio: z.string().max(160, 'Bio cannot be longer than 160 characters.').optional(),
  preferredGame: z.enum(['PUBG', 'Free Fire', 'Both']).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  profile: UserProfileData;
  onSave: (data: ProfileFormValues) => Promise<void>;
}

export function EditProfileDialog({ isOpen, setIsOpen, profile, onSave }: EditProfileDialogProps) {
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            gameId: '',
            teamName: '',
            phoneNumber: '',
            bio: '',
            preferredGame: 'Both',
        },
    });

    useEffect(() => {
        if (isOpen && profile) {
            form.reset({
                name: profile.name || '',
                gameId: profile.gameId || '',
                teamName: profile.teamName || '',
                phoneNumber: profile.phoneNumber || '',
                bio: profile.bio || '',
                preferredGame: profile.preferredGame || 'Both',
            });
        }
    }, [isOpen, profile, form]);

    const handleSubmit = async (data: ProfileFormValues) => {
        setIsSaving(true);
        await onSave(data);
        setIsSaving(false);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Your Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl><Input {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="gameId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Game ID</FormLabel>
                                <FormControl><Input {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="teamName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Team Name</FormLabel>
                                <FormControl><Input {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl><Input type="tel" {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl><Textarea placeholder="Tell us about yourself" {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="preferredGame"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Preferred Game</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                                >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="PUBG" /></FormControl>
                                    <FormLabel className="font-normal">PUBG</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="Free Fire" /></FormControl>
                                    <FormLabel className="font-normal">Free Fire</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="Both" /></FormControl>
                                    <FormLabel className="font-normal">Both</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                    <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save changes
                      </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
        </Dialog>
    );
}
