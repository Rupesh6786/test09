
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../theme-toggle';
import { cn } from '@/lib/utils';
import type { UserProfileData } from '@/lib/data';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/community', label: 'Community' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const router = useRouter();

  useEffect(() => {
    let firestoreUnsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);

      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        firestoreUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfileData);
          } else {
            setUserProfile(null);
          }
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      authUnsubscribe();
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };
  
  const getInitials = () => {
    const name = userProfile?.name;
    const email = authUser?.email;
    if (name) {
      const parts = name.split(' ').filter(Boolean);
      if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  }
  
  const photoURL = userProfile?.photoURL || authUser?.photoURL;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold tracking-wider text-primary font-headline">BattleBucks</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          {authUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={photoURL || ''} alt="User Avatar" />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.name || 'My Account'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {authUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                    <Link href="/profile">My Profile</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/wallet">My Wallet</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <Link href="/login">Login / Register</Link>
            </Button>
          )}

        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          'md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-sm shadow-md transition-all duration-300 ease-in-out origin-top',
          isMenuOpen
            ? 'transform scale-y-100 opacity-100'
            : 'transform scale-y-0 opacity-0 pointer-events-none'
        )}
      >
        <nav className="flex flex-col items-center space-y-4 py-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-lg transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {authUser ? (
            <>
              <Link
                href="/profile"
                className="text-lg transition-colors hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                My Profile
              </Link>
              <Link
                href="/wallet"
                className="text-lg transition-colors hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                My Wallet
              </Link>
              <Button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                variant="outline"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Log Out
              </Button>
            </>
          ) : (
            <Button
              asChild
              variant="outline"
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              <Link href="/login">Login / Register</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
