import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
  head: () => ({
    meta: [
      { title: "Reset your EduCard password | WSU" },
      {
        name: "description",
        content: "Request a secure password reset link for your Walter Sisulu University EduCard student account.",
      },
      { property: "og:title", content: "Reset your EduCard password" },
      {
        property: "og:description",
        content: "Request a secure password reset link for your WSU EduCard student account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const GENERIC_MESSAGE = "If an account exists with this email, a reset link has been sent.";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Always show the same message — never reveal whether the email is registered.
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch {
      // Intentionally ignored to avoid leaking account existence.
    } finally {
      setBusy(false);
      setSent(true);
    }
  };

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <div className="bg-gradient-card px-6 pt-12 pb-16 text-primary-foreground">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary-foreground/80">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
          <h1 className="mt-6 text-3xl font-bold">Forgot password</h1>
          <p className="mt-1 text-primary-foreground/80 text-sm">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {sent ? (
          <div className="-mt-8 mx-5 rounded-3xl bg-card shadow-card p-6 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">{GENERIC_MESSAGE}</p>
            <Button asChild className="w-full h-11 bg-gradient-primary shadow-soft">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handle} className="-mt-8 mx-5 rounded-3xl bg-card shadow-card p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <Button type="submit" disabled={busy} className="w-full h-11 bg-gradient-primary shadow-soft">
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </PhoneFrame>
  );
}
