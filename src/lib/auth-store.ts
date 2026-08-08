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

type ProfileUpdate = Partial<Omit<ProfileRow, "id">>;

function toRow(patch: Partial<StudentProfile>): ProfileUpdate {
  const row: ProfileUpdate = {};
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

// ---------------------------------------------------------------------------
// Cached session/profile store.
// The network check runs once on first load; afterwards navigation reads the
// in-memory cache and onAuthStateChange keeps it fresh in the background.
// ---------------------------------------------------------------------------

let cachedProfile: StudentProfile | null = null;
let cacheLoaded = false;
let inflight: Promise<StudentProfile | null> | null = null;
const listeners = new Set<() => void>();
let subscribed = false;

function emit() {
  listeners.forEach((l) => l());
}

async function fetchProfile(): Promise<StudentProfile | null> {
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

async function loadProfile(force = false): Promise<StudentProfile | null> {
  if (!force && cacheLoaded) return cachedProfile;
  if (!force && inflight) return inflight;

  inflight = fetchProfile()
    .then((p) => {
      cachedProfile = p;
      cacheLoaded = true;
      return p;
    })
    .finally(() => {
      inflight = null;
    });

  const result = await inflight;
  emit();
  return result;
}

export async function getCurrentProfile(): Promise<StudentProfile | null> {
  return loadProfile();
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
  await loadProfile(true);
}

function ensureSubscribed() {
  if (subscribed || typeof window === "undefined") return;
  subscribed = true;

  window.addEventListener("dsc:auth", () => {
    void loadProfile(true);
  });

  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      cachedProfile = null;
      cacheLoaded = true;
      emit();
      return;
    }
    if (event === "TOKEN_REFRESHED") return;
    void loadProfile(true);
  });
}

export function useAuth() {
  const [profile, setProfile] = useState<StudentProfile | null>(cachedProfile);
  const [ready, setReady] = useState(cacheLoaded);

  const refresh = useCallback(async () => {
    await loadProfile(true);
  }, []);

  useEffect(() => {
    ensureSubscribed();

    const sync = () => {
      setProfile(cachedProfile);
      setReady(cacheLoaded);
    };
    listeners.add(sync);

    if (cacheLoaded) sync();
    else void loadProfile().then(sync);

    return () => {
      listeners.delete(sync);
    };
  }, []);

  return { profile, ready, refresh };
}

export function notifyAuth() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dsc:auth"));
  }
}

