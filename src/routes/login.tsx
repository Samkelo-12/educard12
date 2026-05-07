import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Fingerprint, GraduationCap, Mail, Lock } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn, notifyAuth } from "@/lib/auth-store";
import { toast } from "sonner";

const REMEMBER_KEY = "dsc.remember";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  // Prefill saved credentials on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || "null");
      if (saved?.email) {
        setEmail(saved.email);
        if (saved.password) setPassword(saved.password);
        setRemember(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      signIn(email, password);
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      notifyAuth();
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
          <h1 className="mt-6 text-3xl font-bold">Welcome back</h1>
          <p className="mt-1 text-primary-foreground/80 text-sm">Sign in to access your student card</p>
        </div>

        <form onSubmit={handle} className="-mt-8 mx-5 rounded-3xl bg-card shadow-card p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email or student number</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="you@university.edu" className="pl-10 h-11" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={show ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••" className="pl-10 pr-10 h-11" />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
            Remember me on this device
          </label>

          <Button type="submit" className="w-full h-11 bg-gradient-primary shadow-soft">
            Sign in
          </Button>

          <div className="flex items-center gap-3 py-2">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full h-11 gap-2"
            onClick={() => toast.info("Biometric login coming soon")}>
            <Fingerprint className="h-5 w-5 text-primary" />
            Use biometric login
          </Button>
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
