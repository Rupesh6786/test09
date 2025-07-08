
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-3xl font-headline text-primary">Terms of Service</CardTitle>
              <CardDescription>Last updated: August 20, 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">1. Introduction</h3>
                <p>Welcome to BattleBucks! These Terms of Service ("Terms") govern your use of our website and services. By accessing or using our platform, you agree to be bound by these Terms.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">2. User Accounts</h3>
                <p>To participate in tournaments, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You must be at least 18 years old to create an account. You are solely responsible for all activities under your account and must not share your account with others.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">3. Prohibited Conduct</h3>
                <p>You agree not to engage in any of the following prohibited activities: cheating, using unauthorized third-party software, harassing other players, or engaging in any activity that violates any law or regulation. Violation of these rules may result in immediate account termination and forfeiture of any winnings.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">4. Payments, Winnings, and Wallet</h3>
                <p>All entry fees are processed through our designated payment gateways. Tournament winnings are credited to your in-app BattleBucks Wallet. You can request to withdraw your wallet balance, subject to verification by our team. Withdrawals are processed manually and sent to the payment details associated with your account. There are no fees for withdrawals. Please note that BattleBucks is not a bank or financial institution, and the wallet feature is solely for managing winnings from tournaments hosted on our platform. BattleBucks is not responsible for delays or failed transactions due to incorrect payment information provided by you.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">5. Limitation of Liability</h3>
                <p>BattleBucks is not liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-accent mb-2">6. Changes to Terms</h3>
                <p>We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the service after any such changes constitutes your acceptance of the new Terms.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
