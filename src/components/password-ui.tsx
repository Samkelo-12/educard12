import { Check, Eye, EyeOff, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function passwordChecks(pw: string, minLength = 8) {
  return [
    { label: `At least ${minLength} characters`, ok: pw.length >= minLength, required: true },
    { label: "One uppercase letter", ok: /[A-Z]/.test(pw), required: true },
    { label: "One lowercase letter", ok: /[a-z]/.test(pw), required: true },
    { label: "One number", ok: /[0-9]/.test(pw), required: true },
    { label: "One special character", ok: /[^A-Za-z0-9]/.test(pw), required: false },
  ];
}

export function isPasswordValid(pw: string, minLength = 8) {
  return passwordChecks(pw, minLength)
    .filter((c) => c.required)
    .every((c) => c.ok);
}

export function PasswordStrength({ password, minLength = 8 }: { password: string; minLength?: number }) {
  if (!password) return null;
  const checks = passwordChecks(password, minLength);
  const score = checks.filter((c) => c.ok).length;
  const label = score <= 2 ? "Weak" : score <= 4 ? "Medium" : "Strong";
  const barClass = score <= 2 ? "bg-destructive" : score <= 4 ? "bg-amber-500" : "bg-emerald-500";
  const textClass = score <= 2 ? "text-destructive" : score <= 4 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";

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
          <li
            key={c.label}
            className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
          >
            {c.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            {c.label}
            {!c.required ? <span className="text-muted-foreground/70">(optional)</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  invalid,
  minLength = 8,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  onToggle: () => void;
  invalid?: boolean;
  minLength?: number;
}) {
  return (
    <div className="relative">
      <Input
        required
        type={show ? "text" : "password"}
        minLength={minLength}
        value={value}
        onChange={onChange}
        aria-invalid={invalid}
        className="pr-10 h-11"
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

export function PasswordField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
