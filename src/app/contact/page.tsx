
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const inquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

const faqs = [
    {
        question: "How do I join a tournament on BattleStacks?",
        answer: "To join a tournament, first, create an account and log in. Then, browse the \"Tournaments\" page, select a match you want to join, and click \"Register.\" You'll be prompted to pay the entry fee via UPI. Once payment is confirmed by our team, your slot is secured."
    },
    {
        question: "What payment methods are supported for entry fees?",
        answer: "We currently support payments via UPI. You can use any UPI-enabled app (like Google Pay, PhonePe, Paytm, etc.) to scan the QR code provided on the registration page and pay the entry fee. Make sure to enter the correct transaction ID in the registration form."
    },
    {
        question: "How can I withdraw my winnings?",
        answer: "Your winnings are automatically credited to your BattleStacks wallet after the tournament results are verified. You can go to your \"Wallet\" page, click on \"Redeem Winnings,\" and enter the amount you wish to withdraw. The funds will be transferred to your registered UPI ID/bank account within 24-48 hours."
    },
    {
        question: "I didn’t receive my prize. What should I do?",
        answer: "Prize distribution is typically completed within a few hours after a tournament ends. If you haven't received your winnings in your BattleStacks wallet after 24 hours, please contact us immediately via the contact form on this page or email us at teambattlestacks@gmail.com with your username and the tournament details."
    },
    {
        question: "How do I report a cheating player or team?",
        answer: "We have a zero-tolerance policy for cheating. If you suspect a player is cheating, please provide video evidence (e.g., a screen recording) and send it to our support email at teambattlestacks@gmail.com along with the match details and the cheater's username. Our team will investigate thoroughly."
    },
    {
        question: "Can I cancel my tournament registration and get a refund?",
        answer: "As per our policy, entry fees are non-refundable once your slot is confirmed. Refunds are only issued if a tournament is canceled by BattleStacks. Please read our full Refund Policy for more details."
    },
    {
        question: "How are match results submitted and verified?",
        answer: "Match results are automatically tracked by our system. For certain custom matches, team leaders may be required to submit a screenshot of the final scoreboard in a designated Discord channel or WhatsApp group. Our admin team verifies all results before updating the leaderboard and distributing prizes."
    },
    {
        question: "What to do if my teammate gets disconnected during a match?",
        answer: "Unfortunately, we cannot control player-side technical issues like disconnections. The match will continue as planned. We recommend ensuring all team members have a stable internet connection before the match begins."
    },
    {
        question: "Is there a support number or WhatsApp group I can join?",
        answer: "Yes, you can reach us at our support number +91 9321738137. For most tournaments, a temporary WhatsApp group link is provided along with the room ID and password to coordinate and for quick support during the match."
    },
    {
        question: "When are the results and leaderboard updated after a match?",
        answer: "Our team works quickly to verify the results. Typically, the tournament bracket, final results, and the main leaderboard are updated within 1-2 hours after the final match of a tournament concludes."
    }
];

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
                                                <a href="mailto:teambattlestacks@gmail.com" className="text-muted-foreground hover:text-primary break-all">teambattlestacks@gmail.com</a>
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

                    <section className="mt-16 md:mt-24">
                        <div className="text-center mb-12">
                            <h2 className="font-headline text-3xl md:text-4xl font-bold uppercase tracking-wider text-accent text-shadow-accent">
                            Frequently Asked Questions
                            </h2>
                        </div>
                        <Card className="bg-card/80 backdrop-blur-sm border-border/50 max-w-4xl mx-auto">
                            <CardContent className="p-6">
                            <Accordion type="single" collapsible className="w-full">
                                {faqs.map((faq, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger className="text-left font-bold text-foreground hover:no-underline">
                                    {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                    {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                                ))}
                            </Accordion>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
