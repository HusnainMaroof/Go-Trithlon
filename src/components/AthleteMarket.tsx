"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useActionState,
  startTransition,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  MapPin,
  Trophy,
  Waves,
  Bike,
  Footprints,
  UserPlus,
  Eye,
  CheckCircle2,
  X,
  Shield,
  Loader2,
  Activity,
  Zap,
  Clock,
  Calendar,
  Lock,
  Search,
} from "lucide-react";
import { getAllAthlete } from "../actions/dashboardAction";

// ─── TYPES & CONFIG ─────────────────────────────────────────────────────────

type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";

export type ActionResponse = {
  success: boolean;
  error: boolean;
  message: string | null;
  data: any | null;
};

const DISCIPLINE_CONFIG: Record<Discipline, any> = {
  SWIMMER: {
    label: "Swim",
    icon: Waves,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-500/30",
  },
  CYCLIST: {
    label: "Bike",
    icon: Bike,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-500/30",
  },
  RUNNER: {
    label: "Run",
    icon: Footprints,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-500/30",
  },
};

const ALL_DISCIPLINES: Discipline[] = ["SWIMMER", "CYCLIST", "RUNNER"];

// ─── MOCKS FOR PREVIEW ENVIRONMENT ──────────────────────────────────────────


const Shimmer = () => (
  <motion.div
    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent z-10"
    animate={{ translateX: ["-100%", "200%"] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
  />
);

const AthleteCard = ({ athlete, onInvite, onView }: any) => {
  const isUnavailable = athlete.inTeam;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`group relative bg-[#0a0a0a] border rounded-[1.25rem] p-5 flex flex-col gap-5 transition-all duration-300 shadow-xl ${
        isUnavailable
          ? "border-zinc-800 opacity-75"
          : "border-zinc-800 hover:border-blue-500/40 hover:shadow-blue-900/10"
      }`}
    >
      {/* Top Header Row */}
      <div className="flex justify-between items-start">
        <div className="relative">
          {!isUnavailable && (
            <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          )}
          <img
            src={
              athlete.profileImage ||
              `https://ui-avatars.com/api/?name=${athlete.displayName || athlete.name}&background=18181b&color=fff`
            }
            className={`w-14 h-14 rounded-2xl border border-zinc-700 object-cover relative z-10 transition-all duration-500 shadow-lg ${isUnavailable ? "grayscale opacity-70" : "grayscale group-hover:grayscale-0"}`}
            alt={athlete.displayName || athlete.name}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          {!isUnavailable && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-lg p-0.5 border-2 border-[#0a0a0a] z-20 shadow-lg">
              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
            {athlete.experienceLevel}
          </div>
          {isUnavailable ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
              <Lock className="w-2.5 h-2.5 text-red-400" />
              <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest">
                In Team
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-1.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                Free Agent
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info Row */}
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight leading-none group-hover:text-blue-300 transition-colors truncate">
          {athlete.displayName || athlete.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-2">
          <MapPin className="w-3 h-3 text-zinc-500" />
          <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight truncate">
            {athlete.locationCity || "Unknown Location"}
          </span>
        </div>
      </div>

      {/* Disciplines */}
      <div className="flex flex-wrap gap-1.5">
        {athlete?.disciplines?.map((d: Discipline) => {
          const cfg = DISCIPLINE_CONFIG[d];
          if (!cfg) return null;
          const Icon = cfg.icon;
          return (
            <div
              key={d}
              className={`px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-wider ${cfg.bg} ${cfg.color} ${cfg.border} flex items-center gap-1 shadow-sm`}
            >
              <Icon className="w-2.5 h-2.5" /> {cfg.label}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 mt-auto pt-2">
        <button
          onClick={() => !isUnavailable && onInvite(athlete)}
          disabled={isUnavailable}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md ${
            isUnavailable
              ? "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed"
              : "bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white hover:border-blue-400 active:scale-95 cursor-pointer"
          }`}
        >
          {isUnavailable ? (
            "Unavailable"
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </>
          )}
        </button>
        <button
          onClick={() => onView(athlete.id)}
          className="flex items-center justify-center px-3.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:text-white hover:border-zinc-600 hover:bg-zinc-800 transition-all shadow-md cursor-pointer"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const initialState: ActionResponse = {
  success: false,
  error: false,
  message: null,
  data: null,
};

export default function AthleteMarketplace() {
  const [state, dispatcher, isPending] = useActionState<ActionResponse>(
    getAllAthlete,
    initialState,
  );

  const [filter, setFilter] = useState<Discipline | "ALL">("ALL");
  const [inviteTarget, setInviteTarget] = useState<any>(null);

  // Fetch data on mount
  useEffect(() => {
    startTransition(() => {
      dispatcher();
    });
  }, []);

  const athletes = state.data || [];

  const filteredAthletes = useMemo(() => {
    return athletes.filter((a: any) => {
      return filter === "ALL" || a.disciplines?.includes(filter);
    });
  }, [athletes, filter]);

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-400 font-sans p-4 sm:p-6 md:p-12 overflow-x-hidden selection:bg-blue-500/30 relative">
      {/* Background Decor */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* ─── HEADER ─── */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0a0a0a] border border-zinc-800 rounded-lg text-[9px] font-black uppercase tracking-[0.25em] text-blue-400 shadow-[0_5px_15px_rgba(0,0,0,0.4)]">
              <Zap className="w-3 h-3 fill-blue-400" /> Performance Lab
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tighter uppercase italic leading-[0.85]">
              Recruit Your <br />
              <span
                className="text-transparent"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}
              >
                Squad
              </span>
            </h1>
            <p className="text-zinc-500 text-[11px] font-bold max-w-xs leading-relaxed uppercase tracking-widest opacity-80">
              Browse the premium network of verified endurance athletes.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-1.5 flex flex-wrap gap-1 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${filter === "ALL" ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-zinc-300 border border-transparent"}`}
            >
              All
            </button>
            {ALL_DISCIPLINES.map((d) => (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${filter === d ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-zinc-300 border border-transparent"}`}
              >
                {DISCIPLINE_CONFIG[d].label}
              </button>
            ))}
          </div>
        </header>

        {/* ─── DATA GRID ─── */}
        <AnimatePresence mode="wait">
          {isPending && !state.data ? (
            // Animated Skeleton Loader
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="h-[260px] bg-zinc-900/30 border border-zinc-800/80 rounded-[1.25rem] relative overflow-hidden flex flex-col p-5"
                >
                  <Shimmer />
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-14 h-14 bg-zinc-800/50 rounded-2xl" />
                    <div className="w-16 h-4 bg-zinc-800/50 rounded" />
                  </div>
                  <div className="w-3/4 h-5 bg-zinc-800/50 rounded mb-2" />
                  <div className="w-1/2 h-3 bg-zinc-800/50 rounded mb-5" />
                  <div className="flex gap-2 mb-auto">
                    <div className="w-12 h-6 bg-zinc-800/50 rounded" />
                    <div className="w-12 h-6 bg-zinc-800/50 rounded" />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <div className="flex-1 h-9 bg-zinc-800/50 rounded-xl" />
                    <div className="w-12 h-9 bg-zinc-800/50 rounded-xl" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : filteredAthletes.length > 0 ? (
            // Live Grid with Layout Animations
            <motion.div
              key="grid"
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              <AnimatePresence>
                {filteredAthletes.map((athlete: any) => (
                  <AthleteCard
                    key={athlete.id}
                    athlete={athlete}
                    onInvite={setInviteTarget}
                    onView={(id: string) => console.log("Profile", id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            // Empty State
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-32 flex flex-col items-center text-center gap-4 bg-zinc-950/30 border border-zinc-800/50 rounded-[2rem]"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-2xl mb-2">
                <Search className="w-6 h-6 text-zinc-600" />
              </div>
              <h4 className="text-xl font-bold text-white tracking-tight">
                No Athletes Found
              </h4>
              <p className="text-zinc-500 text-sm max-w-sm">
                There are currently no athletes matching your specific
                discipline filter. Try broadening your search.
              </p>
              <button
                onClick={() => setFilter("ALL")}
                className="mt-2 px-6 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── FOOTER BANNER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[2rem] p-10 bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-zinc-800 flex flex-col items-center text-center gap-5 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 shadow-inner">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="max-w-lg space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-wider italic">
              Athlete Ecosystem
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">
              Access verified performance data and direct recruiter channels.
              Invitation requests are subject to availability.
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── INVITE MODAL ─── */}
      <AnimatePresence>
        {inviteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInviteTarget(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[#0a0a0a] border border-zinc-800 p-8 rounded-[2rem] w-full max-w-sm shadow-[0_50px_100px_rgba(0,0,0,1)]"
            >
              <button
                onClick={() => setInviteTarget(null)}
                className="absolute top-5 right-5 p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center mt-2 relative z-10">
                <div className="relative mb-5">
                  <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                  <img
                    src={
                      inviteTarget.profileImage ||
                      `https://ui-avatars.com/api/?name=${inviteTarget.displayName || inviteTarget.name}&background=18181b&color=fff`
                    }
                    className="w-20 h-20 rounded-full border-2 border-zinc-700 shadow-2xl relative z-10 object-cover"
                    alt={inviteTarget.displayName}
                  />
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight">
                  Draft {inviteTarget.displayName || inviteTarget.name}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3 mb-6">
                  {inviteTarget.disciplines.map((d: Discipline) => (
                    <span
                      key={d}
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${DISCIPLINE_CONFIG[d]?.bg} ${DISCIPLINE_CONFIG[d]?.color} ${DISCIPLINE_CONFIG[d]?.border}`}
                    >
                      {DISCIPLINE_CONFIG[d]?.label}
                    </span>
                  ))}
                </div>

                {/* Athlete Stats Grid */}
                <div className="grid grid-cols-2 gap-3 w-full mb-8">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center">
                    <Trophy className="w-4 h-4 text-amber-400 mb-1" />
                    <span className="text-[10px] uppercase font-bold text-zinc-500">
                      Experience
                    </span>
                    <span className="text-sm font-bold text-white capitalize">
                      {inviteTarget.experienceLevel?.toLowerCase()}
                    </span>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-[10px] uppercase font-bold text-zinc-500">
                      Training
                    </span>
                    <span className="text-sm font-bold text-white">
                      {inviteTarget.trainingDaysPerWeek} Days/Wk
                    </span>
                  </div>

                  {/* Paces (Only show if they exist) */}
                  {inviteTarget.swimTime100m && (
                    <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex justify-between items-center px-4">
                      <span className="text-[11px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                        <Waves className="w-3.5 h-3.5 text-cyan-400" /> Swim
                        Pace
                      </span>
                      <span className="text-sm font-bold text-white">
                        {inviteTarget.swimTime100m}s / 100m
                      </span>
                    </div>
                  )}
                  {inviteTarget.cycleTime10km && (
                    <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex justify-between items-center px-4">
                      <span className="text-[11px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                        <Bike className="w-3.5 h-3.5 text-amber-400" /> Bike
                        Pace
                      </span>
                      <span className="text-sm font-bold text-white">
                        {inviteTarget.cycleTime10km}m / 10k
                      </span>
                    </div>
                  )}
                  {inviteTarget.runTime5km && (
                    <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex justify-between items-center px-4">
                      <span className="text-[11px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                        <Footprints className="w-3.5 h-3.5 text-emerald-400" />{" "}
                        Run Pace
                      </span>
                      <span className="text-sm font-bold text-white">
                        {inviteTarget.runTime5km}m / 5k
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    console.log("Inviting:", inviteTarget.id);
                    setInviteTarget(null);
                  }}
                  className="w-full py-4 bg-white hover:bg-zinc-200 text-black rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Send Invitation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
