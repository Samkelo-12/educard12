import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, GraduationCap, X } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/SearchableSelect";
import { CAMPUSES, coursesFor, facultiesFor } from "@/data/wsu-programmes";
import { signUp } from "@/lib/auth-store";
import { toast } from "sonner";


export const Route = createFileRoute("/signup")({
  component: SignUp,
});

const LETTERS_ONLY = /^[A-Za-z\s'-]*$/;
const DIGITS_ONLY = /^[0-9]*$/;

function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: "",
    studentNumber: "",
    email: "",
    password: "",
    course: "",
    faculty: "",
    campus: "",
    year: " ",
  });

  const setError = (k: string, msg: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[k] = msg;
      else delete next[k];
      return next;
    });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const updateName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!LETTERS_ONLY.test(raw)) {
      setError("fullName", "Name can only contain letters");
      setForm({ ...form, fullName: raw.replace(/[^A-Za-z\s]/g, "") });
      return;
    }
    setError("fullName", "");
    setForm({ ...form, fullName: raw });
  };

  const updateStudentNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!DIGITS_ONLY.test(raw)) {
      setError("studentNumber", "Student number can only contain numbers");
      setForm({ ...form, studentNumber: raw.replace(/\D/g, "") });
      return;
    }
    setError("studentNumber", "");
    setForm({ ...form, studentNumber: raw });
  };

  const updatePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm({ ...form, password: value });
    setError("password", "");
    setError("confirmPassword", confirmPassword && value !== confirmPassword ? "Passwords do not match" : "");
  };

  const updateConfirm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setError("confirmPassword", value && value !== form.password ? "Passwords do not match" : "");
  };

  const validateStep1 = () => {
    if (!form.fullName || !form.email || !form.password || !form.studentNumber) {
      toast.error("Please fill all fields");
      return false;
    }
    if (!LETTERS_ONLY.test(form.fullName)) {
      setError("fullName", "Name can only contain letters");
      return false;
    }
    if (!DIGITS_ONLY.test(form.studentNumber)) {
      setError("studentNumber", "Student number can only contain numbers");
      return false;
    }
    if (!meetsMinimum) {
      setError("password", "Password must be 6+ characters with an uppercase, lowercase and number");
      return false;
    }
    if (form.password !== confirmPassword) {
      setError("confirmPassword", "Passwords do not match");
      return false;
    }
    return true;
  };

  const meetsMinimum =
    form.password.length >= 6 &&
    /[A-Z]/.test(form.password) &&
    /[a-z]/.test(form.password) &&
    /[0-9]/.test(form.password);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setStep(1);
    }
    if (!form.campus || !form.faculty || !form.course) {
      toast.error("Please select your campus, faculty and course");
      return;

    }
    try {
      await signUp(form);
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
              <Field label="Name and surname" error={errors.fullName}>
                <Input
                  required
                  value={form.fullName}
                  onChange={updateName}
                  inputMode="text"
                  autoComplete="name"
                  aria-invalid={!!errors.fullName}
                />
              </Field>
              <Field label="STUDENT NUMBER" error={errors.studentNumber}>
                <Input
                  required
                  value={form.studentNumber}
                  onChange={updateStudentNumber}
                  inputMode="numeric"
                  aria-invalid={!!errors.studentNumber}
                />
              </Field>
              <Field label="Email">
                <Input required type="email" value={form.email} onChange={update("email")} />
              </Field>
              <Field label="Password" error={errors.password}>
                <PasswordInput
                  value={form.password}
                  onChange={updatePassword}
                  show={showPassword}
                  onToggle={() => setShowPassword((s) => !s)}
                  invalid={!!errors.password}
                />
                <PasswordStrength password={form.password} />
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword}>
                <PasswordInput
                  value={confirmPassword}
                  onChange={updateConfirm}
                  show={showConfirm}
                  onToggle={() => setShowConfirm((s) => !s)}
                  invalid={!!errors.confirmPassword}
                />
              </Field>
              <Button
                type="button"
                disabled={!meetsMinimum}
                className="w-full h-11 bg-gradient-primary"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Field label="Campus">
                <SearchableSelect
                  value={form.campus}
                  options={CAMPUSES}
                  placeholder="Select campus"
                  searchPlaceholder="Search campuses..."
                  emptyText="No campus found"
                  onChange={(campus) => setForm({ ...form, campus, faculty: "", course: "" })}
                />
              </Field>
              <Field label="Faculty">
                <SearchableSelect
                  value={form.faculty}
                  options={facultiesFor(form.campus)}
                  disabled={!form.campus}
                  placeholder={form.campus ? "Select faculty" : "Select a campus first"}
                  searchPlaceholder="Search faculties..."
                  emptyText="No faculty found"
                  onChange={(faculty) => setForm({ ...form, faculty, course: "" })}
                />
              </Field>
              <Field label="Course">
                <SearchableSelect
                  value={form.course}
                  options={coursesFor(form.campus, form.faculty)}
                  disabled={!form.faculty}
                  placeholder={form.faculty ? "Select course" : "Select a faculty first"}
                  searchPlaceholder="Search courses..."
                  emptyText="No course found"
                  onChange={(course) => setForm({ ...form, course })}
                />
              </Field>
              <Field label="Year of study"><Input required value={form.year} onChange={update("year")} /></Field>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" disabled={!meetsMinimum} className="flex-1 h-11 bg-gradient-primary">Create account</Button>
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

function passwordChecks(pw: string) {
  return [
    { label: "At least 6 characters", ok: pw.length >= 6, required: true },
    { label: "One uppercase letter", ok: /[A-Z]/.test(pw), required: true },
    { label: "One lowercase letter", ok: /[a-z]/.test(pw), required: true },
    { label: "One number", ok: /[0-9]/.test(pw), required: true },
    { label: "One special character", ok: /[^A-Za-z0-9]/.test(pw), required: false },
  ];
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = passwordChecks(password);
  const score = checks.filter((c) => c.ok).length;
  const label = score <= 2 ? "Weak" : score <= 4 ? "Medium" : "Strong";
  const barClass = score <= 2 ? "bg-destructive" : score <= 4 ? "bg-amber-500" : "bg-emerald-500";
  const textClass = score <= 2 ? "text-destructive" : score <= 4 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${(score / 5) * 100}%` }} />
        </div>
        <span className={`text-xs font-semibold ${textClass}`}>{label}</span>
      </div>
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-emerald-600" : "text-muted-foreground"}`}>
            {c.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            {c.label}
            {!c.required ? <span className="text-muted-foreground/70">(optional)</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  invalid,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  onToggle: () => void;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        required
        type={show ? "text" : "password"}
        minLength={6}
        value={value}
        onChange={onChange}
        aria-invalid={invalid}
        className="pr-10"
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
