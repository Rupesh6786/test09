
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Settings Saved",
      description: "Your changes have been saved successfully.",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Game Settings</h1>
        <p className="text-muted-foreground">Manage platform-wide configurations.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Platform Details</CardTitle>
            <CardDescription>Basic information and contact details for your platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input id="platformName" defaultValue="BattleBucks" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input id="adminEmail" type="email" defaultValue="admin@battlebucks.com" />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment Configuration</CardTitle>
            <CardDescription>Set up payment details for tournament entry fees.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input id="upiId" defaultValue="payment@battlebucks" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrCodeUrl">QR Code Image URL</Label>
              <Input id="qrCodeUrl" placeholder="https://example.com/qr.png" />
            </div>
          </CardContent>
        </Card>
        
         <Card className="mt-6">
          <CardHeader>
            <CardTitle>Default Rules</CardTitle>
            <CardDescription>Set default rules for newly created matches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Textarea
                placeholder="Enter one rule per line..."
                defaultValue={"All players must use mobile devices.\nEmulators are strictly forbidden.\nTeam-up with hackers will result in a permanent ban."}
                rows={5}
             />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Save Changes</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
