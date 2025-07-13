

"use client";

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, getDoc, doc, query, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Loader2, PlusCircle, Edit, Send, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tournament, UserRegistration, EmailTemplate } from '@/lib/data';
import { MultiSelect } from '@/components/ui/multi-select';
import { TemplateEditorDialog } from '@/components/template-editor-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AutomationPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    // Data state
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [registrations, setRegistrations] = useState<UserRegistration[]>([]);

    // Form state
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
    const [selectedTeamNames, setSelectedTeamNames] = useState<string[]>([]);
    const [customId, setCustomId] = useState('');
    const [password, setPassword] = useState('');

    // Dialog state
    const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

    const fetchData = async () => {
        // This is now just a wrapper for the listeners
        // Listeners are set up in useEffect below
    };

    useEffect(() => {
        setIsLoading(true);
        const unsubscribes: Unsubscribe[] = [];

        const templatesQuery = query(collection(db, "templates"), orderBy("createdAt", "desc"));
        unsubscribes.push(onSnapshot(templatesQuery, (snapshot) => {
            setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EmailTemplate[]);
        }));

        const tournamentsQuery = query(collection(db, "tournaments"), orderBy("date", "desc"));
        unsubscribes.push(onSnapshot(tournamentsQuery, (snapshot) => {
            setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tournament[]);
        }));

        const registrationsQuery = collection(db, 'registrations');
        unsubscribes.push(onSnapshot(registrationsQuery, (snapshot) => {
            setRegistrations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserRegistration[]);
        }));

        setIsLoading(false);

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, []);

    const selectedTemplate = useMemo(() => templates.find(t => t.id === selectedTemplateId), [templates, selectedTemplateId]);
    const selectedTournament = useMemo(() => tournaments.find(t => t.id === selectedTournamentId), [tournaments, selectedTournamentId]);

    const availableTeams = useMemo(() => {
        if (!selectedTournament) return [];
        const teams = registrations
            .filter(r => r.tournamentId === selectedTournament.id)
            .map(r => r.teamName);
        return [...new Set(teams)].map(teamName => ({ value: teamName, label: teamName }));
    }, [registrations, selectedTournament]);

    useEffect(() => {
        setSelectedTeamNames([]);
    }, [selectedTournamentId]);

    const handleCreateNewTemplate = () => {
        setEditingTemplate(null);
        setIsTemplateEditorOpen(true);
    };

    const handleEditTemplate = () => {
        if (selectedTemplate) {
            setEditingTemplate(selectedTemplate);
            setIsTemplateEditorOpen(true);
        } else {
            toast({ title: "No Template Selected", description: "Please select a template to edit.", variant: "destructive" });
        }
    };
    
    const handleSendEmails = async () => {
        if (!selectedTemplate || !selectedTournament || selectedTeamNames.length === 0) {
            toast({ title: "Missing Information", description: "Please select a template, tournament, and at least one team.", variant: "destructive" });
            return;
        }
        
        setIsSending(true);
        toast({
            title: "Preparing Emails...",
            description: "Your browser may ask you to allow pop-ups for this site.",
        });

        for (const teamName of selectedTeamNames) {
            const reg = registrations.find(r => r.tournamentId === selectedTournament.id && r.teamName === teamName);
            if (!reg) {
                console.warn(`Could not find registration for team: ${teamName}`);
                continue;
            }

            const userSnap = await getDoc(doc(db, 'users', reg.userId));
            const userName = userSnap.exists() ? userSnap.data().name : reg.userEmail;

            let subject = selectedTemplate.subject.replace(/\[Team Name\]/gi, teamName);
            let body = selectedTemplate.body
                .replace(/\[Team Name\]/gi, teamName)
                .replace(/\[Team Member Name\]/gi, userName)
                .replace(/\[Tournament Name\]/gi, selectedTournament.title)
                .replace(/\[Date\]/gi, selectedTournament.startDate || selectedTournament.date)
                .replace(/\[Time\]/gi, selectedTournament.time)
                .replace(/\[Custom Tournament ID\]/gi, customId)
                .replace(/\[Password\]/gi, password);

            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${reg.userEmail}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(gmailUrl, '_blank');

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        setIsSending(false);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <>
            <TemplateEditorDialog
                isOpen={isTemplateEditorOpen}
                setIsOpen={setIsTemplateEditorOpen}
                template={editingTemplate}
                onSave={fetchData}
            />
            <div className="space-y-8">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">Email Automation</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>1. Select Template</CardTitle>
                        <CardDescription>Choose an email template to send, or create a new one.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <SelectTrigger className="flex-grow"><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                            <SelectContent>
                                {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2 w-full sm:w-auto">
                           <Button variant="outline" onClick={handleEditTemplate} className="w-1/2 sm:w-auto" disabled={!selectedTemplateId}>
                                <Edit />Edit
                            </Button>
                            <Button onClick={handleCreateNewTemplate} className="w-1/2 sm:w-auto">
                                <PlusCircle />Create New
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {selectedTemplate && (
                     <Card>
                        <CardHeader>
                            <CardTitle>2. Fill Details & Select Recipients</CardTitle>
                            <CardDescription>Provide the match details and choose which teams will receive the email.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Tournament</Label>
                                    <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
                                        <SelectTrigger><SelectValue placeholder="Select a tournament..." /></SelectTrigger>
                                        <SelectContent>
                                            {tournaments.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div>
                                    <Label>Teams</Label>
                                    <MultiSelect
                                        options={availableTeams}
                                        selected={selectedTeamNames}
                                        onChange={setSelectedTeamNames}
                                        placeholder="Select teams..."
                                        disabled={!selectedTournamentId}
                                    />
                                </div>
                                 <div>
                                    <Label htmlFor="custom-id">Custom Tournament ID</Label>
                                    <Input id="custom-id" value={customId} onChange={(e) => setCustomId(e.target.value)} placeholder="e.g., BB-101" />
                                </div>
                                 <div>
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="e.g., YourSecurePwd@123" />
                                </div>
                            </div>
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Preview & Send</AlertTitle>
                                <AlertDescription>
                                   Clicking "Send" will open a pre-filled Gmail window for each selected team. Make sure your browser allows pop-ups.
                                </AlertDescription>
                            </Alert>
                             <Button onClick={handleSendEmails} disabled={isSending || !selectedTournamentId || selectedTeamNames.length === 0} className="w-full">
                                {isSending ? <Loader2 className="animate-spin"/> : <Send/>}
                                Send Email(s)
                            </Button>
                        </CardContent>
                     </Card>
                )}
            </div>
        </>
    );
}
