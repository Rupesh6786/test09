
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-3xl font-headline text-primary">Privacy Policy</CardTitle>
              <CardDescription>Last updated: August 20, 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">1. Information We Collect</h3>
                <p>We collect information you provide directly to us, such as when you create an account, register for a tournament, or contact us for support. This may include your name, email address, game ID, and payment information.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">2. How We Use Your Information</h3>
                <p>We use the information we collect to operate, maintain, and provide the features and functionality of the service, to communicate with you, to process transactions, and for other customer service purposes.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">3. Sharing of Your Information</h3>
                <p>We do not share your personal information with third parties except as necessary to provide our services (e.g., with payment processors) or as required by law. Your in-game username and team name may be publicly visible on leaderboards and tournament brackets.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">4. Data Security</h3>
                <p>We use reasonable administrative, technical, and physical security measures to protect your personal information. However, no security system is impenetrable, and we cannot guarantee the security of our systems 100%.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">5. Your Choices</h3>
                <p>You may update, correct, or delete your account information at any time by accessing your profile page. You may also contact us to request access to or deletion of your personal information.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">6. Changes to This Policy</h3>
                <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
