
import Link from 'next/link';
import { Youtube, Twitter, Instagram, Facebook, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border/40">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 text-center md:flex-row md:justify-between md:text-left">
          <div className="md:max-w-xs">
            <h3 className="font-headline text-lg font-bold text-primary">About BattleBucks</h3>
            <p className="mt-2 text-muted-foreground text-sm">
              The premier platform for competitive mobile gamers. Win real money, prove your skills, and become a legend.
            </p>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-primary">Quick Links</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link href="/tournaments" className="text-muted-foreground hover:text-primary">Tournaments</Link></li>
              <li><Link href="/leaderboard" className="text-muted-foreground hover:text-primary">Leaderboard</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-primary">About</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-primary">Legal</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary">Terms</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy</Link></li>
              <li><Link href="/refund" className="text-muted-foreground hover:text-primary">Refund</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-primary">Connect With Us</h3>
            <div className="flex justify-center md:justify-start items-center space-x-4 mt-2">
                <Link href="https://x.com/ARCubers?s=09" target="_blank" rel="noopener noreferrer"><Twitter className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                <Link href="https://www.instagram.com/rupesh.devp/" target="_blank" rel="noopener noreferrer"><Instagram className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                <Link href="https://www.facebook.com/share/1FcLATe9kX/" target="_blank" rel="noopener noreferrer"><Facebook className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                <Link href="#" target="_blank" rel="noopener noreferrer"><Youtube className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border/40 text-center text-muted-foreground text-sm">
          <p>{`© ${new Date().getFullYear()} BattleBucks. All rights reserved.`}</p>
        </div>
      </div>
    </footer>
  );
}
