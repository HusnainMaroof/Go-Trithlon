"use client";

import React, {
  startTransition,
  useActionState,
  useEffect,
  useState,
} from "react";
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
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────────────

const ROLES = ["SWIMMER", "CYCLIST", "RUNNER"] as const;
type Role = (typeof ROLES)[number];

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
  swimTime100m: number | null;
  cycleTime10km: number | null;
  runTime5km: number | null;
  experienceLevel: string;
  trainingDaysPerWeek: number;
  competitionLevel: string;
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

// NEW: Interface for the processed suggestion data to fix the 'any' error
interface MappedSuggestion {
  id: string;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const roleStyles: Record<string, string> = {
  Swimmer: "text-cyan-400 bg-cyan-400/10 border-cyan-500/20",
  Cyclist: "text-amber-400 bg-amber-400/10 border-amber-500/20",
  Runner: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20",
};

const roleIconColor: Record<string, string> = {
  Swimmer: "text-cyan-400",
  Cyclist: "text-amber-400",
  Runner: "text-emerald-400",
};

const RoleIcon: Record<string, React.ElementType> = {
  Swimmer: Waves,
  Cyclist: Bike,
  Runner: Footprints,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRole = (role: Role | string): string =>
  role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

const getBestPace = (athleteData: AthleteData, role: Role): string => {
  if (role === "SWIMMER" && athleteData.swimTime100m)
    return `${athleteData.swimTime100m}s / 100m`;
  if (role === "CYCLIST" && athleteData.cycleTime10km)
    return `${athleteData.cycleTime10km}m / 10k`;
  if (role === "RUNNER" && athleteData.runTime5km)
    return `${athleteData.runTime5km}m / 5k`;
  return "N/A";
};

const initialState = {
  success: false,
  error: false,
  message: null,
  data: null as DashboardApiData | null,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useStateContext();
  const athlete = user?.athleteData;

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

  // Explicitly type the output array to MappedSuggestion[]
  const apiSuggestions = state.data?.suggestions || [];
  const suggestions: MappedSuggestion[] = apiSuggestions.map(
    (s: SuggestionData) => {
      const primaryRole = (s.athleteData.disciplines?.[0] || "SWIMMER") as Role;
      return {
        id: s.athleteData.id,
        name: s.athleteData.displayName || "Athlete",
        rawRole: primaryRole,
        role: formatRole(primaryRole),
        pr: getBestPace(s.athleteData, primaryRole),
        match: `${s.matchScore}%`,
        img: s.profileImage,
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

  const getFormattedPaces = () => {
    if (!athlete) return "Pace Pending";
    const p: string[] = [];
    if (athlete.swimTime100m) p.push(`${athlete.swimTime100m}s 100m`);
    if (athlete.cycleTime10km) p.push(`${athlete.cycleTime10km}m 10k`);
    if (athlete.runTime5km) p.push(`${athlete.runTime5km}m 5k`);
    return p.join(" • ") || "Pace Pending";
  };

  const handleEmptySlotClick = (rawRole: Role) => {
    if (!userHasTeam) {
      setShowNoTeamWarning(true);
    } else {
      setRecruitSlot(rawRole);
    }
  };

  // useEffect(() => {
  //   console.log("from main dashboard",state);
  // }, [state]);

  if (isPending && !state.data)
    return (
      <div className="pt-5">
        <DashboardSkeleton />
      </div>
    );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-500/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        {/* ── 1. Header ──────────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
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

          <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 px-4 shadow-sm w-fit">
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-zinc-500" />
              <span className="font-bold text-white">
                {getFormattedPaces()}
              </span>
            </div>
            <div className="w-px h-4 bg-zinc-800" />
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-zinc-500" />
              <span className="font-bold text-white capitalize">
                {athlete?.experienceLevel?.toLowerCase() || "Pending"}
              </span>
            </div>
          </div>
        </header>

        {/* ── 2. Status Banner ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border bg-zinc-950 border-amber-500/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div
            className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-30 ${
              !userHasTeam
                ? "bg-zinc-700/30"
                : isTeamComplete
                  ? "bg-blue-500"
                  : "bg-amber-500"
            }`}
          />

          <div className="relative z-10 flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                !userHasTeam
                  ? "bg-zinc-900 border-amber-500/20"
                  : isTeamComplete
                    ? "bg-blue-500/10 border-blue-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
              }`}
            >
              {isTeamComplete && userHasTeam ? (
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              ) : (
                <AlertCircle className="w-8 h-8 text-amber-400" />
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
              <p className="text-zinc-400 text-sm max-w-md">
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
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" /> Your Team
              {teamData?.name && (
                <span className="text-zinc-500 text-sm font-medium ml-2">
                  ({teamData.name})
                </span>
              )}
            </h3>
            {userHasTeam && (
              <button className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider cursor-pointer transition-colors">
                Manage Team
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamSummary.map((member) => {
              const Icon = RoleIcon[member.role] || RoleIcon["Swimmer"];
              return (
                <div
                  key={member.role}
                  className={`relative p-5 rounded-2xl border transition-all ${
                    member.filled
                      ? "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                      : "bg-zinc-950/40 border-zinc-800/60 border-dashed hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        roleStyles[member.role] ||
                        "bg-zinc-800 border-zinc-700 text-zinc-300"
                      }`}
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      {member.role}
                    </div>
                    {member.isMe && (
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                        YOU
                      </span>
                    )}
                  </div>

                  {member.filled ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                        {member.profileImage ? (
                          <img
                            src={member.profileImage}
                            alt={member.name ?? "Athlete"}
                            className="w-full h-full object-cover opacity-50"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        ) : (
                          <Users className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white leading-tight">
                          {member.name ?? "Athlete"}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">Joined</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEmptySlotClick(member.rawRole)}
                      className="w-full flex items-center gap-3 group cursor-pointer text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                        <Plus className="w-5 h-5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-400 group-hover:text-white transition-colors">
                          Empty Spot
                        </h4>
                        <p className="text-xs text-blue-400/80 group-hover:text-blue-400 transition-colors mt-0.5">
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
          <section className="space-y-4 pt-4 border-t border-zinc-900 pb-12">
            <div className="px-1">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" /> Suggested Matches
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Athletes available for your missing{" "}
                <span className="text-zinc-300 font-medium">
                  {missingRolesText}
                </span>{" "}
                {missingRoles.length === 1 ? "spot" : "spots"}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Explicitly typed map parameter */}
              {suggestions.map((match: MappedSuggestion) => {
                const MatchIcon = RoleIcon[match.role] || RoleIcon["Swimmer"];
                const iconColor = roleIconColor[match.role] || "text-zinc-400";

                console.log("suggestion ", match?.img);

                return (
                  <div
                    key={match.id}
                    className="group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40 rounded-2xl transition-all cursor-pointer gap-5 md:gap-4"
                  >
                    {/* Left: Avatar & Identity */}
                    <div className="flex items-center gap-4 min-w-50">
                      <Image
                        src={match?.img}
                        alt={match.name}
                        width={56}
                        height={56}
                        className="rounded-full border border-zinc-800 object-cover w-12 h-12 md:w-14 md:h-14"
                        loading="lazy"
                      />
                      <div className="flex flex-col text-left">
                        <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">
                          {match.name}
                        </h4>
                        <div
                          className={`flex items-center gap-1.5 mt-1 text-xs font-semibold ${iconColor}`}
                        >
                          {MatchIcon && <MatchIcon className="w-3.5 h-3.5" />}
                          {match.role}
                          <span className="text-zinc-600 font-normal mx-0.5">
                            •
                          </span>
                          <span className="text-zinc-400 font-medium">
                            {match.level}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Stats Row */}
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-x-6 lg:gap-x-10 gap-y-3 flex-1 md:px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800/50">
                          <Medal className="w-4 h-4 text-amber-400/80" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider leading-none mb-1">
                            Pace
                          </span>
                          <span className="text-sm font-bold text-zinc-200 leading-none">
                            {match.pr}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800/50">
                          <Calendar className="w-4 h-4 text-emerald-400/80" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider leading-none mb-1">
                            Training
                          </span>
                          <span className="text-sm font-bold text-zinc-200 leading-none">
                            {match.training}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800/50">
                          <MapPin className="w-4 h-4 text-rose-400/80" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider leading-none mb-1">
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
                      <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1.5 rounded-md border border-blue-500/20">
                        {match.match} Match
                      </span>
                      <div className="flex w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center group-hover:bg-zinc-800 transition-colors">
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button className="w-full py-4 rounded-xl border border-zinc-800 border-dashed bg-zinc-950/50 hover:bg-zinc-900 transition-all text-sm font-bold text-zinc-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer group">
                Show more athletes
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
