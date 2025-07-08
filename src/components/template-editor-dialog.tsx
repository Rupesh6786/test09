
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { EmailTemplate } from '@/lib/data';
import { Badge } from './ui/badge';

const templateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters.'),
  subject: z.string().min(5, 'Subject must be at least 5 characters.'),
  body: z.string().min(20, 'Body must be at least 20 characters.'),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateEditorDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  template: EmailTemplate | null;
  onSave: () => void;
}

const placeholders = [
    '[Team Name]', '[Team Member Name]', '[Tournament Name]', '[Date]', '[Time]', '[Custom Tournament ID]', '[Password]'
];

export function TemplateEditorDialog({ isOpen, setIsOpen, template, onSave }: TemplateEditorDialogProps) {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const form = useForm<TemplateFormValues>({
        resolver: zodResolver(templateSchema),
    });

    useEffect(() => {
        if (template) {
            form.reset({ name: template.name, subject: template.subject, body: template.body });
        } else {
            form.reset({ name: '', subject: '', body: '' });
        }
    }, [template, form, isOpen]);

    const onSubmit = async (data: TemplateFormValues) => {
        setIsSaving(true);
        try {
            if (template) {
                // Editing existing template
                const templateRef = doc(db, 'templates', template.id);
                await updateDoc(templateRef, data);
                toast({ title: "Success", description: "Template updated successfully." });
            } else {
                // Creating new template
                await addDoc(collection(db, "templates"), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "New template created." });
            }
            onSave();
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to save template:", error);
            toast({ title: "Error", description: "Could not save template. Please try again.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{template ? 'Edit Template' : 'Create New Template'}</DialogTitle>
              <DialogDescription>
                Design an email template. Use the placeholders below to auto-fill details.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Template Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Match Credentials" {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Subject</FormLabel>
                                <FormControl><Input placeholder="e.g., 🏆 Your Details for [Tournament Name]" {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="body"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Body</FormLabel>
                                <FormControl><Textarea rows={10} placeholder="Dear [Team Member Name]..." {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div>
                        <FormLabel>Available Placeholders</FormLabel>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {placeholders.map(p => <Badge key={p} variant="secondary" className="font-mono">{p}</Badge>)}
                        </div>
                    </div>

                    <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Template
                      </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
        </Dialog>
    );
}
