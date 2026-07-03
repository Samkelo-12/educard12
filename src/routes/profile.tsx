import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Camera, ChevronRight, LogOut, Settings, Shield } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { useAuth, updateProfile, signOut } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: () => (
    <PhoneFrame>
      <AppShell>
        <ProfilePage />
      </AppShell>
    </PhoneFrame>
  ),
});

function ProfilePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile ?? null);

  if (!profile) return null;

  const initials = profile.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ photo: reader.result as string });
      toast.success("Photo updated");
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!draft) return;
    updateProfile(draft);
    setEditing(false);
    toast.success("Profile updated");
  };

  return (
    <div className="pb-6">
      <header className="bg-gradient-card px-5 pt-12 pb-20 text-primary-foreground">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold">Profile</h1>
          <button
            onClick={() => {
              if (editing) save();
              else { setDraft(profile); setEditing(true); }
            }}
            className="text-sm font-semibold"
          >
            {editing ? "Save" : "Edit"}
          </button>
        </div>
      </header>

      <div className="-mt-14 px-5">
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <div className="flex flex-col items-center -mt-12">
            <label className="relative cursor-pointer">
              <div className="h-24 w-24 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-2xl font-bold ring-4 ring-card overflow-hidden">
                {profile.photo ? (
                  <img src={profile.photo} alt="" className="h-full w-full object-cover" />
                ) : initials}
              </div>
              <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground ring-2 ring-card">
                <Camera className="h-4 w-4" />
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
            <h2 className="mt-3 text-lg font-bold">{profile.fullName}</h2>
            <p className="text-xs text-muted-foreground">{profile.studentNumber}</p>
          </div>

          <div className="mt-5 space-y-3">
            {editing && draft ? (
              <>
                <EditField label="Full name" value={draft.fullName} onChange={(v) => setDraft({ ...draft, fullName: v })} />
                <EditField label="Course" value={draft.course} onChange={(v) => setDraft({ ...draft, course: v })} />
                <EditField label="Faculty" value={draft.faculty} onChange={(v) => setDraft({ ...draft, faculty: v })} />
                <EditField label="Campus" value={draft.campus} onChange={(v) => setDraft({ ...draft, campus: v })} />
                <EditField label="Year" value={draft.year} onChange={(v) => setDraft({ ...draft, year: v })} />
                <EditField label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
              </>
            ) : (
              <>
                <Row label="Email" value={profile.email} />
                <Row label="Course" value={profile.course} />
                <Row label="Faculty" value={profile.faculty} />
                <Row label="Campus" value={profile.campus} />
                <Row label="Year" value={profile.year} />
              </>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-card shadow-soft divide-y divide-border">
          <SettingsRow icon={Shield} label="Privacy & security" to="/privacy" />
          <SettingsRow icon={Settings} label="App settings" to="/settings" />
        </div>

        <Button
          variant="outline"
          className="mt-5 w-full h-12 gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => { signOut(); navigate({ to: "/login" }); }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-10" />
    </div>
  );
}

function SettingsRow({ icon: Icon, label, to }: { icon: typeof Shield; label: string; to: string }) {
  return (
    <Link to={to} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
      <Icon className="h-5 w-5 text-primary" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
