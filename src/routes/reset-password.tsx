import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PasswordField, PasswordInput, PasswordStrength, isPasswordValid } from "@/components/password-ui";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  head: () => ({
    meta: [
      { title: "Set a new EduCard password | WSU" },
      {
        name: "description",
        content: "Choose a new password for your Walter Sisulu University EduCard student account.",
      },
      { property: "og:title", content: "Set a new EduCard password" },
      { property: "og:description", content: "Choose a new password for your WSU EduCard student account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkValid, setLinkValid] = useState(true);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const hash = window.location.hash;
      const isRecovery = hash.includes("type=recovery");
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setLinkValid(isRecovery || !!data.session);
      setReady(true);
    };
    void check();
    return () => {
      active = false;
    };
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      setError("Password must be 8+ characters with an uppercase, lowercase and number");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      toast.error("Could not update your password. Request a new reset link and try again.");
      return;
    }
    await supabase.auth.signOut();
    toast.success("Password updated. Please sign in with your new password.");
    navigate({ to: "/login" });
  };

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <div className="bg-gradient-card px-6 pt-12 pb-16 text-primary-foreground">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary-foreground/80">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
          <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">New password</h1>
          <p className="mt-1 text-primary-foreground/80 text-sm">Choose a strong password for your account</p>
        </div>

        {ready && !linkValid ? (
          <div className="-mt-8 mx-5 rounded-3xl bg-card shadow-card p-6 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              This reset link is invalid or has expired. Please request a new one.
            </p>
            <Button asChild className="w-full h-11 bg-gradient-primary shadow-soft">
              <Link to="/forgot-password">Request new link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handle} className="-mt-8 mx-5 rounded-3xl bg-card shadow-card p-6 space-y-4">
            <PasswordField label="New password">
              <PasswordInput
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                show={showPassword}
                onToggle={() => setShowPassword((s) => !s)}
              />
              <PasswordStrength password={password} />
            </PasswordField>

            <PasswordField label="Confirm password" error={error}>
              <PasswordInput
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError("");
                }}
                show={showConfirm}
                onToggle={() => setShowConfirm((s) => !s)}
                invalid={!!error}
              />
            </PasswordField>

            <Button type="submit" disabled={busy} className="w-full h-11 bg-gradient-primary shadow-soft">
              {busy ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </PhoneFrame>
  );
}
