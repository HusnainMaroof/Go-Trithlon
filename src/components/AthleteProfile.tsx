"use client";

import React, {
  useState,
  useEffect,
  startTransition,
  useActionState,
} from "react";
import Image from "next/image";
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
  Gauge,
  AlertCircle,
  Loader2,
  Clock,
  ChevronRight,
  Timer,
  Medal,
  Star,
  Zap,
  UserPlus,
} from "lucide-react";

import AddAchievementForm from "./AddAchievementForm";
// ← IMPORT MODAL
import { useStateContext } from "../context/useContext";
import { getAthleteDataAction } from "../actions/getAthleteAction";
import InviteAthleteModal, { InviteTarget } from "./InviteAthleteModel";

// ... (KEEP ALL YOUR EXISTING TYPES AND CONFIG OBJECTS THE SAME) ...
type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";
type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type CompetitionLevel = "NONE" | "LOCAL" | "NATIONAL" | "PROFESSIONAL";

interface RaceResult {
  discipline: Discipline;
  distance: string;
  timeSeconds: number;
}

interface Achievement {
  id?: string;
  title: string;
  description?: string | null;
}

interface AthleteData {
  id: string;
  userId: string;
  displayName: string | null;
  disciplines: Discipline[];
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number | null;
  competitionLevel: CompetitionLevel | null;
  locationCity: string | null;
  createdAt: string;
  updatedAt: string;
  raceResults: RaceResult[];
  achievements: Achievement[];
}

interface ProfileData {
  userId: string;
  userToken: string;
  email: string;
  name: string | null;
  inTeam: boolean;
  isOnboard: boolean;
  profileImage: string | null;
  athleteData: AthleteData;
}

interface ActionResponse {
  success: boolean;
  error: boolean;
  message: string | null;
  data: any | null;
}

function formatTimeParts(totalSeconds: number): {
  h: number;
  m: number;
  s: number;
} {
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
}

type DisciplineTheme = {
  icon: React.ElementType;
  color: string;
  colorHex: string;
  bg: string;
  border: string;
  accent: string;
  glow: string;
  label: string;
};

const DISCIPLINE_THEMES: Record<Discipline, DisciplineTheme> = {
  SWIMMER: {
    icon: Waves,
    color: "text-cyan-400",
    colorHex: "#22d3ee",
    bg: "bg-cyan-500/[0.05]",
    border: "border-cyan-500/20",
    accent: "from-cyan-500/0 via-cyan-400/50 to-cyan-500/0",
    glow: "shadow-[0_0_15px_rgba(34,211,238,0.3)]",
    label: "Swimmer",
  },
  CYCLIST: {
    icon: Bike,
    color: "text-orange-400",
    colorHex: "#fb923c",
    bg: "bg-orange-500/[0.05]",
    border: "border-orange-500/20",
    accent: "from-orange-500/0 via-orange-400/50 to-orange-500/0",
    glow: "shadow-[0_0_15px_rgba(251,146,60,0.3)]",
    label: "Cyclist",
  },
  RUNNER: {
    icon: Footprints,
    color: "text-lime-400",
    colorHex: "#a3e635",
    bg: "bg-lime-500/[0.05]",
    border: "border-lime-500/20",
    accent: "from-lime-500/0 via-lime-400/50 to-lime-500/0",
    glow: "shadow-[0_0_15px_rgba(163,230,53,0.3)]",
    label: "Runner",
  },
};

const EXPERIENCE_META: Record<
  ExperienceLevel,
  { color: string; label: string }
> = {
  BEGINNER: { color: "text-zinc-300", label: "Beginner" },
  INTERMEDIATE: { color: "text-sky-400", label: "Intermediate" },
  ADVANCED: { color: "text-violet-400", label: "Advanced" },
};

const COMPETITION_META: Record<
  CompetitionLevel,
  { color: string; label: string }
> = {
  NONE: { color: "text-zinc-500", label: "None" },
  LOCAL: { color: "text-zinc-300", label: "Local" },
  NATIONAL: { color: "text-sky-400", label: "National" },
  PROFESSIONAL: { color: "text-amber-400", label: "Professional" },
};

const STAT_ICON_THEME: Record<string, string> = {
  Experience: "text-violet-400 bg-violet-500/10 border-violet-500/25",
  Competition: "text-sky-400 bg-sky-500/10 border-sky-500/25",
  Training: "text-lime-400 bg-lime-500/10 border-lime-500/25",
};

const initialState: ActionResponse = {
  success: false,
  error: false,
  message: null,
  data: null,
};

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const;
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
} as const;

function SectionLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-2 mb-5 px-1">
      {Icon && <Icon className="w-4 h-4 text-zinc-500" />}
      <h3 className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400">
        {children}
      </h3>
    </div>
  );
}

function RaceResultRow({ result }: { result: RaceResult }) {
  const theme = DISCIPLINE_THEMES[result.discipline];
  const { h, m, s } = formatTimeParts(result.timeSeconds);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all bg-[#0a0a0a] ${theme.border} hover:${theme.glow}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-lg bg-black border flex items-center justify-center shrink-0 ${theme.border}`}
        >
          <Timer className={`w-4 h-4 ${theme.color}`} />
        </div>
        <div>
          <p
            className={`text-xs font-black uppercase tracking-widest ${theme.color}`}
          >
            {result.distance}
          </p>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mt-0.5">
            {theme.label}
          </p>
        </div>
      </div>
      <div className="flex items-baseline gap-1 font-mono tracking-tighter">
        {h > 0 && (
          <>
            <span className={`text-2xl font-bold leading-none ${theme.color}`}>
              {h}
            </span>
            <span className="text-[10px] font-bold text-zinc-600 mr-1 uppercase">
              h
            </span>
          </>
        )}
        <span className={`text-2xl font-bold leading-none ${theme.color}`}>
          {String(m).padStart(h > 0 ? 2 : 1, "0")}
        </span>
        <span className="text-[10px] font-bold text-zinc-600 mr-1 uppercase">
          m
        </span>
        <span className="text-2xl font-bold text-white leading-none">
          {String(s).padStart(2, "0")}
        </span>
        <span className="text-[10px] font-bold text-zinc-600 uppercase">s</span>
      </div>
    </motion.div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="flex items-start gap-4 p-5 bg-amber-500/[0.03] border border-amber-500/15 rounded-xl hover:border-amber-500/30 transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-black border border-amber-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
        <Star className="w-4 h-4 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-bold text-zinc-100 leading-tight">
          {achievement.title}
        </p>
        {achievement.description && (
          <p className="text-xs font-medium text-zinc-500 mt-1.5 leading-relaxed">
            {achievement.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueColor: string;
}) {
  const iconTheme =
    STAT_ICON_THEME[label] ?? "text-zinc-400 bg-zinc-800 border-zinc-700";
  return (
    <div className="flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl hover:bg-zinc-900/60 transition-colors">
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconTheme}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          {label}
        </p>
        <p className={`text-sm font-bold mt-0.5 ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function AthleteProfileDashboard({
  usertoken,
}: {
  usertoken: string;
}) {
  const { user } = useStateContext();
  const isOwner = usertoken === user?.userToken;

  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [localAchievements, setLocalAchievements] = useState<Achievement[]>([]);

  // ── NEW INVITE STATE ──
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [isInvited, setIsInvited] = useState(false);

  const [state, dispatcher, isPending] = useActionState<ActionResponse, string>(
    getAthleteDataAction,
    initialState,
  );

  useEffect(() => {
    if (usertoken) {
      startTransition(() => {
        dispatcher(usertoken);
      });
    }
  }, [usertoken, dispatcher]);

  useEffect(() => {
    if (state.success && state.data) {
      setProfile(state.data);
      setLocalAchievements(state.data.athleteData.achievements ?? []);
    }

    // console.log("from athlete Portfolio ", state);
  }, [state]);

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
    } catch {
      const el = document.createElement("textarea");
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddAchievement = (a: Achievement) =>
    setLocalAchievements((prev) => [...prev, a]);

  const handleInviteSuccess = () => {
    setInviteModalOpen(false);
    setIsInvited(true); // Changes button state locally immediately
  };

  if (isPending && !profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center gap-5">
        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600 animate-pulse">
          Syncing Profile...
        </p>
      </div>
    );
  }

  if (!profile && !isPending) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center p-6 text-center gap-4">
        <AlertCircle className="w-10 h-10 text-zinc-800" />
        <h2 className="text-white font-black text-lg tracking-tight">
          Athlete Not Found
        </h2>
        <p className="text-zinc-500 text-sm max-w-xs">
          We couldn't locate data for this session.
        </p>
      </div>
    );
  }

  if (!profile) return null;

  const { athleteData, profileImage } = profile;
  const disciplines = athleteData.disciplines;
  const hasRaceResults = (athleteData.raceResults ?? []).length > 0;
  const expMeta = EXPERIENCE_META[athleteData.experienceLevel];
  const compMeta = athleteData.competitionLevel
    ? COMPETITION_META[athleteData.competitionLevel]
    : null;
  const primaryTheme = disciplines[0]
    ? DISCIPLINE_THEMES[disciplines[0]]
    : null;

  // Build the target payload dynamically based on the fetched profile data
  const inviteTargetPayload: InviteTarget = {
    userId: athleteData.userId,
    displayName: athleteData.displayName || "Athlete",
    locationCity: athleteData.locationCity,
    profileImage: profileImage,
    disciplines: athleteData.disciplines,
    invitedRoles: [], // The action validation catches duplicates anyway
    experienceLevel: athleteData.experienceLevel,
    trainingDaysPerWeek: athleteData.trainingDaysPerWeek,
    raceResults: athleteData.raceResults,
  };

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans relative overflow-x-hidden pb-20">
      {primaryTheme && (
        <div
          className="fixed top-[-20%] left-[-10%] w-[80vw] h-[70vh] rounded-full blur-[250px] pointer-events-none opacity-[0.08]"
          style={{ background: primaryTheme.colorHex }}
        />
      )}
      <div className="fixed bottom-[-15%] right-[-10%] w-[50vw] h-[50vh] bg-violet-600/[0.05] rounded-full blur-[200px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          {/* ── HERO HEADER ── */}
          <motion.div
            variants={item}
            className="relative rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800/60 shadow-2xl"
          >
            <div
              className={`h-24 w-full bg-zinc-900 border-b border-zinc-800 relative overflow-hidden`}
            >
              {primaryTheme && (
                <div
                  className={`absolute inset-0 opacity-20 bg-gradient-to-tr ${primaryTheme.accent}`}
                />
              )}
            </div>

            <div className="px-6 pb-8 sm:px-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 -mt-12 relative z-10">
                <div className="relative shrink-0 w-28 h-28 rounded-2xl border-4 border-zinc-950 overflow-hidden bg-zinc-900 shadow-2xl">
                  <Image
                    src={
                      profileImage ||
                      `https://avatar.vercel.sh/${athleteData.displayName ?? "athlete"}`
                    }
                    alt={athleteData.displayName ?? "Athlete Avatar"}
                    fill
                    sizes="(max-width: 768px) 112px, 112px"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-lg border-2 border-zinc-950 flex items-center justify-center">
                    <Check className="w-4 h-4 text-black stroke-[3px]" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0 pt-2">
                  <h1 className="text-3xl font-black text-white tracking-tight truncate">
                    {athleteData.displayName ?? profile.name ?? "Athlete"}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
                    {athleteData.locationCity && (
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <MapPin className="w-3.5 h-3.5" />{" "}
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {athleteData.locationCity}
                        </span>
                      </div>
                    )}
                    {profile.inTeam && (
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        
                        <span className="text-xs font-bold uppercase tracking-wider">
                          He Is already in a team
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buttons (Invite + Share) */}
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 mt-4 sm:mt-0">
                  {/* ── CONDITIONAL INVITE BUTTON ── */}
                  {!isOwner && !profile.inTeam &&   (
                    <button
                      onClick={() => setInviteModalOpen(true)}
                      disabled={isInvited}
                      className={`px-6 py-3 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 w-full sm:w-auto justify-center cursor-pointer ${
                        isInvited
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-400 disabled:opacity-70 disabled:cursor-not-allowed"
                          : "bg-white text-black border-white hover:bg-zinc-200"
                      }`}
                    >
                      {isInvited ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      {isInvited ? "Invited" : "Invite"}
                    </button>
                  )}

                  <button
                    onClick={handleShare}
                    className={`px-5 py-3 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 w-full sm:w-auto justify-center cursor-pointer ${
                      copied
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    {copied ? "Copied" : "Share"}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 mt-8">
                {disciplines.map((d) => {
                  const t = DISCIPLINE_THEMES[d];
                  return (
                    <div
                      key={d}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] ${t.color} ${t.bg} ${t.border}`}
                    >
                      <t.icon className="w-3.5 h-3.5" /> {t.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ── DYNAMIC STATS GRID ── */}
          <motion.div variants={item}>
            <SectionLabel icon={Zap}>Athlete Metrics</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatPill
                icon={Gauge}
                label="Experience"
                value={expMeta.label}
                valueColor={expMeta.color}
              />
              {athleteData.competitionLevel &&
                athleteData.competitionLevel !== "NONE" &&
                compMeta && (
                  <StatPill
                    icon={Award}
                    label="Competition"
                    value={compMeta.label}
                    valueColor={compMeta.color}
                  />
                )}
              {athleteData.trainingDaysPerWeek !== null && (
                <StatPill
                  icon={Clock}
                  label="Training"
                  value={`${athleteData.trainingDaysPerWeek} days/wk`}
                  valueColor="text-lime-400"
                />
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6">
            {/* ── LEFT COL: RACE RESULTS ── */}
            <motion.div variants={item} className="lg:col-span-7 space-y-5">
              <SectionLabel icon={Timer}>Personal Bests</SectionLabel>
              {hasRaceResults ? (
                <div className="space-y-5">
                  {disciplines.map((d) => {
                    const results = athleteData.raceResults.filter(
                      (r) => r.discipline === d,
                    );
                    if (!results.length) return null;
                    const theme = DISCIPLINE_THEMES[d];
                    return (
                      <div key={d} className="space-y-3">
                        <div className="flex items-center gap-2 text-zinc-500 mb-2">
                          <theme.icon className="w-4 h-4" />{" "}
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            {theme.label}
                          </h4>
                        </div>
                        {results.map((r, i) => (
                          <RaceResultRow
                            key={`${r.discipline}-${r.distance}-${i}`}
                            result={r}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
                  <Timer className="w-8 h-8 text-zinc-700 mb-3" />
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    No race times logged
                  </p>
                </div>
              )}
            </motion.div>

            {/* ── RIGHT COL: ACHIEVEMENTS ── */}
            <motion.div variants={item} className="lg:col-span-5 space-y-5">
              <SectionLabel icon={Medal}>Trophy Room</SectionLabel>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-5 space-y-3 shadow-xl">
                {localAchievements.length > 0 ? (
                  localAchievements.map((a, i) => (
                    <AchievementCard
                      key={a.id ?? `achievement-${i}`}
                      achievement={a}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Medal className="w-8 h-8 text-zinc-800 mb-3" />
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                      No achievements yet
                    </p>
                  </div>
                )}
                {isOwner && (
                  <div className="pt-2 border-t border-zinc-800/50 mt-4">
                    <AddAchievementForm onAdd={handleAddAchievement} />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── INVITE MODAL PORTAL ── */}
      <AnimatePresence>
        {inviteModalOpen && (
          <InviteAthleteModal
            inviteTarget={inviteTargetPayload}
            missingSlots={["SWIMMER", "CYCLIST", "RUNNER"]} // Assumes all available to bypass local blocking; validation strictly handled server-side.
            hasTeam={user?.inTeam ? true : false}
            onClose={() => setInviteModalOpen(false)}
            onInviteSent={handleInviteSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
