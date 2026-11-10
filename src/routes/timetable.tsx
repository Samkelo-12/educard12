import { createFileRoute, useRouter } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, ChevronLeft, AlertCircle, CheckCircle2, QrCode, Radio, X, TrendingUp, AlertTriangle } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";
import { CardPreview } from "@/components/CardPreview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/timetable")({
  component: () => (
    <PhoneFrame>
      <AppShell>
        <TimetableScreen />
      </AppShell>
    </PhoneFrame>
  ),
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

interface ModuleStats {
  code: string;
  name: string;
  attended: number;
  totalClasses: number;
  percentage: number;
}

function TimetableScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"timetable" | "calendar" | "attendance">("timetable");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [checkedInSlots, setCheckedInSlots] = useState<Record<string, boolean>>({});
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Attendance Analytics State
  const [attendanceStats, setAttendanceStats] = useState<ModuleStats[]>([]);
  const [overallPercentage, setOverallPercentage] = useState<number>(0);

  // NFC Scan Modal State
  const [scanningSlot, setScanningSlot] = useState<{ id: string; code: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    if (activeTab === "timetable") {
      setSchedule([
        {
          id: "1",
          code: "INF26W0",
          name: "INFORMATION SYSTEMS",
          time: "08:00 - 10:00",
          venue: "D2F1, Potsdam",
          lecturer: "Dr Ranga",
          dayOfWeek: 1,
        },
        {
          id: "2",
          code: "DES25W0",
          name: "DEVELOPMENT SOFTWARE II",
          time: "11:00 - 13:00",
          venue: "Auditorium, Potsdam",
          lecturer: "Mr A. Mabovana",
          dayOfWeek: 1,
        },
        {
          id: "2",
          code: "DES25W0",
          name: "DEVELOPMENT SOFTWARE II",
          time: "11:00 - 13:00",
          venue: "Auditorium, Potsdam",
          lecturer: "Mr A. Mabovana",
          dayOfWeek: 3,
        },
        {
          id: "2",
          code: "DES25W0",
          name: "DEVELOPMENT SOFTWARE II",
          time: "10:00 - 12:00",
          venue: "Auditorium, Potsdam",
          lecturer: "Mr A. Mabovana",
          dayOfWeek: 4,
        },
         {
          id: "3",
          code: "HCI26W0",
          name: "HUMAN COMPUTER INTERACTION II",
          time: "13:00 - 15:00",
          venue: "C5F1, Potsdam",
          lecturer: "DR N. MAVUSO",
          dayOfWeek: 4,
        },
        {
          id: "3",
          code: "TEP26W0",
          name: "TECHNICAL PROGRAMMING I",
          time: "13:00 - 15:00",
          venue: "C6F2, Potsdam",
          lecturer: "Mr P. Tamba Tamba",
          dayOfWeek: 2,
        },
      ]);
    } else if (activeTab === "calendar") {
      setCalendarEvents([
        {
          id: "1",
          title: "First Semester Exams Start",
          date: "2026-11-20",
          category: "Exam",
        },
        {
          id: "2",
          title: "Supplementary Exams start",
          date: "2026-12-02",
          category: "Exam",
        },
      ]);
    } else if (activeTab === "attendance") {
      // Calculate or fetch live module attendance
      const modulesConfig = [
        { code: "INF26W0", name: "INFORMATION SYSTEMS", totalClasses: 20 },
        { code: "DES25W0", name: "DEVELOPMENT SOFTWARE II", totalClasses: 18 },
        { code: "TEP26W0", name: "TECHNICAL PROGRAMMING I", totalClasses: 16 },
        { code: "HCI26W0", name: "HUMAN COMPUTER INTERACTION II", totalClasses: 14 },
      ];

      let totalAttendedAll = 0;
      let totalPossibleAll = 0;

      const computed: ModuleStats[] = modulesConfig.map((m) => {
        // Boost check-ins if student checked in via slots
        const bonus = checkedInSlots[m.code] ? 1 : 0;
        const attended = (m.code === "INF26W0" ? 15 : m.code === "DES25W0" ? 12 : m.code === "HCI26W0" ? 11 : 10) + bonus;
        const percentage = Math.min(100, Math.round((attended / m.totalClasses) * 100));

        totalAttendedAll += attended;
        totalPossibleAll += m.totalClasses;

        return {
          code: m.code,
          name: m.name,
          attended,
          totalClasses: m.totalClasses,
          percentage,
        };
      });

      setAttendanceStats(computed);
      setOverallPercentage(Math.round((totalAttendedAll / totalPossibleAll) * 100));
    }
    setLoading(false);
  }, [activeTab, checkedInSlots]);

  // Handle NFC tap simulation completion
  const completeCheckIn = async (slotId: string, moduleCode: string) => {
    if (profile) {
      try {
        await (supabase.from("attendance_logs" as any) as any).insert([
          {
            slot_id: slotId,
            module_code: moduleCode,
            checked_in_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.warn("Attendance log note:", err);
      }
    }

    setCheckedInSlots((prev) => ({ ...prev, [slotId]: true, [moduleCode]: true }));
    setScanningSlot(null);
    toast.success(`NFC Check-in confirmed for ${moduleCode}!`);
  };

  // Auto-complete simulation after 2.5 seconds
  useEffect(() => {
    if (!scanningSlot) return;
    const timer = setTimeout(() => {
      void completeCheckIn(scanningSlot.id, scanningSlot.code);
    }, 2500);
    return () => clearTimeout(timer);
  }, [scanningSlot]);

  const filteredSchedule = schedule.filter((item) => item.dayOfWeek === selectedDay);

  return (
    <div className="relative min-h-full bg-background pb-8">
      {/* Dark Header with Back Button */}
      <div className="bg-black text-white px-5 pt-12 pb-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Academic Schedule</h1>
        <div className="w-10" />
      </div>

      {/* Main Content Area */}
      <div className="px-5 -mt-4 space-y-5">
        {/* Toggle Switch (Now 3 views: Timetable, Calendar, Attendance) */}
        <div className="flex rounded-2xl bg-card p-1 shadow-soft border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("timetable")}
            className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${
              activeTab === "timetable"
                ? "bg-black text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Weekly Class
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${
              activeTab === "calendar"
                ? "bg-black text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${
              activeTab === "attendance"
                ? "bg-black text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Attendance
          </button>
        </div>

        {activeTab === "timetable" ? (
          <>
            {/* Day Selector Pills */}
            <div className="flex justify-between gap-2">
              {DAYS.map((day, idx) => {
                const dayNum = idx + 1;
                const isSelected = selectedDay === dayNum;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(dayNum)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-black text-white border-black"
                        : "bg-card text-muted-foreground border-border hover:border-muted"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Timetable Slots */}
            <div className="space-y-3">
              {loading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Loading schedule…
                </div>
              ) : filteredSchedule.length > 0 ? (
                filteredSchedule.map((slot) => {
                  const isCheckedIn = checkedInSlots[slot.id];
                  return (
                    <div
                      key={slot.id}
                      className="rounded-3xl bg-card p-5 shadow-soft border border-border space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-black/5 text-[11px] font-bold tracking-wide text-foreground">
                          {slot.code}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{slot.time}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-foreground text-base">{slot.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{slot.lecturer}</p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1.5 text-foreground" />
                          <span>{slot.venue}</span>
                        </div>

                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Checked In
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setScanningSlot({ id: slot.id, code: slot.code })}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-semibold shadow-sm hover:bg-black/80 transition-colors"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-3xl bg-card p-8 shadow-soft border border-border text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto stroke-1" />
                  <p className="text-sm font-medium text-foreground">No classes scheduled</p>
                  <p className="text-xs text-muted-foreground">
                    You have no lectures set for this day.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : activeTab === "calendar" ? (
          /* Academic Calendar View */
          <div className="space-y-3">
            {calendarEvents.map((evt) => (
              <div
                key={evt.id}
                className="rounded-3xl bg-card p-5 shadow-soft border border-border flex items-start gap-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    {evt.category}
                  </span>
                  <h3 className="font-bold text-foreground text-sm leading-tight mt-0.5">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{evt.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Real-Time Attendance Analytics View */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Overall Summary Card */}
            <div className="rounded-3xl bg-black text-white p-6 shadow-2xl border border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span>Overall Standing</span>
                </div>
                <h2 className="text-3xl font-extrabold mt-1 text-white">{overallPercentage}%</h2>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {overallPercentage >= 75
                    ? "Good standing — Exam qualified."
                    : "Warning — Below 75% threshold!"}
                </p>
              </div>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                <CheckCircle2 className={`h-8 w-8 ${overallPercentage >= 75 ? "text-emerald-400" : "text-amber-400"}`} />
              </div>
            </div>

            {/* Module Breakdown List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                Module Breakdown
              </h3>

              {attendanceStats.map((mod) => {
                const isAtRisk = mod.percentage < 75;
                return (
                  <div
                    key={mod.code}
                    className="rounded-3xl bg-card p-5 shadow-soft border border-border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="px-2.5 py-1 rounded-full bg-black/5 text-[11px] font-bold text-foreground">
                          {mod.code}
                        </span>
                        <h4 className="text-sm font-bold text-foreground mt-1">{mod.name}</h4>
                      </div>

                      <div className="text-right">
                        <span className={`text-base font-extrabold ${isAtRisk ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {mod.percentage}%
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {mod.attended}/{mod.totalClasses} Attended
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAtRisk ? "bg-amber-500" : "bg-black dark:bg-white"
                        }`}
                        style={{ width: `${mod.percentage}%` }}
                      />
                    </div>

                    {isAtRisk && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Attendance below 75% exam qualification requirement.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* NFC Check-in Demo Modal */}
      {scanningSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl border border-border text-center space-y-6">
            <button
              type="button"
              onClick={() => setScanningSlot(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white mb-2">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Hold Card Near Reader</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Checking into <span className="font-semibold text-foreground">{scanningSlot.code}</span>
              </p>
            </div>

            {/* Card with NFC Pulse Waves */}
            <div className="relative py-4 flex items-center justify-center">
              <div className="absolute h-48 w-48 rounded-full border border-black/20 dark:border-white/20 animate-ping opacity-25" />
              <div className="absolute h-36 w-36 rounded-full border-2 border-black/40 dark:border-white/40 animate-pulse" />

              <div className="relative z-10 w-full max-w-[260px] transform transition-transform duration-500 scale-105">
                {profile ? (
                  <CardPreview profile={profile} compact />
                ) : (
                  <div className="h-36 w-full rounded-2xl bg-black text-white p-4 text-left flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">WSU EduCard</span>
                    <span className="text-sm font-semibold">Ready to Check In</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground animate-pulse">
                Emitting NFC signal…
              </p>
              <p className="text-[11px] text-muted-foreground">
                Ensure device is close to classroom door reader
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}