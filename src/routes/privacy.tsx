import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock, Eye, Fingerprint, KeyRound, ShieldCheck, ChevronRight } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/privacy")({
  component: () => (
    <PhoneFrame>
      <AppShell>
        <PrivacyPage />
      </AppShell>
    </PhoneFrame>
  ),
});

function PrivacyPage() {
  const [biometrics, setBiometrics] = useState(true);
  const [hideCard, setHideCard] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  return (
    <div className="pb-6">
      <header className="bg-gradient-card px-5 pt-12 pb-16 text-primary-foreground">
        <div className="flex items-center justify-between">
          <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold">Privacy & security</h1>
          <div className="w-10" />
        </div>
        <p className="mt-4 text-xs text-primary-foreground/80">Control who can access your student card and data.</p>
      </header>

      <div className="-mt-10 px-5 space-y-5">
        <section className="rounded-2xl bg-card shadow-soft divide-y divide-border">
          <ToggleRow icon={Fingerprint} label="Biometric unlock" description="Use fingerprint or Face ID" value={biometrics} onChange={setBiometrics} />
          <ToggleRow icon={Eye} label="Hide card on lock screen" description="Blur card preview when locked" value={hideCard} onChange={setHideCard} />
          <ToggleRow icon={ShieldCheck} label="Anonymous analytics" description="Help improve the app" value={analytics} onChange={setAnalytics} />
        </section>

        <section className="rounded-2xl bg-card shadow-soft divide-y divide-border">
          <LinkRow icon={KeyRound} label="Change password" onClick={() => toast("Password reset link sent to your email")} />
          <LinkRow icon={Lock} label="Active sessions" value="2 devices" onClick={() => toast("You are signed in on 2 devices")} />
        </section>

        <Button
          variant="outline"
          className="w-full h-12 gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => toast.success("Account deletion request submitted")}
        >
          Delete my account
        </Button>

        <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
          We protect your data in line with WSU privacy policy and POPIA.
        </p>
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, description, value, onChange }: { icon: typeof Lock; label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function LinkRow({ icon: Icon, label, value, onClick }: { icon: typeof Lock; label: string; value?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
      <Icon className="h-5 w-5 text-primary" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value && <span className="text-xs text-muted-foreground">{value}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
