
"use client";

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { Loader2, Mail, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

const inquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

export default function ContactPage() {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<InquiryFormValues>({
        resolver: zodResolver(inquirySchema),
        defaultValues: {
            name: '',
            email: '',
            message: '',
        }
    });

    const onSubmit: SubmitHandler<InquiryFormValues> = async (data) => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "inquiries"), {
                ...data,
                submittedAt: serverTimestamp(),
                status: 'New',
            });
            router.push('/contact/success');

        } catch (error) {
            console.error("Failed to send inquiry:", error);
            toast({
                title: "Submission Failed",
                description: "Could not send your message. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 py-16 md:py-24">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-12">
                        <h1 className="font-headline text-4xl md:text-5xl font-bold uppercase tracking-wider text-primary text-shadow-primary">
                            Contact Us
                        </h1>
                        <p className="text-lg text-muted-foreground mt-2">Have questions? We'd love to hear from you.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:items-stretch">
                        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                             <CardContent className="p-8">
                                <h2 className="text-2xl font-bold text-accent mb-6">Other Ways to Reach Us</h2>
                                <p className="text-muted-foreground mb-6">
                                    For immediate assistance or partnership opportunities, feel free to reach out through the following channels.
                                </p>
                                <div className="space-y-4">
                                    <Card className="bg-card/90 backdrop-blur-sm">
                                        <CardContent className="p-6 flex items-center gap-4">
                                            <div className="p-3 bg-primary/20 rounded-full flex items-center justify-center">
                                                <Mail className="w-6 h-6 text-primary"/>
                                            </div>
                                            <div>
                                                <h3 className="font-bold">Email Us</h3>
                                                <a href="mailto:teambattlebucks@gmail.com" className="text-muted-foreground hover:text-primary break-all">teambattlebucks@gmail.com</a>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-card/90 backdrop-blur-sm">
                                        <CardContent className="p-6 flex items-center gap-4">
                                             <div className="p-3 bg-primary/20 rounded-full flex items-center justify-center">
                                                <Phone className="w-6 h-6 text-primary"/>
                                            </div>
                                            <div>
                                                <h3 className="font-bold">Call Us</h3>
                                                <a href="tel:+919321738137" className="text-muted-foreground hover:text-primary">+91 9321738137</a>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold mb-6 text-accent">Send a Message</h2>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Your Name</FormLabel>
                                                    <FormControl><Input placeholder="John Doe" {...field} disabled={isSubmitting} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Your Email</FormLabel>
                                                    <FormControl><Input type="email" placeholder="you@example.com" {...field} disabled={isSubmitting} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="message"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Your Message</FormLabel>
                                                    <FormControl><Textarea rows={5} placeholder="How can we help you?" {...field} disabled={isSubmitting} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Submit Inquiry
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
