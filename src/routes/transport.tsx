import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Bus, MapPin, Clock, CreditCard, CheckCircle2 } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const ROUTES = [
  { id: "A", name: "Main Campus → Residence", time: "Every 15 min", next: "in 4 min" },
  { id: "B", name: "Residence → Library", time: "Every 20 min", next: "in 11 min" },
  { id: "C", name: "Campus Loop", time: "Every 10 min", next: "in 2 min" },
];

export default function Transport() { return <TransportInner />; }

function TransportInner() {
  const [tab, setTab] = useState<"access" | "apply">("access");
  const [applied, setApplied] = useState(false);
  const [route, setRoute] = useState(ROUTES[0].id);
  const [pickup, setPickup] = useState("");
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

      <div className="px-5 -mt-4">
        <div className="rounded-2xl bg-card p-1 shadow-soft grid grid-cols-2 text-sm font-medium">
          {(["access", "apply"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 rounded-xl transition-colors ${
                tab === t ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              {t === "access" ? "Access" : "Apply"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {tab === "access" ? (
          <>
            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-accent text-accent-foreground">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Tap to ride</p>
                  <p className="text-xs text-muted-foreground">Use your Campus ID at the bus reader</p>
                </div>
              </div>
            </div>

            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Live routes</h2>
            <div className="space-y-3">
              {ROUTES.map((r) => (
                <div key={r.id} className="rounded-2xl bg-card p-4 shadow-soft flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                    {r.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{r.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.time}</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-success">{r.next}</span>
                </div>
              ))}
            </div>
          </>
        ) : applied ? (
          <div className="rounded-3xl bg-card p-8 shadow-card text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold">Application submitted</h2>
            <p className="text-sm text-muted-foreground">
              Your transport application is under review. You'll get a notification once it's approved.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => { setApplied(false); setTab("access"); }}>
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
              <Label className="text-xs">Preferred route</Label>
              <div className="grid grid-cols-3 gap-2">
                {ROUTES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoute(r.id)}
                    className={`rounded-xl border-2 p-2.5 text-xs font-semibold transition-colors ${
                      route === r.id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    Route {r.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Pickup location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input required value={pickup} onChange={(e) => setPickup(e.target.value)}
                  placeholder="e.g. Block C Residence" className="pl-10 h-11" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Reason (optional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Daily commute" className="h-11" />
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
