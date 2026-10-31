import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Fingerprint, GraduationCap, Mail, Lock } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-store";
import { biometricSignIn, getStoredCredential } from "@/lib/biometric";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  useEffect(() => {
    void getStoredCredential().then((cred) => setHasBiometric(Boolean(cred)));
  }, []);

  const handleBiometric = async () => {
    setBiometricBusy(true);
    try {
      await biometricSignIn();
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBiometricBusy(false);
    }
  };


  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <div className="bg-gradient-card px-6 pt-12 pb-16 text-primary-foreground">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <GraduationCap className="h-7 w-7" />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.25em] text-primary-foreground/70 font-semibold">EduCard</p>
          <h1 className="mt-1 text-3xl font-bold">Welcome back</h1>
          <p className="mt-1 text-primary-foreground/80 text-sm">Sign in to access your WSU student card</p>
        </div>

        <form onSubmit={handle} className="-mt-8 mx-5 rounded-3xl bg-card shadow-card p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email or student number</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={show ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11" />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="pt-1 text-right">
              <Link to="/forgot-password" className="text-sm font-semibold text-primary">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 bg-gradient-primary shadow-soft">
            Sign in
          </Button>

          {hasBiometric && (
            <>
              <div className="flex items-center gap-3 py-2">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={biometricBusy}
                className="w-full h-11 gap-2"
                onClick={() => void handleBiometric()}
              >
                <Fingerprint className="h-5 w-5 text-primary" />
                {biometricBusy ? "Verifying…" : "Use biometric login"}
              </Button>
            </>
          )}
        </form>


        <div className="mt-auto px-6 py-8 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-primary">
            Create an account
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
