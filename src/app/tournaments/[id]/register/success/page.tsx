
"use client";

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function RegistrationSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border/50 text-center">
            <CardHeader className="items-center">
              <CheckCircle className="w-16 h-16 text-primary mb-4" />
              <CardTitle className="text-3xl font-headline text-primary">Registration Submitted!</CardTitle>
              <CardDescription className="text-lg text-muted-foreground pt-2">
                Your registration has been received. Please wait for payment confirmation from our team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                You will be notified once your payment is confirmed and your slot is secured. You can check the status of all your registrations on your profile page.
              </p>
              <Button asChild size="lg">
                <Link href="/profile">View My Registrations</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
