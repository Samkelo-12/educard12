import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, notifyAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    studentNumber: "",
    email: "",
    password: "",
    course: "",
    faculty: "",
    campus: "",
    year: "Buffalo City Campus",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      signUp(form);
      notifyAuth();
      toast.success("Account created — your card is ready!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col bg-background">
        <header className="bg-gradient-card px-6 pt-12 pb-10 text-primary-foreground">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary-foreground/85">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Create account</h1>
              <p className="text-xs text-primary-foreground/80">Step {step} of 2</p>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <span className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-white" : "bg-white/30"}`} />
            <span className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-white" : "bg-white/30"}`} />
          </div>
        </header>

        <form onSubmit={submit} className="-mt-6 mx-5 rounded-3xl bg-card shadow-card p-6 space-y-4">
          {step === 1 ? (
            <>
              <Field label="Full name"><Input required value={form.fullName} onChange={update("fullName")} placeholder="Samkelo Dlamini" /></Field>
              <Field label="Student number"><Input required value={form.studentNumber} onChange={update("studentNumber")} placeholder="2025001234" /></Field>
              <Field label="Email"><Input required type="email" value={form.email} onChange={update("email")} placeholder="you@university.edu" /></Field>
              <Field label="Password"><Input required type="password" minLength={6} value={form.password} onChange={update("password")} placeholder="At least 6 characters" /></Field>
              <Button type="button" className="w-full h-11 bg-gradient-primary"
                onClick={() => {
                  if (!form.fullName || !form.email || !form.password || !form.studentNumber) {
                    toast.error("Please fill all fields");
                    return;
                  }
                  setStep(2);
                }}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <Field label="Course"><Input required value={form.course} onChange={update("course")} placeholder="BSc Computer Science" /></Field>
              <Field label="Faculty"><Input required value={form.faculty} onChange={update("faculty")} placeholder="Faculty of Science" /></Field>
              <Field label="Campus"><Input required value={form.campus} onChange={update("campus")} placeholder="Main Campus" /></Field>
              <Field label="Year of study"><Input required value={form.year} onChange={update("year")} placeholder="1st Year" /></Field>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" className="flex-1 h-11 bg-gradient-primary">Create account</Button>
              </div>
            </>
          )}
        </form>

        <div className="mt-auto px-6 py-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary">Sign in</Link>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
