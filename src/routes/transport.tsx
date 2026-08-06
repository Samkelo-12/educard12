import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bus, MapPin, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/transport")({
  component: () => (
    <PhoneFrame>
      <AppShell>
        <Transport />
      </AppShell>
    </PhoneFrame>
  ),
});

type Application = {
  id: string;
  pickup_point: string;
  dropoff_point: string;
  period: string;
  reason: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
};

export default function Transport() { return <TransportInner />; }

function statusStyle(status: string) {
  switch (status) {
    case "approved":
      return { icon: CheckCircle2, tone: "bg-success/15 text-success", label: "Approved" };
    case "rejected":
      return { icon: XCircle, tone: "bg-destructive/15 text-destructive", label: "Rejected" };
    default:
      return { icon: Clock, tone: "bg-muted text-muted-foreground", label: "Pending review" };
  }
}

function TransportInner() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [period, setPeriod] = useState("1st Semester");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("transport_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);
    if (!error) setApplication((data?.[0] as Application) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setSubmitting(false);
      toast.error("Please sign in to apply.");
      return;
    }
    const { data, error } = await supabase
      .from("transport_applications")
      .insert({
        user_id: userId,
        pickup_point: pickup,
        dropoff_point: dropoff,
        period,
        reason: reason.trim() ? reason.trim() : null,
      })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit your application. Please try again.");
      return;
    }
    setApplication(data as Application);
    setShowForm(false);
    setPickup(""); setDropoff(""); setReason(""); setPeriod("1st Semester");
    toast.success("Application submitted");
  };

  const status = application ? statusStyle(application.status) : null;

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
        {loading ? (
          <div className="rounded-2xl bg-card p-8 shadow-soft flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : application && !showForm ? (
          <div className="rounded-2xl bg-card p-5 shadow-card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Your application</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted {new Date(application.created_at).toLocaleDateString()}
                </p>
              </div>
              {status && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.tone}`}>
                  <status.icon className="h-3.5 w-3.5" /> {status.label}
                </span>
              )}
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Pickup</dt>
                <dd className="text-right font-medium">{application.pickup_point}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Drop-off</dt>
                <dd className="text-right font-medium">{application.dropoff_point}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Applying for</dt>
                <dd className="text-right font-medium">{application.period}</dd>
              </div>
              {application.reason && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Reason</dt>
                  <dd className="text-right font-medium">{application.reason}</dd>
                </div>
              )}
              {application.reviewed_at && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Reviewed</dt>
                  <dd className="text-right font-medium">
                    {new Date(application.reviewed_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>

            <Button variant="outline" className="w-full h-11" onClick={() => setShowForm(true)}>
              New application
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

            <Button type="submit" disabled={submitting} className="w-full h-11 bg-gradient-primary gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bus className="h-4 w-4" />}
              Submit application
            </Button>
            {application && (
              <Button type="button" variant="ghost" className="w-full h-10" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
