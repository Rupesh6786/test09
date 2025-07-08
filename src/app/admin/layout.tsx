
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { Loader2, LayoutDashboard, Users, Trophy, DollarSign, Award, Settings, LogOut, ClipboardList, MessageSquare, Menu } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

const ADMIN_UID = 'ymwd0rW1wnNZkYlUR7cUi9dkd452';

function AdminSidebar({ onLogout }: { onLogout: () => Promise<void> }) {
    const { setOpenMobile } = useSidebar();
    const pathname = usePathname();

    const handleLinkClick = () => {
        setOpenMobile(false);
    };

    const handleLogoutClick = async () => {
        await onLogout();
        setOpenMobile(false);
    }
    
    return (
        <Sidebar>
            <SidebarHeader>
                <h2 className="text-xl font-bold text-primary px-4">BattleBucks</h2>
            </SidebarHeader>
            <SidebarMenu className="flex-1 overflow-y-auto">
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/dashboard'}>
                        <Link href="/admin/dashboard" onClick={handleLinkClick}><LayoutDashboard /><span>Dashboard</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/users'}>
                        <Link href="/admin/users" onClick={handleLinkClick}><Users /><span>Players</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/matches')}>
                        <Link href="/admin/matches/create" onClick={handleLinkClick}><Trophy /><span>Tournaments</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/registrations'}>
                        <Link href="/admin/registrations" onClick={handleLinkClick}><ClipboardList /><span>Registrations</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/inquiries'}>
                        <Link href="/admin/inquiries" onClick={handleLinkClick}><MessageSquare /><span>Inquiries</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/revenue'}>
                        <Link href="/admin/revenue" onClick={handleLinkClick}><DollarSign /><span>Revenue</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/leaderboard'}>
                        <Link href="/admin/leaderboard" onClick={handleLinkClick}><Award /><span>Winners</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin/settings'}>
                        <Link href="/admin/settings" onClick={handleLinkClick}><Settings /><span>Settings</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            <SidebarFooter>
                <SidebarMenu>
                        <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogoutClick}><LogOut /><span>Logout</span></SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [authUser, setAuthUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.uid === ADMIN_UID) {
                setAuthUser(user);
            } else {
                router.replace('/admin/login');
            }
            setIsAuthLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };

    if (isAuthLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!authUser) {
        return null; // Redirect is handled by useEffect
    }

    return (
        <SidebarProvider>
            <AdminSidebar onLogout={handleLogout} />
            <div className="flex flex-1 flex-col">
                <header className="flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="md:hidden"><Menu className="h-6 w-6" /></SidebarTrigger>
                        <h1 className="text-lg font-bold text-primary">Admin Panel</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground hidden md:inline">Welcome, Admin!</span>
                        <ThemeToggle />
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-8 overflow-auto bg-muted/40">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
