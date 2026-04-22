"use client";

import React, {
  useState,
  useEffect,
  startTransition,
  useActionState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Trophy,
  Waves,
  Bike,
  Footprints,
  Award,
  Share2,
  Check,
  Activity,
  Calendar,
  Gauge,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { getAthleteDataAction } from "../actions/dashboardAction";

// ─── TYPES & MOCKS (Self-contained for Preview) ──────────────────────────────

type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";

interface ActionResponse {
  success: boolean;
  error: boolean;
  message: string | null;
  data: any;
}

// ─── CONFIG ─────────────────────────────────────────────────────────────────

const DISCIPLINE_THEMES: Record<Discipline, any> = {
  SWIMMER: {
    icon: Waves,
    color: "text-cyan-400",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/10",
  },
  CYCLIST: {
    icon: Bike,
    color: "text-blue-400",
    bg: "bg-blue-500/5",
    border: "border-blue-500/10",
  },
  RUNNER: {
    icon: Footprints,
    color: "text-indigo-400",
    bg: "bg-indigo-500/5",
    border: "border-indigo-500/10",
  },
};

const initialState: ActionResponse = {
  success: false,
  error: false,
  message: "",
  data: null,
};

// ─── ANIMATION VARIANTS ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
} as const ;

// ─── UI COMPONENTS ──────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, colorClass, subtitle }: any) => (
  <motion.div
    variants={cardVariants}
    className="p-6 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:border-zinc-700/50 group shadow-sm"
  >
    <div className="flex justify-between items-start">
      <div
        className={`w-10 h-10 rounded-xl ${colorClass.replace("text", "bg")}/10 flex items-center justify-center`}
      >
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      {subtitle && (
        <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-widest">
          {subtitle}
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider mb-1">
        {label}
      </p>
      <h4 className="text-2xl font-bold text-white tracking-tight leading-none">
        {value}
      </h4>
    </div>
  </motion.div>
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function AthleteProfileDashboard({
  usertoken,
}: {
  usertoken: string;
}) {
  const [copied, setCopied] = useState(false);

  // 🔥 Local state for the nested data structure
  const [athleteData, setAthleteData] = useState<any>(null);
  const [profileImg, setProfileImg] = useState<string | null>(null);

  // Initialize Action State
  const [state, dispatcher, isPending] = useActionState<ActionResponse, string>(
    getAthleteDataAction,
    initialState,
  );

  // 1. Fetch data on mount using the usertoken prop
  useEffect(() => {
    if (usertoken) {
      startTransition(() => {
        dispatcher(usertoken);
      });
    }
  }, [usertoken, dispatcher]);

  // 2. Sync successful action response to local useState
  // According to provided structure: state.data.athleteData and state.data.profileImage
  useEffect(() => {
    if (state.success && state.data) {
      setAthleteData(state.data.athleteData);
      setProfileImg(state.data.profileImage);
    }
  }, [state]);

  const handleShare = () => {
    const textArea = document.createElement("textarea");
    textArea.value = window.location.href;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
    document.body.removeChild(textArea);
  };

  // Determine loading state
  const isLoading = isPending && !athleteData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 animate-pulse">
          Retrieving Performance Data
        </p>
      </div>
    );
  }

  // Fallback if no data is found after initial fetch attempt
  if (!athleteData && !isPending) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-zinc-900 mb-4" />
        <h2 className="text-white font-bold text-xl">Profile Not Found</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-xs text-center leading-relaxed">
          We couldn't locate an athlete profile associated with this session.
        </p>
      </div>
    );
  }

  const disciplines = (athleteData?.discipline as Discipline[]) || [];

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans p-6 md:p-10 selection:bg-blue-400/30">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-12"
      >
        {/* ─── HEADER SECTION ─── */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b border-zinc-900">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <img
                src={
                  profileImg ||
                  `https://avatar.vercel.sh/${athleteData?.displayName}`
                }
                className="w-24 h-24 rounded-3xl border border-zinc-800 object-cover grayscale-[0.2] transition-all group-hover:grayscale-0"
                alt="Profile"
              />
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-lg border-2 border-black shadow-lg">
                <Check className="w-3 h-3 stroke-[4px]" />
              </div>
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-3xl font-semibold text-white tracking-tight mb-1 uppercase italic">
                {athleteData?.displayName}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />{" "}
                  {athleteData?.locationCity || "Location Pending"}
                </div>
                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                <div className="flex items-center gap-1.5 text-blue-300">
                  <Activity className="w-3.5 h-3.5" /> Verified Profile
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                {disciplines.map((d) => {
                  const theme = DISCIPLINE_THEMES[d];
                  return theme ? (
                    <span
                      key={d}
                      className={`px-3 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest ${theme.bg} ${theme.color} ${theme.border} flex items-center gap-1.5 shadow-sm transition-colors hover:bg-zinc-800`}
                    >
                      {d}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          <button
            onClick={handleShare}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 shadow-sm active:scale-95 ${
              copied
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white text-black border-white hover:bg-zinc-200"
            }`}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {copied ? "Link Copied" : "Share Profile"}
          </button>
        </div>

        {/* ─── DATA GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ─── PERFORMANCE COLUMN ─── */}
          <div className="lg:col-span-8 space-y-8">
            <section className="space-y-4">
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.25em] px-1">
                Performance Benchmarks
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Swim 100m"
                  value={
                    athleteData?.swimTime100m
                      ? `${athleteData.swimTime100m}s`
                      : "—"
                  }
                  icon={Waves}
                  colorClass="text-cyan-400"
                  subtitle="Pace"
                />
                <StatCard
                  label="Cycle 10km"
                  value={
                    athleteData?.cycleTime10km
                      ? `${athleteData.cycleTime10km}:00`
                      : "—"
                  }
                  icon={Bike}
                  colorClass="text-blue-400"
                  subtitle="Time"
                />
                <StatCard
                  label="Run 5km"
                  value={
                    athleteData?.runTime5km ? `${athleteData.runTime5km}m` : "—"
                  }
                  icon={Footprints}
                  colorClass="text-indigo-400"
                  subtitle="Endurance"
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.25em] px-1">
                Activity Status
              </h3>
              <div className="p-8 bg-zinc-900/10 border border-zinc-800/40 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-8 shadow-sm">
                <div className="w-20 h-20 rounded-full border-4 border-zinc-900 border-t-blue-500 flex items-center justify-center bg-zinc-950 shadow-inner">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white leading-none">
                      {athleteData?.trainingDaysPerWeek}
                    </p>
                    <p className="text-[8px] text-zinc-500 uppercase font-black">
                      Days
                    </p>
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h4 className="text-white font-bold text-lg uppercase tracking-tight italic">
                    Training Consistency
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                    Based on your commitment of{" "}
                    {athleteData?.trainingDaysPerWeek} days a week, your
                    frequency is aligned with{" "}
                    {athleteData?.competitionLevel?.toLowerCase()} standards.
                  </p>
                </div>
                <div className="px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    Active
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* ─── SIDEBAR COLUMN ─── */}
          <div className="lg:col-span-4 space-y-8">
            <section className="space-y-4">
              <h3 className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.25em] px-1">
                Athlete Profile
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <StatCard
                  label="Competition"
                  value={athleteData?.competitionLevel || "—"}
                  icon={Award}
                  colorClass="text-blue-400"
                />
                <StatCard
                  label="Experience"
                  value={athleteData?.experienceLevel || "—"}
                  icon={Gauge}
                  colorClass="text-zinc-400"
                />
              </div>
            </section>

            <motion.div
              variants={cardVariants}
              className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-zinc-500" />
                </div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Last Updated
                </p>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Performance benchmarks are verified bests recorded during
                training sessions.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ─── SUMMARY FOOTER ─── */}
        <motion.div
          variants={cardVariants}
          className="p-10 bg-zinc-900/10 border border-zinc-800/40 rounded-[2.5rem] flex flex-col items-center text-center gap-6 relative overflow-hidden shadow-sm"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-blue-500/20 to-transparent" />
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shadow-inner border border-blue-500/20 text-blue-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="max-w-lg space-y-2">
            <h4 className="text-sm font-semibold text-white uppercase tracking-widest">
              Athlete Summary
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed italic">
              "{athleteData?.displayName || "The athlete"} is a{" "}
              {athleteData?.experienceLevel?.toLowerCase() || "dedicated"}{" "}
              competitor based in {athleteData?.locationCity || "the region"}.
              Operating at a{" "}
              {athleteData?.competitionLevel?.toLowerCase() || "high"} level,
              they maintain a consistent training frequency of{" "}
              {athleteData?.trainingDaysPerWeek || "several"} days per week,
              specializing in{" "}
              {disciplines.length > 0
                ? disciplines.map((d) => d.toLowerCase()).join(" and ")
                : "multisport events"}
              ."
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
