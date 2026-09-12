// Real, persisted user preferences (Lovable Cloud table `user_preferences`, RLS-scoped to the user).
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Preferences {
  darkMode: boolean;
  hideCard: boolean;
  analyticsOptIn: boolean;
}

const DEFAULTS: Preferences = { darkMode: false, hideCard: false, analyticsOptIn: true };

let cached: Preferences = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

const DARK_KEY = "educard-dark";

export function applyDarkMode(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", enabled);
  try {
    localStorage.setItem(DARK_KEY, enabled ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}

// Mirror of the saved preference so pre-login screens render in the right theme immediately.
export function storedDarkMode(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(DARK_KEY) === "1";
  } catch {
    return false;
  }
}

async function load(): Promise<Preferences> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) {
    cached = { ...DEFAULTS, darkMode: storedDarkMode() };
    loaded = true;
    applyDarkMode(cached.darkMode);
    emit();
    return cached;
  }

  const { data } = await supabase
    .from("user_preferences")
    .select("dark_mode, hide_card, analytics_opt_in")
    .eq("user_id", user.id)
    .maybeSingle();

  cached = data
    ? {
        darkMode: data.dark_mode,
        hideCard: data.hide_card,
        analyticsOptIn: data.analytics_opt_in,
      }
    : DEFAULTS;
  loaded = true;
  applyDarkMode(cached.darkMode);
  emit();
  return cached;
}

export async function savePreferences(patch: Partial<Preferences>) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error("Please sign in again.");

  const next = { ...cached, ...patch };

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      dark_mode: next.darkMode,
      hide_card: next.hideCard,
      analytics_opt_in: next.analyticsOptIn,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error("Could not save your setting. Please try again.");

  cached = next;
  applyDarkMode(cached.darkMode);
  emit();
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(cached);
  const [ready, setReady] = useState(loaded);

  useEffect(() => {
    const sync = () => {
      setPrefs(cached);
      setReady(loaded);
    };
    listeners.add(sync);
    if (loaded) {
      applyDarkMode(cached.darkMode);
      sync();
    } else {
      void load().then(sync);
    }
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const update = useCallback(async (patch: Partial<Preferences>) => {
    await savePreferences(patch);
  }, []);

  return { prefs, ready, update };
}

export function resetPreferencesCache() {
  cached = { ...DEFAULTS, darkMode: storedDarkMode() };
  loaded = false;
  emit();
}
