import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { registerPushToken, removePushToken } from "@/lib/push.functions";

export type PushResult =
  | { status: "registered"; token: string }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" | "error" };

const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string | undefined,
  projectId: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string | undefined,
  appId,
  messagingSenderId: appId?.split(":")[1] ?? "",
};

export async function enablePush(): Promise<PushResult> {
  // -------------------------------------------------------------
  // 1. NATIVE ANDROID / IOS FLOW (Capacitor)
  // -------------------------------------------------------------
  if (Capacitor.isNativePlatform()) {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
        return { status: "denied" };
      }

      // Register device with native APNS/FCM
      await PushNotifications.register();

      return new Promise<PushResult>((resolve) => {
        // Listen for native registration token
        void PushNotifications.addListener("registration", async (token: any) => {
          await registerPushToken({ data: { token: token.value, platform: "android" } });
          localStorage.setItem("educard-push-registered", "1");
          localStorage.setItem("educard-push-token", token.value);
          resolve({ status: "registered", token: token.value });
        });

        // Listen for registration errors
        void PushNotifications.addListener("registrationError", (err: any) => {
          console.error("Native Push Registration Error:", err);
          resolve({ status: "error" });
        });
      });
    } catch (err) {
      console.error("Native push error:", err);
      return { status: "error" };
    }
  }

  // -------------------------------------------------------------
  // 2. WEB / PWA FALLBACK FLOW
  // -------------------------------------------------------------
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !appId || !vapidKey) {
    return { status: "not-configured" };
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { status: "unsupported" };
  }

  try {
    const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
    const { initializeApp, getApps } = await import("firebase/app");

    const permission =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") {
      return { status: "denied" };
    }

    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(firebaseConfig).filter(([, v]) => v !== undefined) as [string, string][])
    ).toString();
    const serviceWorkerRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
    await navigator.serviceWorker.ready;

    const app = getApps().find((a) => a.name === "educard-push") ?? initializeApp(firebaseConfig, "educard-push");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration });
    if (!token) return { status: "denied" };

    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "EduCard";
      const body = payload.notification?.body ?? "You have a new update.";
      if (payload.notification) {
        new Notification(title, { body });
      }
    });

    await registerPushToken({ data: { token, platform: "web" } });
    localStorage.setItem("educard-push-registered", "1");
    localStorage.setItem("educard-push-token", token);
    return { status: "registered", token };
  } catch (err) {
    console.error("Push registration failed", err);
    return { status: "error" };
  }
}

export async function disablePush(): Promise<void> {
  try {
    const token = localStorage.getItem("educard-push-token");
    if (token) {
      await removePushToken({ data: { token } });
      localStorage.removeItem("educard-push-token");
    }
  } finally {
    localStorage.setItem("educard-push-registered", "0");
  }
}

export function pushRegistrationState(): "on" | "off" | "unknown" {
  if (typeof window === "undefined") return "off";

  try {
    // If running natively or in web, check if previously flagged as registered
    const registered = localStorage.getItem("educard-push-registered");
    if (registered === "1") return "on";
    
    // Otherwise allow user interaction by defaulting to 'off' (unlocked) rather than 'unknown'
    return "off";
  } catch {
    return "off";
  }


  // Web Browser check
  if (!("Notification" in window)) return "unknown";
  if (Notification.permission !== "granted") return "off";
  try {
    return localStorage.getItem("educard-push-registered") === "1" ? "on" : "off";
  } catch {
    return "unknown";
  }
}
