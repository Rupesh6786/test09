import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { UserProfile } from '@/components/user-profile';

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4">
            <UserProfile />
        </div>
      </main>
      <Footer />
    </div>
  );
}
