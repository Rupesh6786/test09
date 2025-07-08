"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { UserProfileData } from '@/lib/data';

interface RedeemDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    currentBalance: number;
    userProfile: UserProfileData;
    onSuccess: () => void;
}

export function RedeemDialog({ isOpen, setIsOpen, currentBalance, userProfile, onSuccess }: RedeemDialogProps) {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const redeemSchema = z.object({
        amount: z.coerce.number()
            .positive('Amount must be positive.')
            .max(currentBalance, `You cannot redeem more than your available balance of ₹${currentBalance}.`),
        phoneNumber: z.string().min(10, 'Please enter a valid 10-digit phone number.').max(10, 'Please enter a valid 10-digit phone number.'),
    });

    type RedeemFormValues = z.infer<typeof redeemSchema>;

    const form = useForm<RedeemFormValues>({
        resolver: zodResolver(redeemSchema),
        defaultValues: { amount: currentBalance, phoneNumber: userProfile.phoneNumber || '' },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({ amount: currentBalance, phoneNumber: userProfile.phoneNumber || '' });
        }
    }, [isOpen, currentBalance, userProfile, form]);

    const onSubmit = async (data: RedeemFormValues) => {
        if (!userProfile) return;
        setIsSaving(true);
        try {
            await addDoc(collection(db, "redeemRequests"), {
                userId: userProfile.uid,
                userName: userProfile.name,
                userEmail: userProfile.email,
                amount: data.amount,
                phoneNumber: data.phoneNumber,
                upiId: 'user-upi-id@okbank', // This is a placeholder
                status: 'Pending',
                requestedAt: serverTimestamp(),
            });
            setIsOpen(false);
            onSuccess();
        } catch (error) {
            console.error("Failed to submit redeem request:", error);
            toast({ title: "Error", description: "Could not submit your request. Please try again.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Redeem Winnings</DialogTitle>
              <DialogDescription>
                Withdraw your earnings. The request will be processed by our team within 24 hours.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount to Redeem (Max: ₹{currentBalance})</FormLabel>
                                <FormControl><Input type="number" {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number (for verification)</FormLabel>
                                <FormControl><Input type="tel" placeholder="10-digit mobile number" {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Request
                      </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
        </Dialog>
    );
}
