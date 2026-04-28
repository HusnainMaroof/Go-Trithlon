"use client";

import React, {
  startTransition,
  useActionState,
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Waves,
  Bike,
  Footprints,
  Trophy,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Target,
  Users,
  Zap,
  ChevronRight,
  Medal,
  Calendar,
  MapPin,
} from "lucide-react";

import { useStateContext } from "../context/useContext";
import { NoTeamWarningModal, RecruitSlotModal } from "./NoTeamPopu";
import { DashboardSkeleton } from "./Sekeltons";
import { getMainDashboardData } from "../actions/MainDashboardActions";

// ─── Types ───────────────────────────────────────────────────────────────────

const ROLES = ["SWIMMER", "CYCLIST", "RUNNER"] as const;
type Role = (typeof ROLES)[number];

interface RaceResult {
  id: string;
  discipline: Role;
  distance: string;
  timeSeconds: number;
  createdAt: string;
}

interface Achievement {
  id?: string;
  title: string;
  description?: string | null;
}

interface TeamSummaryEntry {
  role: string;
  rawRole: Role;
  filled: boolean;
  isMe: boolean;
  name: string | null;
  profileImage: string | null;
}

interface AthleteData {
  id: string;
  userId: string;
  displayName: string;
  locationCity: string;
  disciplines: Role[];
  raceResults: RaceResult[];
  achievements: Achievement[];
  experienceLevel: string;
  trainingDaysPerWeek: number | null;
  competitionLevel: string | null;
}

interface SuggestionData {
  userToken: string;
  email: string;
  inTeam: boolean;
  isOnboard: boolean;
  profileImage: string | null;
  athleteData: AthleteData;
  matchScore: number;
}

interface TeamData {
  id: string;
  name: string;
  ownerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  members: any[];
}

interface DashboardApiData {
  team: TeamData | null;
  invites: { received: any[]; sent: any[] };
  suggestions: SuggestionData[];
}

interface MappedSuggestion {
  id: string;
  userToken: string; // ← Added for routing
  name: string;
  rawRole: Role;
  role: string;
  pr: string;
  match: string;
  img: string;
  location: string;
  level: string;
  training: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeParts(totalSeconds: number) {
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
}

const formatRole = (role: Role | string): string =>
  role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

// Get the best pace using the new raceResults array
const getBestPace = (athleteData: AthleteData, role: Role): string => {
  const results = athleteData.raceResults?.filter((r) => r.discipline === role);
  if (!results || results.length === 0) return "N/A";

  // Sort to find the fastest time
  const best = results.sort((a, b) => a.timeSeconds - b.timeSeconds)[0];
  const { h, m, s } = formatTimeParts(best.timeSeconds);
  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  return `${timeStr} ${best.distance}`;
};

// ─── Config / Styling ─────────────────────────────────────────────────────────

type DisciplineTheme = {
  icon: React.ElementType;
  color: string;
  colorHex: string;
  bg: string;
  border: string;
};

const DISCIPLINE_THEMES: Record<Role, DisciplineTheme> = {
  SWIMMER: {
    icon: Waves,
    color: "text-cyan-400",
    colorHex: "#22d3ee",
    bg: "bg-cyan-500/[0.05]",
    border: "border-cyan-500/20",
  },
  CYCLIST: {
    icon: Bike,
    color: "text-orange-400",
    colorHex: "#fb923c",
    bg: "bg-orange-500/[0.05]",
    border: "border-orange-500/20",
  },
  RUNNER: {
    icon: Footprints,
    color: "text-lime-400",
    colorHex: "#a3e635",
    bg: "bg-lime-500/[0.05]",
    border: "border-lime-500/20",
  },
};

const initialState = {
  success: false,
  error: false,
  message: null,
  data: null as DashboardApiData | null,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter(); // ← Initialize router
  const { user } = useStateContext();
  const athlete = user?.athleteData as AthleteData | undefined;

  const [state, dispatcher, isPending] = useActionState<any, any>(
    getMainDashboardData,
    initialState,
  );

  useEffect(() => {
    startTransition(() => {
      dispatcher({});
    });
  }, [dispatcher]);

  const [recruitSlot, setRecruitSlot] = useState<Role | null>(null);
  const [showNoTeamWarning, setShowNoTeamWarning] = useState(false);

  // ─── Derived state ──────────────────────────────────────────────────────────

  const userHasTeam = !!state.data?.team?.id;
  const teamData = state.data?.team;
  const userDisciplines: Role[] = (athlete?.disciplines ?? []) as Role[];

  const teamSummary: TeamSummaryEntry[] = ROLES.map((role) => {
    const member = teamData?.members?.find((m: any) => m.role === role) ?? null;
    return {
      role: formatRole(role),
      rawRole: role,
      filled: !!member,
      isMe: member?.user?.userToken === user?.userToken,
      name: member?.user?.name ?? null,
      profileImage: member?.user?.profileImage ?? null,
    };
  });

  const missingRoles = teamSummary.filter((m) => !m.filled);
  const isTeamComplete = missingRoles.length === 0;

  const apiSuggestions = state.data?.suggestions || [];
  const suggestions: MappedSuggestion[] = apiSuggestions.map(
    (s: SuggestionData) => {
      const primaryRole = (s.athleteData.disciplines?.[0] || "SWIMMER") as Role;
      return {
        id: s.athleteData.id,
        userToken: s.userToken, // ← Extracted for routing
        name: s.athleteData.displayName || "Athlete",
        rawRole: primaryRole,
        role: formatRole(primaryRole),
        pr: getBestPace(s.athleteData, primaryRole),
        match: `${s.matchScore}%`,
        img:
          s.profileImage ||
          `https://avatar.vercel.sh/${s.athleteData.displayName || "athlete"}`,
        location: s.athleteData.locationCity || "Unknown",
        level: formatRole(s.athleteData.experienceLevel || "Pending"),
        training: s.athleteData.trainingDaysPerWeek
          ? `${s.athleteData.trainingDaysPerWeek} days/wk`
          : "N/A",
      };
    },
  );

  const missingRolesText = missingRoles.map((r) => r.role).join(" and ");
  const userRolesText = teamSummary
    .filter((m) => m.isMe)
    .map((m) => m.role)
    .join(" and ");
  const specializeText = userRolesText
    ? `You specialize as a ${userRolesText}. `
    : "";

  const handleEmptySlotClick = (rawRole: Role) => {
    if (!userHasTeam) {
      setShowNoTeamWarning(true);
    } else {
      setRecruitSlot(rawRole);
    }
  };

  // UI Helper to match the uploaded image perfectly
  const renderHeroPill = () => {
    const bestRace = athlete?.raceResults?.[0]; // Grab the first/best race
    const expLevel = athlete?.experienceLevel
      ? formatRole(athlete.experienceLevel)
      : "Pending";

    let paceText = "No Race Data";
    if (bestRace) {
      const { h, m, s } = formatTimeParts(bestRace.timeSeconds);
      paceText =
        h > 0
          ? `${h}h ${m}m ${bestRace.distance}`
          : `${m}m ${s}s ${bestRace.distance}`;
    }

    return (
      <div className="flex items-center bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl px-4 py-2.5 shadow-2xl w-fit gap-4">
        {/* Left Side: Time & Distance */}
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-zinc-500" />
          <span className="font-bold text-white text-sm tracking-tight">
            {paceText}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-zinc-800" />

        {/* Right Side: Trophy & Level */}
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-white tracking-tight">
            {expLevel}
          </span>
        </div>
      </div>
    );
  };

  if (isPending && !state.data) {
    return (
      <div className="pt-5">
        <DashboardSkeleton />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-500/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        {/* ── 1. Header ──────────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Overview
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              Welcome back,{" "}
              <span className="text-white font-medium">
                {athlete?.displayName || "Athlete"}
              </span>
              .
            </p>
          </div>

          {/* Fully styled Hero Pill based on user's image */}
          {renderHeroPill()}
        </header>

        {/* ── 2. Status Banner ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border bg-zinc-950 border-zinc-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl"
        >
          <div
            className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-20 ${
              !userHasTeam
                ? "bg-zinc-700"
                : isTeamComplete
                  ? "bg-blue-500"
                  : "bg-amber-500"
            }`}
          />

          <div className="relative z-10 flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border-4 ${
                !userHasTeam
                  ? "bg-zinc-900 border-zinc-800"
                  : isTeamComplete
                    ? "bg-blue-500/10 border-blue-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
              }`}
            >
              {isTeamComplete && userHasTeam ? (
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              ) : (
                <AlertCircle
                  className={`w-8 h-8 ${!userHasTeam ? "text-zinc-500" : "text-amber-400"}`}
                />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white mb-1">
                {!userHasTeam
                  ? "No Team Yet"
                  : isTeamComplete
                    ? "Team Ready"
                    : "Team Not Full"}
              </h2>
              <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                {!userHasTeam
                  ? `${specializeText}Create a team to start recruiting a ${missingRolesText}.`
                  : isTeamComplete
                    ? "Your team is full. You can now sign up for races."
                    : `You need a ${missingRolesText} to finish your team.`}
              </p>
            </div>
          </div>

          <button
            className={`relative z-10 w-full md:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isTeamComplete && userHasTeam
                ? "bg-blue-500 text-white hover:bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                : "bg-zinc-100 text-black hover:bg-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
            }`}
          >
            {!userHasTeam
              ? "Create Team"
              : isTeamComplete
                ? "Find Races"
                : "Find Teammates"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* ── 3. Your Team ───────────────────────────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-500" /> Your Team
              {teamData?.name && (
                <span className="text-zinc-500 text-sm font-medium ml-2">
                  ({teamData.name})
                </span>
              )}
            </h3>
            {userHasTeam && (
              <button className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.2em] cursor-pointer transition-colors">
                Manage Team
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamSummary.map((member) => {
              const theme =
                DISCIPLINE_THEMES[member.rawRole] ||
                DISCIPLINE_THEMES["SWIMMER"];
              const Icon = theme.icon;

              return (
                <div
                  key={member.role}
                  className={`relative p-5 rounded-3xl border transition-all ${
                    member.filled
                      ? "bg-zinc-950 border-zinc-800"
                      : "bg-zinc-950/40 border-zinc-800/60 border-dashed hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                        member.filled
                          ? `${theme.bg} ${theme.border} ${theme.color}`
                          : "bg-zinc-900 border-zinc-800 text-zinc-500"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {member.role}
                    </div>
                    {member.isMe && (
                      <span className="text-[9px] font-black tracking-widest text-zinc-400 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                        YOU
                      </span>
                    )}
                  </div>

                  {member.filled ? (
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 overflow-hidden shadow-xl">
                        {member.profileImage ? (
                          <Image
                            src={member.profileImage}
                            alt={member.name ?? "Athlete"}
                            fill
                            sizes="48px"
                            className="object-cover opacity-80"
                            loading="lazy"
                          />
                        ) : (
                          <Users className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white leading-tight">
                          {member.name ?? "Athlete"}
                        </h4>
                        <p className="text-xs font-medium text-zinc-500 mt-0.5">
                          Joined
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEmptySlotClick(member.rawRole)}
                      className="w-full flex items-center gap-4 group cursor-pointer text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                        <Plus className="w-5 h-5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-400 group-hover:text-white transition-colors">
                          Empty Spot
                        </h4>
                        <p className="text-xs font-medium text-blue-400/80 group-hover:text-blue-400 transition-colors mt-0.5">
                          Tap to search
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. Suggested Matches ────────────────────────────────────────────── */}
        {!isTeamComplete && suggestions.length > 0 && (
          <section className="space-y-5 pt-6 border-t border-zinc-900/50 pb-12">
            <div className="px-1">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" /> Suggested Matches
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Athletes available for your missing{" "}
                <span className="text-zinc-300 font-medium">
                  {missingRolesText}
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {suggestions.map((match: MappedSuggestion) => {
                const theme =
                  DISCIPLINE_THEMES[match.rawRole] ||
                  DISCIPLINE_THEMES["SWIMMER"];
                const MatchIcon = theme.icon;

                return (
                  <div
                    key={match.id}
                    onClick={() =>
                      router.push(
                        `/dashboard/athletes/athletesprofile/${match.userToken}`,
                      )
                    }
                    className="group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60 rounded-3xl transition-all cursor-pointer gap-5 md:gap-4 shadow-xl"
                  >
                    {/* Left: Avatar & Identity */}
                    <div className="flex items-center gap-5 min-w-50">
                      <div className="relative w-14 h-14 rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900 shrink-0">
                        <Image
                          src={match.img}
                          alt={match.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col text-left">
                        <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">
                          {match.name}
                        </h4>
                        <div
                          className={`flex items-center gap-1.5 mt-1.5 text-[10px] font-black uppercase tracking-widest ${theme.color}`}
                        >
                          <MatchIcon className="w-3 h-3" />
                          {match.role}
                          <span className="text-zinc-700 font-normal mx-1">
                            •
                          </span>
                          <span className="text-zinc-400">{match.level}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Stats Row */}
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-x-6 lg:gap-x-10 gap-y-3 flex-1 md:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800/50">
                          <Medal className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">
                            Pace
                          </span>
                          <span className="text-sm font-bold text-zinc-200 leading-none">
                            {match.pr}
                          </span>
                        </div>
                      </div>

                      {match.training !== "N/A" && (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800/50">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">
                              Training
                            </span>
                            <span className="text-sm font-bold text-zinc-200 leading-none">
                              {match.training}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800/50">
                          <MapPin className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">
                            Location
                          </span>
                          <span className="text-sm font-bold text-zinc-200 leading-none">
                            {match.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Score & Action */}
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-800/50 md:border-transparent min-w-30">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                        {match.match} Match
                      </span>
                      <div className="flex w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors">
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4">
              <button className="w-full py-4 rounded-2xl border border-zinc-800 border-dashed bg-zinc-950/50 hover:bg-zinc-900 transition-all text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center justify-center gap-2 cursor-pointer group">
                Load more athletes
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </section>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {recruitSlot && (
          <RecruitSlotModal
            key="recruit-modal"
            slot={recruitSlot}
            onClose={() => setRecruitSlot(null)}
            onClaim={() => {}}
            userDisciplines={userDisciplines}
            user={user}
            isPending={false}
            errorMsg={null}
            FromWhere="MainDashboard"
          />
        )}

        {showNoTeamWarning && (
          <NoTeamWarningModal
            key="warning-modal"
            FromWhere="MainDashboard"
            onClose={() => setShowNoTeamWarning(false)}
            onCreate={() => setShowNoTeamWarning(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
