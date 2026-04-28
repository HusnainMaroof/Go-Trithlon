"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useActionState,
  startTransition,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Trophy,
  Waves,
  Bike,
  Footprints,
  UserPlus,
  Eye,
  CheckCircle2,
  Zap,
  Lock,
  Search,
  Timer,
} from "lucide-react";
import { getAllAthlete } from "../actions/dashboardAction";
import { useStateContext } from "../context/useContext";
import InviteAthleteModal from "./InviteAthleteModel";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";

interface RaceResult {
  id?: string;
  discipline: Discipline;
  distance: string;
  timeSeconds: number;
}

type ActionResponse = {
  success: boolean;
  error: boolean;
  message: string | null;
  data: {
    athletes: RawAthlete[];
    sentInvites: SentInviteEntry[];
    missingSlots: Discipline[];
    hasTeam: boolean;
  } | null;
};

type RawAthlete = {
  userToken: string;
  email: string;
  name: string | null;
  inTeam: boolean;
  isOnboard: boolean;
  profileImage: string | null;
  athleteData: {
    id: string;
    userId: string;
    displayName: string | null;
    locationCity: string | null;
    disciplines: Discipline[];
    raceResults?: RaceResult[];
    experienceLevel: string | null;
    trainingDaysPerWeek: number | null;
    competitionLevel: string | null;
  };
};

type SentInviteEntry = {
  toUserId: string;
  role: string;
  id: string;
};

export type FlatAthlete = {
  id: string;
  userId: string;
  userToken: string;
  email: string;
  displayName: string;
  inTeam: boolean;
  isOnboard: boolean;
  profileImage: string | null;
  locationCity: string | null;
  disciplines: Discipline[];
  raceResults: RaceResult[];
  experienceLevel: string | null;
  trainingDaysPerWeek: number | null;
  competitionLevel: string | null;
  invitedRoles: Discipline[];
};

type DisciplineConfig = {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
};

// ─── CONFIG ──────────────────────────────────────────────────────────────────

export const DISCIPLINE_CONFIG: Record<Discipline, DisciplineConfig> = {
  SWIMMER: {
    label: "SWIMMER",
    icon: Waves,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  CYCLIST: {
    label: "CYCLIST",
    icon: Bike,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  RUNNER: {
    label: "RUNNER",
    icon: Footprints,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
};

const ALL_DISCIPLINES: Discipline[] = ["SWIMMER", "CYCLIST", "RUNNER"];

const initialState: ActionResponse = {
  success: false,
  error: false,
  message: null,
  data: null,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const flattenAthlete = (raw: RawAthlete): Omit<FlatAthlete, "invitedRoles"> => {
  const a = raw.athleteData;
  return {
    id: a.id,
    userId: a.userId,
    userToken: raw.userToken,
    email: raw.email,
    displayName:
      a.displayName?.trim() ||
      raw.name?.trim() ||
      raw.email?.split("@")[0] ||
      "Athlete",
    inTeam: raw.inTeam,
    isOnboard: raw.isOnboard,
    profileImage: raw.profileImage?.trim() || null,
    locationCity: a.locationCity,
    disciplines: Array.isArray(a.disciplines) ? a.disciplines : [],
    raceResults: Array.isArray(a.raceResults) ? a.raceResults : [],
    experienceLevel: a.experienceLevel,
    trainingDaysPerWeek: a.trainingDaysPerWeek,
    competitionLevel: a.competitionLevel,
  };
};

const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=18181b&color=ffffff&size=128&bold=true`;

function formatTimeParts(totalSeconds: number) {
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
}

const getBestPace = (raceResults: RaceResult[], role: Discipline): string => {
  const results = raceResults.filter((r) => r.discipline === role);
  if (!results.length) return "No Data";
  const best = results.sort((a, b) => a.timeSeconds - b.timeSeconds)[0];
  const { h, m, s } = formatTimeParts(best.timeSeconds);
  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  return `${timeStr} / ${best.distance}`;
};

// ─── SHIMMER ─────────────────────────────────────────────────────────────────

const Shimmer = () => (
  <motion.div
    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent z-10"
    animate={{ translateX: ["-100%", "200%"] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
  />
);

// ─── ATHLETE CARD ─────────────────────────────────────────────────────────────

type ButtonState = "unavailable" | "invited" | "no_slot" | "invitable";

const AthleteCard = ({
  athlete,
  missingSlots,
  onInvite,
}: {
  athlete: FlatAthlete;
  missingSlots: Discipline[];
  onInvite: (a: FlatAthlete) => void;
}) => {
  const primaryDiscipline = athlete.disciplines[0] || "SWIMMER";
  const theme = DISCIPLINE_CONFIG[primaryDiscipline];

  const [imgSrc, setImgSrc] = useState(
    athlete.profileImage || avatarUrl(athlete.displayName),
  );

  const invitableRoles = athlete.disciplines.filter((d) =>
    missingSlots.includes(d),
  );
  const fullyInvited =
    invitableRoles.length > 0 &&
    invitableRoles.every((d) => athlete.invitedRoles.includes(d));

  const btnState: ButtonState = (() => {
    if (athlete.inTeam) return "unavailable";
    if (fullyInvited) return "invited";
    if (invitableRoles.length === 0) return "no_slot";
    return "invitable";
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`group relative bg-[#0a0a0a] border rounded-[2rem] p-6 flex flex-col gap-5 transition-all duration-300 shadow-2xl overflow-hidden ${
        btnState === "unavailable" || btnState === "no_slot"
          ? "border-zinc-800/80 opacity-80"
          : btnState === "invited"
            ? "border-amber-500/30 bg-amber-500/[0.02]"
            : `border-zinc-800 hover:${theme.border} hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]`
      }`}
    >
      {/* Decorative Background Glow based on primary discipline */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 blur-[60px] rounded-full pointer-events-none opacity-20 ${theme.bg.replace("/10", "")}`}
      />

      {/* Top Row: Avatar & Status */}
      <div className="flex justify-between items-start relative z-10">
        <div className="relative w-16 h-16 rounded-2xl border-2 border-zinc-800 bg-zinc-900 overflow-hidden shadow-lg group-hover:border-zinc-600 transition-colors">
          <Image
            src={imgSrc}
            alt={athlete.displayName}
            fill
            sizes="64px"
            className="object-cover"
            loading="lazy"
            onError={() => setImgSrc(avatarUrl(athlete.displayName))}
          />
        </div>

        <div className="flex flex-col items-end gap-2">
          {athlete.inTeam ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
              <Lock className="w-3 h-3 text-red-400" />
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">
                In Team
              </span>
            </div>
          ) : fullyInvited ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <CheckCircle2 className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                Invited
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                Free Agent
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Identity & Location */}
      <div className="relative z-10">
        <h3 className="text-xl font-black text-white tracking-tight leading-none truncate group-hover:text-zinc-200 transition-colors">
          {athlete.displayName}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider truncate">
              {athlete.locationCity ?? "Unknown"}
            </span>
          </div>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
            {athlete.experienceLevel ?? "Lvl Pending"}
          </span>
        </div>
      </div>

      {/* Primary Stat Display */}
      {athlete.raceResults.length > 0 && (
        <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 relative z-10">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${theme.bg} ${theme.color} ${theme.border}`}
          >
            <Timer className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">
              Best {theme.label} Pace
            </span>
            <span className="text-sm font-bold text-white leading-none tabular-nums tracking-tight">
              {getBestPace(athlete.raceResults, primaryDiscipline)}
            </span>
          </div>
        </div>
      )}

      {/* Discipline Pills */}
      <div className="flex flex-wrap gap-2 mt-auto relative z-10">
        {athlete.disciplines.map((d) => {
          const cfg = DISCIPLINE_CONFIG[d];
          const Icon = cfg.icon;
          const hasPendingInvite = athlete.invitedRoles.includes(d);
          return (
            <div
              key={d}
              className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${cfg.bg} ${cfg.color} ${cfg.border}`}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
              {hasPendingInvite && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 relative z-10">
        <button
          onClick={() => btnState === "invitable" && onInvite(athlete)}
          disabled={btnState !== "invitable"}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md ${
            btnState === "unavailable" || btnState === "no_slot"
              ? "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed"
              : btnState === "invited"
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 cursor-not-allowed"
                : "bg-white text-black border border-white hover:bg-zinc-200 active:scale-95 cursor-pointer"
          }`}
        >
          {btnState === "unavailable" ? (
            "Unavailable"
          ) : btnState === "invited" ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Invited
            </>
          ) : btnState === "no_slot" ? (
            "Slot Filled"
          ) : (
            <>
              <UserPlus className="w-4 h-4" /> Invite
            </>
          )}
        </button>

        <Link href={`/dashboard/athletes/athletesprofile/${athlete.userToken}`}>
          <button className="h-full px-4 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:text-white hover:border-zinc-600 hover:bg-zinc-800 transition-all shadow-md cursor-pointer">
            <Eye className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
};

// ─── SKELETON CARDS ──────────────────────────────────────────────────────────

const SkeletonGrid = () => (
  <motion.div
    key="loading"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
  >
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="h-[320px] bg-zinc-950 border border-zinc-800/80 rounded-[2rem] relative overflow-hidden flex flex-col p-6 shadow-2xl"
      >
        <Shimmer />
        <div className="flex justify-between items-start mb-6">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800" />
          <div className="w-16 h-5 bg-zinc-900 rounded-md border border-zinc-800" />
        </div>
        <div className="w-3/4 h-6 bg-zinc-900 rounded-lg mb-3" />
        <div className="w-1/2 h-4 bg-zinc-900 rounded-md mb-6" />
        <div className="w-full h-12 bg-zinc-900 rounded-xl mb-auto" />
        <div className="flex gap-3 pt-4">
          <div className="flex-1 h-11 bg-zinc-900 rounded-xl" />
          <div className="w-14 h-11 bg-zinc-900 rounded-xl" />
        </div>
      </div>
    ))}
  </motion.div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function AthleteMarketplace() {
  const { user } = useStateContext();
  const [state, dispatcher, isPending] = useActionState<ActionResponse>(
    getAllAthlete as any,
    initialState,
  );

  const [filter, setFilter] = useState<Discipline | "ALL">("ALL");
  const [inviteTarget, setInviteTarget] = useState<FlatAthlete | null>(null);

  useEffect(() => {
    startTransition(() => {
      dispatcher();
    });
  }, []);

  const rawAthletes = state.data?.athletes ?? [];
  const sentInvites: SentInviteEntry[] = state.data?.sentInvites ?? [];
  const missingSlots: Discipline[] = state.data?.missingSlots ?? [];
  const hasTeam: boolean = state.data?.hasTeam ?? false;

  const sentInviteMap = useMemo(() => {
    const map = new Map<string, Set<Discipline>>();
    for (const inv of sentInvites) {
      if (!map.has(inv.toUserId)) map.set(inv.toUserId, new Set());
      map.get(inv.toUserId)!.add(inv.role as Discipline);
    }
    return map;
  }, [sentInvites]);

  const athletes: FlatAthlete[] = useMemo(() => {
    if (!Array.isArray(rawAthletes)) return [];
    return rawAthletes
      .map(flattenAthlete)
      .filter((a) => a.userToken !== user?.userToken)
      .map((a) => ({
        ...a,
        invitedRoles: Array.from(sentInviteMap.get(a.userId) ?? []).filter(
          (r): r is Discipline => a.disciplines.includes(r),
        ),
      }));
  }, [rawAthletes, user?.userToken, sentInviteMap]);

  const filteredAthletes = useMemo(() => {
    if (filter === "ALL") return athletes;
    return athletes.filter((a) => a.disciplines.includes(filter));
  }, [athletes, filter]);

  const handleInviteSent = () => {
    setInviteTarget(null);
    startTransition(() => {
      dispatcher();
    });
  };

  // useEffect(() => {
  //   console.log("from athlete Market", state.data);
  // }, [state]);
  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans p-4 sm:p-6 md:p-12 overflow-x-hidden selection:bg-blue-500/30 relative">
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-blue-600/[0.04] blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vh] bg-emerald-600/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800/80 rounded-lg text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 shadow-[0_5px_15px_rgba(0,0,0,0.4)]">
              <Zap className="w-3.5 h-3.5 fill-blue-400" /> Performance Lab
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white tracking-tighter uppercase italic leading-[0.85]">
              Recruit Your <br />
              <span
                className="text-transparent"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.5)" }}
              >
                Squad
              </span>
            </h1>
            <p className="text-zinc-500 text-xs font-bold max-w-md leading-relaxed uppercase tracking-widest opacity-80">
              Browse the premium network of verified endurance athletes. Select
              candidates that fill your missing team slots.
            </p>
          </div>

          {/* Discipline filter */}
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-1.5 flex flex-wrap gap-1 shadow-2xl">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                filter === "ALL"
                  ? "bg-white text-black shadow-xl"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent"
              }`}
            >
              All Athletes
            </button>
            {ALL_DISCIPLINES.map((d) => (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  filter === d
                    ? "bg-white text-black shadow-xl"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent"
                }`}
              >
                {DISCIPLINE_CONFIG[d].label}
              </button>
            ))}
          </div>
        </header>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {isPending && !state.data ? (
            <SkeletonGrid key="skeleton" />
          ) : filteredAthletes.length > 0 ? (
            <motion.div
              key="grid"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {filteredAthletes.map((athlete) => (
                  <AthleteCard
                    key={athlete.id}
                    athlete={athlete}
                    missingSlots={missingSlots}
                    onInvite={setInviteTarget}
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
              className="py-32 flex flex-col items-center text-center gap-5 bg-zinc-950/40 border border-zinc-800/50 rounded-[3rem] shadow-2xl"
            >
              <div className="w-20 h-20 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center border border-zinc-800 shadow-2xl mb-2">
                <Search className="w-8 h-8 text-zinc-600" />
              </div>
              <h4 className="text-2xl font-black text-white tracking-tight">
                No Athletes Found
              </h4>
              <p className="text-zinc-500 text-sm font-medium max-w-sm leading-relaxed">
                No athletes matching this discipline filter right now. Try
                adjusting your search criteria.
              </p>
              <button
                onClick={() => setFilter("ALL")}
                className="mt-4 px-8 py-3.5 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer shadow-lg active:scale-95"
              >
                Clear Filter
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] p-12 bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-zinc-800/80 flex flex-col items-center text-center gap-6 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 shadow-inner">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="max-w-lg space-y-3">
            <h3 className="text-2xl font-black text-white uppercase tracking-wider italic">
              Athlete Ecosystem
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">
              Access verified performance data and direct recruiter channels.
              Invitation requests are subject to availability.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Invite modal */}
      <AnimatePresence>
        {inviteTarget && (
          <InviteAthleteModal
            key="invite-modal"
            inviteTarget={inviteTarget}
            missingSlots={missingSlots}
            hasTeam={hasTeam}
            onClose={() => setInviteTarget(null)}
            onInviteSent={handleInviteSent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
