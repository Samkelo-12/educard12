**EduCard**

EduCard is a progressive web app (PWA) I built to make everyday campus life easier for university students and staff. It brings together a digital student card, campus transport pass applications, class timetables, and digital attendance tracking in one place.

## Why I Built This

Before writing any code, I surveyed students on campus and observed how card issuing, transport passes, and class attendance actually work on the ground:

- **Lost cards mean missed classes:** **95%** of surveyed students had lost, forgotten, or damaged their physical student card at least once, and **82%** had been turned away from campus transport because of card issues—blocking them from getting to campus and attending lectures.
- **Start-of-year bottlenecks:** Applying for student cards and transport stickers at the beginning of the year means days of long queues. Staff end up exhausted, skipping lunch, and working overtime just to process everyone, while classes often start before all students even receive their cards or stickers.
- **Fabricated bus stickers:** Physical transport stickers are easy to forge or duplicate, making it difficult to verify who is genuinely approved to board campus shuttles.
- **Inaccurate attendance records:** Paper registers are inconsistent and easy to manipulate, leading to inaccurate and unreliable attendance records.
- **Inconsistent timetable access:** The main student portal is often inconsistent when releasing class timetables, leaving students unsure of venue or schedule changes.

EduCard fixes these gaps by letting students carry a verified digital ID and transport pass on their phone, apply online without standing in queues, view up-to-date class timetables, and sign digital attendance registers.

## What It Does

- **Mobile App Experience:** Designed for smartphones and installable directly to the home screen (PWA), so students always have their card and schedule in their pocket.
- **Digital Student Card & Verified Transport Pass:** Displays the student's photo, student number, course, campus, and live transport approval status, eliminating physical card delays and forged bus stickers.
- **NFC Tap-In Verification:** Supports NFC scanning so students can tap their phones for fast, verified campus shuttle boarding and lecture hall attendance check-ins.
- **Online Transport Pass Applications:** Auto-fills the form from the student's profile, requires valid uploads for their ID and Proof of Registration, and lets staff review and approve applications digitally without start-of-year queues.
- **Academic Attendance Register:** Combines NFC tap-ins with real-time digital registers so lecturers can track module attendance accurately and prevent false attendance entries.
- **Class Timetable:** Gives students a reliable, consistent place to check their module schedule and venues.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, TanStack Router
- **Backend & Database:** Supabase (PostgreSQL, Auth, Row-Level Security, Storage, Edge Functions)
- **Hosting:** Lovable
```text
+-------------------------------------------------------------------+
|        EduCard Mobile App / Installable              |
|    React • TypeScript • Tailwind CSS • Capacitor • NFC Plugin     |
+---------------------------------+---------------------------------+
                                  | HTTPS / JWT Auth
                                  v
+-------------------------------------------------------------------+
|                         Supabase Backend                          |
|  +------------------+  +-------------------+  +----------------+  |
|  |  Supabase Auth   |  | PostgreSQL + RLS  |  | Private Storage|  |
|  | (Student/Staff)  |  | (Triggers & FKs)  |  | (Signed URLs)  |  |
|  +------------------+  +-------------------+  +----------------+  |
+---------------------------------^---------------------------------+
                                  | Optional Decoupled Sync
+---------------------------------+---------------------------------+
|                Institutional ERP Sync Adapter                     |
|     Read-Only API / Webhook / Nightly CSV Upsert                  |
|      (Keeps the University's Core ERP Database Isolated)          |
+-------------------------------------------------------------------+

```

## How Security & Data Are Handled

- **Row-Level Security (RLS):** Students can only view and submit their own profile and transport records. Admin and lecturer access is scoped strictly by role.
- **Private Document Storage:** Uploaded IDs and Proof of Registration files sit in private Supabase storage buckets and are accessed via short-lived signed URLs rather than public links.
- **Database Integrity:** Uses foreign keys, triggers, and `NOT NULL` constraints so incomplete applications cannot slip through.
- **ERP-Ready Sync:** Designed with a standalone sync adapter (`verification_source` flag) so an institution can push verified student records via a read-only API or scheduled CSV feed without exposing its core ERP database.

## Running Locally
## How I Ran It Locally

To test EduCard in a real mobile environment I did the following:

1. **Connected the Backend:** I linked my local project to Supabase by adding `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to my `.env` file, with all tables, triggers, private storage buckets, and Row-Level Security (RLS) policies configured in my Supabase project.
2. **Built & Synced the Android Project:** I installed the dependencies (`npm install`), built the web bundle (`npm run build`), and synced it into the native Android wrapper (`npx cap sync android`).
3. **Launched in Android Studio:** I opened the `android/` folder in **Android Studio**, waited for Gradle to finish syncing, and ran the app on an Android Virtual Device (emulator) as well as a physical Android phone connected via USB debugging to test the mobile UI, document uploads, and NFC scanning flows.
