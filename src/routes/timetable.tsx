import { createFileRoute, useRouter } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, ChevronLeft, AlertCircle } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/AppShell";

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

function TimetableScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"timetable" | "calendar">("timetable");
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1 = Mon
  const [schedule, setSchedule] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    if (activeTab === "timetable") {
      setSchedule([
        {
          id: "1",
          code: "INF26W0",
          name: "Information Systems",
          time: "08:00 - 10:00",
          venue: "C5F1, Potsdam",
          lecturer: "DR RANGA",
          dayOfWeek: 1,
        },
        {
          id: "2",
          code: "DES26W0",
          name: "DEVELOPMENT SOFTWARE",
          time: "11:00 - 13:00",
          venue: "C5F2, Potsdam",
          lecturer: "MR A.MABOVANA",
          dayOfWeek: 3,
        },
        {
          id: "3",
          code: "HCI26W0",
          name: "Human Computer Interaction",
          time: "13:00 - 15:00",
          venue: "AUDITORIUM, Potsdam",
          lecturer: "DR N.MAVUSO",
          dayOfWeek: 2,
        },
        {
          id: "4",
          code: "TEP26W0",
          name: "TECHNICAL PROGRAMMING",
          time: "08:00 - 10:00",
          venue: "C5F3, Potsdam",
          lecturer: "MR P.TAMBA TAMBA",
          dayOfWeek: 4,
        }
      ]);
    } else {
      setCalendarEvents([
        {
          id: "1",
          title: "First Semester Exams Start",
          date: "2026-11-20",
          category: "Exam",
        },
        {
          id: "2",
          title: "EduCard NFC Registration Deadline",
          date: "2026-11-25",
          category: "Administrative",
        },
      ]);
    }
    setLoading(false);
  }, [activeTab]);

  const filteredSchedule = schedule.filter((item) => item.dayOfWeek === selectedDay);

  return (
    <div className="min-h-full bg-background pb-8">
      {/* Dark Header Header with Back Button */}
      <div className="bg-black text-white px-5 pt-12 pb-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Academic Schedule</h1>
        <div className="w-10" /> {/* Spacer for centering header title */}
      </div>

      {/* Main Content Area */}
      <div className="px-5 -mt-4 space-y-5">
        {/* Toggle Switch */}
        <div className="flex rounded-2xl bg-card p-1 shadow-soft border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("timetable")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "calendar"
                ? "bg-black text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Academic Calendar
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
                filteredSchedule.map((slot) => (
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

                    <div className="pt-2 border-t border-border/60 flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1.5 text-foreground" />
                      <span>{slot.venue}</span>
                    </div>
                  </div>
                ))
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
        ) : (
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
        )}
      </div>
    </div>
  );
}