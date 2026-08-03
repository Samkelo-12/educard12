// Real authentication backed by Lovable Cloud (Supabase Auth + RLS-protected profiles table).
// No credentials or profile data are ever persisted in plaintext by the app itself.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StudentProfile {
  fullName: string;
  studentNumber: string;
  email: string;
  course: string;
  faculty: string;
  campus: string;
  year: string;
  photo?: string; // data URL
}

export interface SignUpInput extends StudentProfile {
  password: string;
}

type ProfileRow = {
  id: string;
  full_name: string;
  student_number: string;
  email: string;
  course: string;
  faculty: string;
  campus: string;
  year: string;
  photo: string | null;
};

function toProfile(row: ProfileRow): StudentProfile {
  return {
    fullName: row.full_name,
    studentNumber: row.student_number,
    email: row.email,
    course: row.course,
    faculty: row.faculty,
    campus: row.campus,
    year: row.year,
    photo: row.photo ?? undefined,
  };
}

function toRow(patch: Partial<StudentProfile>) {
  const row: Record<string, unknown> = {};
  if (patch.fullName !== undefined) row.full_name = patch.fullName;
  if (patch.studentNumber !== undefined) row.student_number = patch.studentNumber;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.course !== undefined) row.course = patch.course;
  if (patch.faculty !== undefined) row.faculty = patch.faculty;
  if (patch.campus !== undefined) row.campus = patch.campus;
  if (patch.year !== undefined) row.year = patch.year;
  if (patch.photo !== undefined) row.photo = patch.photo;
  return row;
}

export async function signUp(input: SignUpInput) {
  const redirectUrl = `${window.location.origin}/`;
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: input.fullName,
        student_number: input.studentNumber,
        course: input.course,
        faculty: input.faculty,
        campus: input.campus,
        year: input.year,
      },
    },
  });

  if (error) {
    throw new Error(
      error.message.toLowerCase().includes("already")
        ? "An account with this email already exists."
        : "Could not create your account. Please try again.",
    );
  }

  if (!data.session) {
    throw new Error("Check your email to confirm your account, then sign in.");
  }

  notifyAuth();
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Invalid email or password.");
  notifyAuth();
}

export async function signOut() {
  await supabase.auth.signOut();
  notifyAuth();
}

export async function getCurrentProfile(): Promise<StudentProfile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return toProfile(data as ProfileRow);
}

export async function updateProfile(patch: Partial<StudentProfile>) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update(toRow(patch))
    .eq("id", user.id);

  if (error) throw new Error("Could not save your changes.");
  notifyAuth();
}

export function useAuth() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const p = await getCurrentProfile();
    setProfile(p);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    window.addEventListener("dsc:auth", handler);
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      handler();
    });
    return () => {
      window.removeEventListener("dsc:auth", handler);
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  return { profile, ready, refresh };
}

export function notifyAuth() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dsc:auth"));
  }
}
