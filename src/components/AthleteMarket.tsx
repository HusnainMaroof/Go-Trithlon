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
import { useStateContext } from "../context/useContext";
import InviteAthleteModel from "./InviteAthleteModel";
import Link from "next/link";
import { redirect } from "next/navigation";

// ─── TYPES & CONFIG ─────────────────────────────────────────────────────────

type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";

export type ActionResponse = {
  success: boolean;
  error: boolean;
  message: string | null;
  data: any | null;
};

// Flat athlete shape used throughout the component
type FlatAthlete = {
  id: string;
  userId: string;
  userToken: string;
  email: string;
  name: string;
  displayName: string;
  inTeam: boolean;
  isOnboard: boolean;
  profileImage: string | null;
  locationCity: string | null;
  disciplines: Discipline[];
  swimTime100m: number | null;
  cycleTime10km: number | null;
  runTime5km: number | null;
  experienceLevel: string | null;
  trainingDaysPerWeek: number | null;
  competitionLevel: string | null;
};

export const DISCIPLINE_CONFIG: Record<Discipline, any> = {
  SWIMMER: {
    label: "SWIMMER",
    icon: Waves,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-500/30",
  },
  CYCLIST: {
    label: "CYCLIST",
    icon: Bike,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-500/30",
  },
  RUNNER: {
    label: "RUNNER",
    icon: Footprints,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-500/30",
  },
};

const ALL_DISCIPLINES: Discipline[] = ["SWIMMER", "CYCLIST", "RUNNER"];

/**
 * Normalize raw API response into a flat shape the component can use directly.
 * The API returns { userToken, email, inTeam, profileImage, athleteData: { ... } }
 * This merges athleteData up to the top level so every field is directly accessible.
 */
const flattenAthlete = (raw: any): FlatAthlete => {
  const a = raw.athleteData ?? {};

  // Priority: athleteData.displayName → user.name → email prefix → fallback
  const resolvedName =
    a.displayName?.trim() ||
    raw.name?.trim() ||
    raw.email?.split("@")[0] ||
    "Athlete";

  // Profile image: use Google photo if present, else null (card generates avatar)
  const resolvedImage = raw.profileImage?.trim() || null;

  return {
    // identity
    id: a.id ?? "",
    userId: a.userId ?? "",
    userToken: raw.userToken ?? "",
    email: raw.email ?? "",
    name: resolvedName,
    displayName: resolvedName,

    // status
    inTeam: raw.inTeam ?? false,
    isOnboard: raw.isOnboard ?? false,

    // profile
    profileImage: resolvedImage,
    locationCity: a.locationCity ?? null,
    disciplines: Array.isArray(a.disciplines) ? a.disciplines : [],

    // performance
    swimTime100m: a.swimTime100m ?? null,
    cycleTime10km: a.cycleTime10km ?? null,
    runTime5km: a.runTime5km ?? null,

    // meta
    experienceLevel: a.experienceLevel ?? null,
    trainingDaysPerWeek: a.trainingDaysPerWeek ?? null,
    competitionLevel: a.competitionLevel ?? null,
  };
};

// ─── SHIMMER ────────────────────────────────────────────────────────────────

const Shimmer = () => (
  <motion.div
    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent z-10"
    animate={{ translateX: ["-100%", "200%"] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
  />
);

// ─── ATHLETE CARD ────────────────────────────────────────────────────────────

const AthleteCard = ({
  athlete,
  onInvite,
  onView,
}: {
  athlete: FlatAthlete;
  onInvite: (a: FlatAthlete) => void;
  onView: (id: string) => void;
}) => {
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
              `https://ui-avatars.com/api/?name=${encodeURIComponent(athlete.displayName)}&background=18181b&color=ffffff&size=128&bold=true`
            }
            className={`w-14 h-14 rounded-full border border-zinc-700 object-cover relative z-10 transition-all duration-500 shadow-lg ${
              isUnavailable
                ? " opacity-70"
                : "grayscale group-hover:grayscale-0"
            }`}
            alt={athlete.displayName}
            onError={(e) => {
              // fallback to generated avatar if image URL is broken
              const target = e.currentTarget;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(athlete.displayName)}&background=18181b&color=ffffff&size=128&bold=true`;
              target.onerror = null; // prevent infinite loop
            }}
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
            {athlete.experienceLevel ?? "—"}
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
          {athlete.displayName}
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
        {athlete.disciplines.map((d: Discipline) => {
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
          onClick={() =>
            redirect(
              `/dashboard/athletes/athletesprofile/${athlete?.userToken}`,
            )
          }
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
  const { user } = useStateContext();
  const [state, dispatcher, isPending] = useActionState<ActionResponse>(
    getAllAthlete,
    initialState,
  );

  const [filter, setFilter] = useState<Discipline | "ALL">("ALL");
  const [inviteTarget, setInviteTarget] = useState<FlatAthlete | null>(null);

  // Fetch on mount
  useEffect(() => {
    startTransition(() => {
      dispatcher();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Flatten raw API data once, filter out the current logged-in user by userToken
  const athletes: FlatAthlete[] = useMemo(() => {
    if (!Array.isArray(state.data)) return [];
    return state.data
      .map(flattenAthlete)
      .filter((a) => a.userToken !== user?.userToken);
  }, [state.data, user?.userToken]);

  const filteredAthletes = useMemo(() => {
    if (filter === "ALL") return athletes;
    return athletes.filter((a) => a.disciplines.includes(filter));
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
              className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                filter === "ALL"
                  ? "bg-white text-black shadow-xl"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              All
            </button>
            {ALL_DISCIPLINES.map((d) => (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                  filter === d
                    ? "bg-white text-black shadow-xl"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                {DISCIPLINE_CONFIG[d].label}
              </button>
            ))}
          </div>
        </header>

        {/* ─── DATA GRID ─── */}
        <AnimatePresence mode="wait">
          {isPending && !state.data ? (
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
            <motion.div
              key="grid"
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              <AnimatePresence>
                {filteredAthletes.map((athlete) => (
                  <AthleteCard
                    key={athlete.id}
                    athlete={athlete}
                    onInvite={setInviteTarget}
                    onView={(id) => console.log("Profile", id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
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
          <InviteAthleteModel
            setInviteTarget={setInviteTarget}
            inviteTarget={inviteTarget}
            DISCIPLINE_CONFIG={DISCIPLINE_CONFIG}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
