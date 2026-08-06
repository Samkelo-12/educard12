import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Bus, MapPin, CheckCircle2 } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/transport")({
  component: () => (
    <PhoneFrame>
      <AppShell>
        <Transport />
      </AppShell>
    </PhoneFrame>
  ),
});

export default function Transport() { return <TransportInner />; }

function TransportInner() {
  
  const [applied, setApplied] = useState(false);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [period, setPeriod] = useState("1st Semester");
  const [reason, setReason] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied(true);
    toast.success("Application submitted");
  };

  return (
    <div className="pb-6">
      <header className="bg-gradient-card px-5 pt-12 pb-8 text-primary-foreground">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold">Transport</h1>
          <div className="w-10" />
        </div>
        <div className="mt-5">
          <p className="text-xs text-primary-foreground/80">Travel pass balance</p>
          <p className="text-3xl font-bold mt-1">12 trips</p>
          <p className="text-xs text-primary-foreground/70 mt-1">Renews on 30 Nov</p>
        </div>
      </header>

      <div className="px-5 mt-5 space-y-4">
        {applied ? (
          <div className="rounded-3xl bg-card p-8 shadow-card text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold">Application submitted</h2>
            <p className="text-sm text-muted-foreground">
              Your transport application is under review. You'll get a notification once it's approved.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => { setApplied(false); }}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl bg-card p-5 shadow-soft space-y-4">
            <div>
              <h2 className="font-semibold">Apply for transport</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Subsidised travel for registered students.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Pickup point (Residence)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input required value={pickup} onChange={(e) => setPickup(e.target.value)}
                  className="pl-10 h-11" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Drop-off point (Campus)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input required value={dropoff} onChange={(e) => setDropoff(e.target.value)}
                  className="pl-10 h-11" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Applying for</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Semester">1st Semester</SelectItem>
                  <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                  <SelectItem value="Full Year">Full Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Reason (optional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)}
                className="h-11" />
            </div>


            <Button type="submit" className="w-full h-11 bg-gradient-primary gap-2">
              <Bus className="h-4 w-4" /> Submit application
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
