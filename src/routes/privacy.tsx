import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Eye, Fingerprint, KeyRound, ShieldCheck, ChevronRight, ArrowLeft } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { usePreferences, resetPreferencesCache } from "@/lib/preferences";
import { deleteMyAccount } from "@/lib/account.functions";
import { signOut } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";

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
  const { prefs, ready, update } = usePreferences();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sessionSince, setSessionSince] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const at = data.session?.user.last_sign_in_at;
      if (at) {
        setSessionSince(
          new Date(at).toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      }
    });
  }, []);

  const set = async (patch: Parameters<typeof update>[0]) => {
    setSaving(true);
    try {
      await update(patch);
      toast.success("Setting saved");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount();
      resetPreferencesCache();
      await signOut();
      toast.success("Your account and data have been deleted");
      navigate({ to: "/login" });
    } catch {
      toast.error("Could not delete your account. Please try again.");
      setDeleting(false);
    }
  };

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
          <ToggleRow
            icon={Fingerprint}
            label="Biometric unlock"
            description="Available in a future release"
            value={false}
            disabled
            badge="Coming soon"
            onChange={() => {}}
          />
          <ToggleRow
            icon={Eye}
            label="Hide card details until tapped"
            description="Blurs your card preview on the home screen"
            value={prefs.hideCard}
            disabled={!ready || saving}
            onChange={(v) => void set({ hideCard: v })}
          />
          <ToggleRow
            icon={ShieldCheck}
            label="Anonymous analytics"
            description="Allow anonymous usage data to improve the app"
            value={prefs.analyticsOptIn}
            disabled={!ready || saving}
            onChange={(v) => void set({ analyticsOptIn: v })}
          />
        </section>

        <section className="rounded-2xl bg-card shadow-soft divide-y divide-border">
          <Link to="/change-password" className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
            <KeyRound className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm font-medium">Change password</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Lock className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">This device</p>
              <p className="text-[11px] text-muted-foreground">
                {sessionSince ? `Signed in ${sessionSince}` : "Signed in"}
              </p>
            </div>
            <button
              className="text-xs font-semibold text-destructive"
              onClick={() => {
                void signOut().then(() => {
                  resetPreferencesCache();
                  navigate({ to: "/login" });
                });
              }}
            >
              Sign out
            </button>
          </div>
        </section>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={deleting}
              className="w-full h-12 gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes your student card details, transport applications and
                notifications. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => void handleDelete()}
              >
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
          We protect your data in line with WSU privacy policy and POPIA.
        </p>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  value,
  onChange,
  disabled,
  badge,
}: {
  icon: typeof Lock;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${badge ? "opacity-60" : ""}`}>
      <Icon className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{label}</p>
          {badge && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
