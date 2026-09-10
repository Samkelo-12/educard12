import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { PasswordField, PasswordInput, PasswordStrength, isPasswordValid } from "@/components/password-ui";
import { toast } from "sonner";

export const Route = createFileRoute("/change-password")({
  component: () => (
    <PhoneFrame>
      <AppShell>
        <ChangePasswordPage />
      </AppShell>
    </PhoneFrame>
  ),
  head: () => ({
    meta: [
      { title: "Change password | EduCard" },
      { name: "description", content: "Change your EduCard student account password." },
      { property: "og:title", content: "Change password | EduCard" },
      { property: "og:description", content: "Change your EduCard student account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ChangePasswordPage() {
  const { profile } = useAuth();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const valid =
    current.length > 0 &&
    isPasswordValid(password) &&
    confirm.length > 0 &&
    password === confirm;

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      setError("New password must be 8+ characters with an uppercase, lowercase and number");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    const email = profile?.email;
    if (!email) {
      setError("Could not verify your account. Please sign in again.");
      return;
    }
    setError("");
    setBusy(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password: current });
    if (authError) {
      setBusy(false);
      setError("Current password is incorrect");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError("Could not update your password. Please try again.");
      return;
    }

    setCurrent("");
    setPassword("");
    setConfirm("");
    toast.success("Password updated successfully");
  };

  return (
    <div className="pb-6">
      <header className="bg-gradient-card px-5 pt-12 pb-16 text-primary-foreground">
        <div className="flex items-center justify-between">
          <Link to="/privacy" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold">Change password</h1>
          <div className="w-10" />
        </div>
        <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
          <KeyRound className="h-6 w-6" />
        </div>
        <p className="mt-3 text-xs text-primary-foreground/80">
          Confirm your current password, then choose a new one.
        </p>
      </header>

      <form onSubmit={handle} className="-mt-8 mx-5 rounded-3xl bg-card shadow-card p-6 space-y-4">
        <PasswordField label="Current password">
          <PasswordInput
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              setError("");
            }}
            show={showCurrent}
            onToggle={() => setShowCurrent((s) => !s)}
          />
        </PasswordField>

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

        <PasswordField label="Confirm new password" error={error}>
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

        <Button type="submit" disabled={busy || !valid} className="w-full h-11 bg-gradient-primary shadow-soft">
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
