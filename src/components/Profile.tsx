"use client";

import React, {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Waves,
  Bike,
  Footprints,
  CheckCircle2,
  MapPin,
  User,
  Plus,
  Trash2,
  Trophy,
  LucideIcon,
  Search,
  ChevronDown,
  X,
  Clock,
} from "lucide-react";

import {
  AchievementInput,
  ActionResponse,
  CYCLIST_DISTANCES,
  Discipline,
  ExperienceLevel,
  PAKISTAN_CITIES,
  RaceDistance,
  RaceResultInput,
  RUNNER_DISTANCES,
  setProfilePayload,
  SWIMMER_DISTANCES,
} from "../type/ProfileType";
import { setprofileAction } from "../actions/SetProfileAction";

// ─── Pakistan Cities ──────────────────────────────────────────────────────────



// ─── Types ────────────────────────────────────────────────────────────────────

type RaceEntry = {
  distance: RaceDistance;
  discipline: Discipline;
  /** Raw string as typed by the user — either MM:SS or H:MM:SS */
  mmss: string;
};

interface FormState {
  displayName: string;
  locationCity: string;
  disciplines: Discipline[];
  raceEntries: RaceEntry[];
  experienceLevel: ExperienceLevel | null;
  achievements: AchievementInput[];
}

const TOTAL_STEPS = 6;

const initialState: ActionResponse = {
  success: false,
  error: false,
  message: null,
  data: null,
};

const initialFormState: FormState = {
  displayName: "",
  locationCity: "",
  disciplines: [],
  raceEntries: [],
  experienceLevel: null,
  achievements: [],
};


function timeToSeconds(val: string): number {
  const parts = val.split(":");
  if (parts.length === 2) {
    // MM:SS
    const mm = parseInt(parts[0], 10);
    const ss = parseInt(parts[1], 10);
    if (isNaN(mm) || isNaN(ss) || ss >= 60 || mm < 0) return NaN;
    return mm * 60 + ss;
  }
  if (parts.length === 3) {
    // H:MM:SS
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    const ss = parseInt(parts[2], 10);
    if (isNaN(hh) || isNaN(mm) || isNaN(ss) || hh < 0 || mm >= 60 || ss >= 60)
      return NaN;
    return hh * 3600 + mm * 60 + ss;
  }
  return NaN;
}


function needsHourFormat(disc: Discipline, distance: RaceDistance): boolean {
  return (
    (disc === "CYCLIST" && (distance === "90K" || distance === "180K")) ||
    (disc === "RUNNER" &&
      (distance === "Half Marathon" || distance === "Full Marathon")) ||
    (disc === "SWIMMER" && distance === "5K Open Water")
  );
}


function autoColon(raw: string, prev: string, needsHours: boolean): string {
  // Only auto-insert when typing forward (not deleting)
  if (raw.length <= prev.length) return raw;

  const colonCount = (raw.match(/:/g) || []).length;

  if (!needsHours) {
    // MM:SS — first colon after 2 digits
    if (colonCount === 0 && raw.length === 2) return raw + ":";
    return raw;
  }

  // H:MM:SS — first colon after 1 digit, second colon after H:MM
  if (colonCount === 0 && raw.length === 1) return raw + ":";
  if (colonCount === 1) {
    const afterFirst = raw.split(":")[1] ?? "";
    if (afterFirst.length === 2) return raw + ":";
  }
  return raw;
}

function formatEnum(val: string | null): string {
  if (!val) return "";
  return val.charAt(0) + val.slice(1).toLowerCase();
}

function distancesFor(disc: Discipline): readonly RaceDistance[] {
  if (disc === "RUNNER") return RUNNER_DISTANCES;
  if (disc === "SWIMMER") return SWIMMER_DISTANCES;
  return CYCLIST_DISTANCES;
}

function getDisciplineStyle(disc: Discipline) {
  if (disc === "SWIMMER")
    return {
      badge: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
      iconColor: "text-cyan-400",
      border: "border-cyan-500/40",
      pillSelected: "border-cyan-500/50 bg-zinc-900 text-white",
    };
  if (disc === "CYCLIST")
    return {
      badge: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      iconColor: "text-amber-400",
      border: "border-amber-500/40",
      pillSelected: "border-amber-500/50 bg-zinc-900 text-white",
    };
  return {
    badge: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/40",
    pillSelected: "border-emerald-500/50 bg-zinc-900 text-white",
  };
}

function DiscIcon({
  disc,
  className,
}: {
  disc: Discipline;
  className?: string;
}) {
  if (disc === "SWIMMER") return <Waves className={className} />;
  if (disc === "CYCLIST") return <Bike className={className} />;
  return <Footprints className={className} />;
}

// ─── City Dropdown ────────────────────────────────────────────────────────────

function CityDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (city: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = PAKISTAN_CITIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase()),
  );

  const showCustomOption =
    search.trim().length > 0 &&
    !PAKISTAN_CITIES.some(
      (c) => c.toLowerCase() === search.trim().toLowerCase(),
    );

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
  }, [open]);

  const select = (city: string) => {
    onChange(city);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full border px-4 py-4 text-left flex items-center justify-between transition-all outline-none cursor-pointer relative z-100 ${
          open
            ? "bg-zinc-900 border-blue-500 border-b-zinc-800 rounded-t-xl rounded-b-none"
            : "bg-zinc-900/50 border-zinc-800 rounded-xl hover:border-zinc-700"
        }`}
      >
        <span className={value ? "text-white font-medium" : "text-zinc-500"}>
          {value || "Select or search a city"}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5 cursor-pointer" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
            className="border border-t-0 border-zinc-700 rounded-b-xl bg-zinc-900 absolute  w-full z-100"
          >
            <div className="p-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 focus-within:border-blue-500 transition-colors cursor-pointer">
                <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder:text-zinc-600 text-sm outline-none cursor-pointer"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3 cursor-pointer" />
                  </button>
                )}
              </div>
            </div>

            <div
              className="max-h-44 overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {showCustomOption && (
                <button
                  type="button"
                  onClick={() => select(search.trim())}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors border-b border-zinc-800/60 "
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Add &ldquo;
                    <span className="font-bold">{search.trim()}</span>&rdquo;
                  </span>
                </button>
              )}

              {filtered.length === 0 && !showCustomOption && (
                <p className="text-center text-xs text-zinc-600 py-5">
                  No cities found
                </p>
              )}

              {filtered.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => select(city)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                    value === city
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                >
                  <span>{city}</span>
                  {value === city && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Race Distance Section ────────────────────────────────────────────────────

function RaceDistanceSection({
  disc,
  raceEntries,
  onToggle,
  onTimeChange,
}: {
  disc: Discipline;
  raceEntries: RaceEntry[];
  onToggle: (disc: Discipline, distance: RaceDistance) => void;
  onTimeChange: (
    disc: Discipline,
    distance: RaceDistance,
    mmss: string,
  ) => void;
}) {
  const distances = distancesFor(disc);
  const style = getDisciplineStyle(disc);
  const selectedEntries = raceEntries.filter((r) => r.discipline === disc);

  return (
    <div className="space-y-3">
      {/* Discipline badge */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest ${style.badge}`}
      >
        <DiscIcon disc={disc} className="w-3.5 h-3.5" />
        {formatEnum(disc)}
      </div>

      {/* Distance pills */}
      <div className="flex flex-wrap gap-2">
        {distances.map((distance) => {
          const entry = raceEntries.find(
            (r) => r.discipline === disc && r.distance === distance,
          );
          const selected = !!entry;
          const valid = selected && timeToSeconds(entry!.mmss) > 0;

          return (
            <button
              key={distance}
              type="button"
              onClick={() => onToggle(disc, distance)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-bold transition-all select-none ${
                selected
                  ? style.pillSelected
                  : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {valid ? (
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${style.iconColor}`}
                />
              ) : selected ? (
                <Clock
                  className={`w-3.5 h-3.5 shrink-0 ${style.iconColor} opacity-60`}
                />
              ) : null}
              {distance}
            </button>
          );
        })}
      </div>

      {/* Time input rows */}
      <div className="space-y-2">
        <AnimatePresence>
          {selectedEntries.map((entry) => {
            const isLong = needsHourFormat(disc, entry.distance);
            const valid = timeToSeconds(entry.mmss) > 0;

            return (
              <motion.div
                key={entry.distance}
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <div
                  className={`flex items-center gap-3 bg-zinc-900/70 border ${style.border} rounded-xl px-4 py-3`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <DiscIcon
                      disc={disc}
                      className={`w-4 h-4 shrink-0 ${style.iconColor}`}
                    />
                    <span className="text-sm font-bold text-zinc-200 truncate">
                      {entry.distance}
                    </span>
                  </div>

                  <div className="relative shrink-0">
                    <input
                      type="text"
                      placeholder={isLong ? "H:MM:SS" : "MM:SS"}
                      value={entry.mmss}
                      maxLength={isLong ? 8 : 5}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9:]/g, "");
                        const withColon = autoColon(raw, entry.mmss, isLong);
                        onTimeChange(disc, entry.distance, withColon);
                      }}
                      className={`w-28 bg-black border rounded-xl px-3 py-2 text-white placeholder:text-zinc-700 outline-none text-center font-black text-base tracking-widest transition-all focus:border-blue-500 ${
                        valid ? "border-zinc-600" : "border-zinc-800"
                      }`}
                    />
                    {valid && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-1.5 -top-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileSetup() {
  const [state, dispatcher, isPending] = useActionState<
    ActionResponse,
    setProfilePayload
  >(setprofileAction, initialState);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [achTitle, setAchTitle] = useState("");
  const [achDesc, setAchDesc] = useState("");

  useEffect(() => {
    if (state.success && state.message === "Profile created successfully") {
      window.location.href = "/dashboard/home";
    }
    if (state.error) console.error("Profile save failed:", state.message);
  }, [state]);

  const update = (fields: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  const toggleDiscipline = (disc: Discipline) => {
    setForm((prev) => {
      const has = prev.disciplines.includes(disc);
      const disciplines = has
        ? prev.disciplines.filter((d) => d !== disc)
        : [...prev.disciplines, disc];
      const raceEntries = has
        ? prev.raceEntries.filter((r) => r.discipline !== disc)
        : prev.raceEntries;
      return { ...prev, disciplines, raceEntries };
    });
  };

  const toggleRaceDistance = (disc: Discipline, distance: RaceDistance) => {
    setForm((prev) => {
      const exists = prev.raceEntries.some(
        (r) => r.discipline === disc && r.distance === distance,
      );
      if (exists) {
        return {
          ...prev,
          raceEntries: prev.raceEntries.filter(
            (r) => !(r.discipline === disc && r.distance === distance),
          ),
        };
      }
      return {
        ...prev,
        raceEntries: [
          ...prev.raceEntries,
          { discipline: disc, distance, mmss: "" },
        ],
      };
    });
  };

  const updateRaceTime = (
    disc: Discipline,
    distance: RaceDistance,
    mmss: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      raceEntries: prev.raceEntries.map((r) =>
        r.discipline === disc && r.distance === distance ? { ...r, mmss } : r,
      ),
    }));
  };

  const addAchievement = () => {
    const title = achTitle.trim();
    if (!title) return;
    update({
      achievements: [
        ...form.achievements,
        { title, description: achDesc.trim() || undefined },
      ],
    });
    setAchTitle("");
    setAchDesc("");
  };

  const removeAchievement = (idx: number) => {
    update({ achievements: form.achievements.filter((_, i) => i !== idx) });
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep((p) => p + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep((p) => p - 1);
  };

  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return (
          form.displayName.trim() !== "" && form.locationCity.trim() !== ""
        );
      case 2:
        return form.disciplines.length > 0;
      case 3:
        // Every selected discipline must have ≥1 entry, and every entry must
        // have a valid time. timeToSeconds handles both MM:SS and H:MM:SS.
        return form.disciplines.every((disc) => {
          const entries = form.raceEntries.filter((r) => r.discipline === disc);
          if (entries.length === 0) return false;
          return entries.every(
            (r) => !isNaN(timeToSeconds(r.mmss)) && timeToSeconds(r.mmss) > 0,
          );
        });
      case 4:
        return form.experienceLevel !== null;
      default:
        return true;
    }
  };

  const onComplete = () => {
    if (!form.experienceLevel) return;

    const raceResults: RaceResultInput[] = form.raceEntries
      .map((r) => ({
        discipline: r.discipline,
        distance: r.distance,
        timeSeconds: timeToSeconds(r.mmss),
      }))
      .filter((r) => !isNaN(r.timeSeconds) && r.timeSeconds > 0);

    const payload: setProfilePayload = {
      displayName: form.displayName,
      locationCity: form.locationCity,
      disciplines: form.disciplines,
      experienceLevel: form.experienceLevel,
      raceResults,
      achievements: form.achievements,
      trainingDaysPerWeek: null,
      competitionLevel: null,
    };
    startTransition(() => dispatcher(payload));
  };

  const stepVariants: Variants = {
    hidden: { opacity: 0, x: 30, scale: 0.98 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    exit: {
      opacity: 0,
      x: -30,
      scale: 0.98,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 sm:p-6 selection:bg-blue-500/30 font-sans">
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800/80 rounded-4xl p-6 sm:p-10 shadow-2xl overflow-visible flex flex-col min-h-140 sm:min-h-155">
        {/* Progress Bar — shown on steps 1–5, hidden on step 6 (summary) */}
        {step < TOTAL_STEPS && (
          <div className="mb-8 relative z-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Stage {step} of 5
              </span>
              <span className="text-xs font-bold text-blue-400">
                {Math.round((step / 5) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-linear-to-r from-blue-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 5) * 100}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="grow relative z-10 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col"
            >
              {/* ── Step 1: Identity ── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Profile Setup
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Let&apos;s set up your identity on TriMatch.
                    </p>
                  </div>

                  <div className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Display Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alex River"
                        value={form.displayName}
                        onChange={(e) =>
                          update({ displayName: e.target.value })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-blue-500 focus:bg-zinc-900 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2 relative z-100">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" /> Location (City)
                      </label>
                      <CityDropdown
                        value={form.locationCity}
                        onChange={(city) => update({ locationCity: city })}
                      />
                      <p className="text-[10px] text-zinc-600 pl-1">
                        Pakistan cities listed — can&apos;t find yours? Type and
                        add it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Disciplines ── */}
              {step === 2 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Your Disciplines
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Select the triathlon legs you want to compete in.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <SelectableCard
                      icon={Waves}
                      label="Swimmer"
                      iconColor="text-cyan-400"
                      selected={form.disciplines.includes("SWIMMER")}
                      onClick={() => toggleDiscipline("SWIMMER")}
                    />
                    <SelectableCard
                      icon={Bike}
                      label="Cyclist"
                      iconColor="text-amber-400"
                      selected={form.disciplines.includes("CYCLIST")}
                      onClick={() => toggleDiscipline("CYCLIST")}
                    />
                    <SelectableCard
                      icon={Footprints}
                      label="Runner"
                      iconColor="text-emerald-400"
                      selected={form.disciplines.includes("RUNNER")}
                      onClick={() => toggleDiscipline("RUNNER")}
                    />
                  </div>

                  <div className="pt-4 h-12 flex justify-center items-center">
                    {form.disciplines.length > 0 ? (
                      <div className="flex flex-wrap gap-2 justify-center">
                        <span className="text-xs text-zinc-500 flex items-center mr-2">
                          Selected:
                        </span>
                        {form.disciplines.map((d) => (
                          <motion.span
                            key={d}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-full"
                          >
                            {formatEnum(d)}
                          </motion.span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600 animate-pulse">
                        Awaiting Selection...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 3: Race Times ── */}
              {step === 3 && (
                <div className="space-y-5 flex flex-col h-full">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Race Times
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Tap a distance to select it, then enter your best time.
                      Short events use{" "}
                      <span className="text-white font-bold">MM:SS</span>,
                      longer events use{" "}
                      <span className="text-white font-bold">H:MM:SS</span>.
                    </p>
                  </div>

                  <div
                    className="space-y-7 overflow-y-auto"
                    style={{ maxHeight: "400px", scrollbarWidth: "none" }}
                  >
                    {form.disciplines.map((disc) => (
                      <RaceDistanceSection
                        key={disc}
                        disc={disc}
                        raceEntries={form.raceEntries}
                        onToggle={toggleRaceDistance}
                        onTimeChange={updateRaceTime}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 4: Experience Level ── */}
              {step === 4 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Experience Level
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Select your current level of competitive racing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    {(
                      [
                        { label: "Beginner", value: ExperienceLevel.BEGINNER },
                        {
                          label: "Intermediate",
                          value: ExperienceLevel.INTERMEDIATE,
                        },
                        { label: "Advanced", value: ExperienceLevel.ADVANCED },
                      ] as const
                    ).map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => update({ experienceLevel: value })}
                        className={`w-full relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all cursor-pointer group overflow-hidden min-h-32 ${
                          form.experienceLevel === value
                            ? "bg-zinc-900 border-zinc-600 shadow-lg scale-[1.02]"
                            : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 hover:scale-[1.01]"
                        }`}
                      >
                        {form.experienceLevel === value && (
                          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        )}
                        <span
                          className={`text-lg font-bold ${form.experienceLevel === value ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}
                        >
                          {label}
                        </span>
                        {form.experienceLevel === value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3"
                          >
                            <CheckCircle2 className="w-5 h-5 text-blue-400" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 5: Achievements ── */}
              {step === 5 && (
                <div className="space-y-5 flex flex-col h-full">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-1">
                      Achievements
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Share your proudest moments. You can skip and add later.
                    </p>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                        Add Achievement
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Title — e.g. Finished my first triathlon"
                      value={achTitle}
                      onChange={(e) => setAchTitle(e.target.value)}
                      className="w-full bg-black border border-zinc-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-all text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional) — e.g. Ironman 70.3 Lahore 2024"
                      value={achDesc}
                      onChange={(e) => setAchDesc(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addAchievement();
                      }}
                      className="w-full bg-black border border-zinc-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-all text-sm"
                    />
                    <button
                      onClick={addAchievement}
                      disabled={!achTitle.trim()}
                      className="w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white hover:border-blue-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div
                    className="space-y-2 max-h-52 overflow-y-auto"
                    style={{ scrollbarWidth: "none" }}
                  >
                    <AnimatePresence>
                      {form.achievements.length === 0 ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center text-xs text-zinc-600 py-6"
                        >
                          No achievements added yet
                        </motion.p>
                      ) : (
                        form.achievements.map((ach, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex items-start gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3"
                          >
                            <Trophy className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">
                                {ach.title}
                              </p>
                              {ach.description && (
                                <p className="text-xs text-zinc-500 mt-0.5 truncate">
                                  {ach.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeAchievement(idx)}
                              className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer shrink-0 mt-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* ── Step 6: Summary ── */}
              {step === 6 && (
                <div className="space-y-6 flex flex-col h-full justify-center">
                  <div className="text-center mb-4">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 15 }}
                      className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle2 className="w-8 h-8 text-blue-400" />
                    </motion.div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Profile Complete
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Review your details before finishing.
                    </p>
                  </div>

                  {state.error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 text-center">
                      {state.message ??
                        "Something went wrong. Please try again."}
                    </div>
                  )}

                  <div
                    className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-1 max-h-80 overflow-y-auto"
                    style={{ scrollbarWidth: "none" }}
                  >
                    <SummaryRow label="Display Name" value={form.displayName} />
                    <SummaryRow label="Location" value={form.locationCity} />
                    <SummaryRow
                      label="Experience"
                      value={formatEnum(form.experienceLevel)}
                    />
                    <SummaryRow
                      label="Disciplines"
                      value={form.disciplines.map(formatEnum).join(", ")}
                    />

                    {form.raceEntries.length > 0 && (
                      <div className="pt-4 mt-2 border-t border-zinc-800/50">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-3 block">
                          Race Times
                        </span>
                        <div className="space-y-2">
                          {form.raceEntries.map((r, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center bg-black/50 px-3 py-2.5 rounded-lg border border-zinc-800/50"
                            >
                              <span className="text-sm text-zinc-300 font-bold">
                                {formatEnum(r.discipline)} · {r.distance}
                              </span>
                              <span className="text-sm font-black text-white">
                                {r.mmss}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {form.achievements.length > 0 && (
                      <div className="pt-4 mt-2 border-t border-zinc-800/50">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-3 block">
                          Achievements
                        </span>
                        <div className="space-y-2">
                          {form.achievements.map((a, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 bg-black/50 px-3 py-2.5 rounded-lg border border-zinc-800/50"
                            >
                              <Trophy className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">
                                  {a.title}
                                </p>
                                {a.description && (
                                  <p className="text-xs text-zinc-500 truncate">
                                    {a.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 pt-6 border-t border-zinc-900 flex items-center justify-between relative z-0">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={isPending}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-sm text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                isStepValid()
                  ? "bg-zinc-100 text-black hover:bg-white cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95"
                  : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onComplete}
              disabled={isPending}
              className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 transition-all bg-blue-500 text-white hover:bg-blue-400 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isPending ? "Saving..." : "Finish Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SelectableCard({
  icon: Icon,
  label,
  iconColor,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  iconColor: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full min-h-35 relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all cursor-pointer group overflow-hidden ${
        selected
          ? "bg-zinc-900 border-zinc-600 shadow-lg scale-[1.02]"
          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 hover:scale-[1.01]"
      }`}
    >
      {selected && (
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      )}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3"
        >
          <CheckCircle2 className="w-5 h-5 text-zinc-400" />
        </motion.div>
      )}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${selected ? "bg-zinc-800" : "bg-zinc-900 group-hover:bg-zinc-800"}`}
      >
        <Icon
          className={`w-6 h-6 ${selected ? iconColor : "text-zinc-500 group-hover:text-zinc-300"}`}
        />
      </div>
      <span
        className={`text-base font-bold ${selected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}
      >
        {label}
      </span>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span className="text-sm font-bold text-right text-zinc-200">
        {value}
      </span>
    </div>
  );
}
