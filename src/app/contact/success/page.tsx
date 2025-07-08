
"use client";

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function InquirySuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border/50 text-center">
            <CardHeader className="items-center">
              <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
              <CardTitle className="text-3xl font-headline text-primary">Inquiry Sent!</CardTitle>
              <CardDescription className="text-lg text-muted-foreground pt-2">
                Thank you for contacting us. Your message has been received.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Our team will review your inquiry and get back to you as soon as possible.
              </p>
              <Button asChild size="lg">
                <Link href="/">Return to Homepage</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
