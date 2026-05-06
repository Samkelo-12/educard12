// Lightweight client-side auth + profile store using localStorage.
// This is a UI demo — replace with Lovable Cloud auth for production.
import { useEffect, useState, useCallback } from "react";

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

const KEY_USERS = "dsc.users";
const KEY_SESSION = "dsc.session";

interface StoredUser extends StudentProfile {
  password: string;
}

function readUsers(): Record<string, StoredUser> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY_USERS) || "{}");
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
}

export function signUp(input: StoredUser) {
  const users = readUsers();
  const id = input.email.toLowerCase();
  if (users[id]) throw new Error("An account with this email already exists.");
  users[id] = input;
  writeUsers(users);
  localStorage.setItem(KEY_SESSION, id);
}

export function signIn(email: string, password: string) {
  const users = readUsers();
  const id = email.toLowerCase();
  const user = users[id];
  if (!user || user.password !== password) {
    throw new Error("Invalid email or password.");
  }
  localStorage.setItem(KEY_SESSION, id);
}

export function signOut() {
  localStorage.removeItem(KEY_SESSION);
  window.dispatchEvent(new Event("dsc:auth"));
}

export function getCurrentProfile(): StudentProfile | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem(KEY_SESSION);
  if (!id) return null;
  const u = readUsers()[id];
  if (!u) return null;
  const { password: _pw, ...profile } = u;
  return profile;
}

export function updateProfile(patch: Partial<StudentProfile>) {
  const id = localStorage.getItem(KEY_SESSION);
  if (!id) return;
  const users = readUsers();
  if (!users[id]) return;
  users[id] = { ...users[id], ...patch };
  writeUsers(users);
  window.dispatchEvent(new Event("dsc:auth"));
}

export function useAuth() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setProfile(getCurrentProfile());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("dsc:auth", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("dsc:auth", handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  return { profile, ready, refresh };
}

export function notifyAuth() {
  window.dispatchEvent(new Event("dsc:auth"));
}
