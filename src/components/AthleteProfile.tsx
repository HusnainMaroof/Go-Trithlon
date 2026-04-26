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
  Gauge,
  AlertCircle,
  Loader2,
  Clock,
  Plus,
  X,
  ChevronRight,
  Timer,
  Medal,
  Star,
} from "lucide-react";
import { getAthleteDataAction } from "../actions/dashboardAction";

// ─── TYPES ───────────────────────────────────────────────────────────────────

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
  data: ProfileData | null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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

// ─── CONFIG ──────────────────────────────────────────────────────────────────

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
    color: "text-cyan-300",
    colorHex: "#67e8f9",
    bg: "bg-cyan-400/[0.07]",
    border: "border-cyan-400/25",
    accent: "from-transparent via-cyan-400/70 to-transparent",
    glow: "shadow-[0_0_12px_rgba(103,232,249,0.45)]",
    label: "Swimmer",
  },
  CYCLIST: {
    icon: Bike,
    color: "text-orange-300",
    colorHex: "#fdba74",
    bg: "bg-orange-400/[0.07]",
    border: "border-orange-400/25",
    accent: "from-transparent via-orange-400/70 to-transparent",
    glow: "shadow-[0_0_12px_rgba(251,146,60,0.45)]",
    label: "Cyclist",
  },
  RUNNER: {
    icon: Footprints,
    color: "text-lime-300",
    colorHex: "#bef264",
    bg: "bg-lime-400/[0.07]",
    border: "border-lime-400/25",
    accent: "from-transparent via-lime-400/70 to-transparent",
    glow: "shadow-[0_0_12px_rgba(163,230,53,0.45)]",
    label: "Runner",
  },
};

const EXPERIENCE_META: Record<
  ExperienceLevel,
  { color: string; label: string }
> = {
  BEGINNER: { color: "text-zinc-300", label: "Beginner" },
  INTERMEDIATE: { color: "text-sky-300", label: "Intermediate" },
  ADVANCED: { color: "text-violet-300", label: "Advanced" },
};

const COMPETITION_META: Record<
  CompetitionLevel,
  { color: string; label: string }
> = {
  NONE: { color: "text-zinc-600", label: "None" },
  LOCAL: { color: "text-zinc-300", label: "Local" },
  NATIONAL: { color: "text-sky-300", label: "National" },
  PROFESSIONAL: { color: "text-amber-300", label: "Professional" },
};

// stat icon themes: key = label string
const STAT_ICON_THEME: Record<string, string> = {
  Experience:
    "text-violet-300 bg-violet-500/10 border-violet-500/25 shadow-[0_0_10px_rgba(167,139,250,0.3)]",
  Competition:
    "text-sky-300 bg-sky-500/10 border-sky-500/25 shadow-[0_0_10px_rgba(125,211,252,0.3)]",
  "Training Days / Week":
    "text-lime-300 bg-lime-500/10 border-lime-500/25 shadow-[0_0_10px_rgba(163,230,53,0.3)]",
};

const initialState: ActionResponse = {
  success: false,
  error: false,
  message: null,
  data: null,
};

// ─── ANIMATION VARIANTS ──────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 22 },
  },
} as const;

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4 px-1">
      {children}
    </p>
  );
}

// ── Race Result Row ──────────────────────────────────────────────────────────

function RaceResultRow({ result }: { result: RaceResult }) {
  const theme = DISCIPLINE_THEMES[result.discipline];
  const { h, m, s } = formatTimeParts(result.timeSeconds);

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:brightness-110 ${theme.bg} ${theme.border}`}
    >
      <div
        className={`w-8 h-8 rounded-lg bg-black/50 border flex items-center justify-center shrink-0 ${theme.border} ${theme.glow}`}
      >
        <Timer className={`w-3.5 h-3.5 ${theme.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-[11px] font-black uppercase tracking-widest ${theme.color}`}
        >
          {result.distance}
        </p>
        <p className="text-[9px] text-zinc-600 font-bold mt-0.5">
          {result.discipline.charAt(0) +
            result.discipline.slice(1).toLowerCase()}
        </p>
      </div>

      {/* Time display */}
      <div className="flex items-end gap-0.5 shrink-0">
        {h > 0 && (
          <>
            <span
              className={`text-xl font-black leading-none tabular-nums ${theme.color}`}
            >
              {h}
            </span>
            <span className="text-[9px] text-zinc-600 font-bold mb-0.5 mr-1">
              h
            </span>
          </>
        )}
        <span
          className={`text-xl font-black leading-none tabular-nums ${theme.color}`}
        >
          {String(m).padStart(h > 0 ? 2 : 1, "0")}
        </span>
        <span className="text-[9px] text-zinc-600 font-bold mb-0.5 mr-0.5">
          m
        </span>
        <span className="text-xl font-black text-white leading-none tabular-nums">
          {String(s).padStart(2, "0")}
        </span>
        <span className="text-[9px] text-zinc-600 font-bold mb-0.5">s</span>
      </div>
    </div>
  );
}

// ── Discipline Race Group ────────────────────────────────────────────────────

function DisciplineRaceGroup({
  discipline,
  results,
}: {
  discipline: Discipline;
  results: RaceResult[];
}) {
  const theme = DISCIPLINE_THEMES[discipline];
  const Icon = theme.icon;

  return (
    <div className="relative bg-[#0a0a0a] border border-zinc-800/70 rounded-2xl overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${theme.accent}`}
      />

      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-9 h-9 rounded-xl bg-black border flex items-center justify-center ${theme.border} ${theme.glow}`}
          >
            <Icon className={`w-4 h-4 ${theme.color}`} />
          </div>
          <div>
            <p
              className={`text-[11px] font-black uppercase tracking-widest ${theme.color}`}
            >
              {theme.label}
            </p>
            <p className="text-[9px] text-zinc-600 font-bold">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {results.map((r, i) => (
            <RaceResultRow
              key={`${r.discipline}-${r.distance}-${i}`}
              result={r}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Achievement Card ─────────────────────────────────────────────────────────

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-400/[0.05] border border-amber-400/20 rounded-xl hover:border-amber-400/35 transition-all duration-200">
      <div className="w-8 h-8 rounded-lg bg-black/60 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
        <Star className="w-3.5 h-3.5 text-amber-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">
          {achievement.title}
        </p>
        {achievement.description && (
          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
            {achievement.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Add Achievement Form ─────────────────────────────────────────────────────

function AddAchievementForm({ onAdd }: { onAdd: (a: Achievement) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    // TODO: replace timeout with addAchievementAction(title, description)
    await new Promise((r) => setTimeout(r, 500));
    onAdd({ title: trimmed, description: description.trim() || null });
    setTitle("");
    setDescription("");
    setOpen(false);
    setSaving(false);
  };

  return (
    <div className="mt-3">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            className="w-full py-3 rounded-xl border border-dashed border-zinc-800 text-zinc-600 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-amber-400/40 hover:text-amber-400 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Achievement
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70">
                New Achievement
              </p>
              <button
                onClick={() => {
                  setOpen(false);
                  setTitle("");
                  setDescription("");
                }}
                className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Achievement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500/40 transition-colors font-medium"
            />

            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500/40 transition-colors resize-none font-medium"
            />

            <button
              disabled={!title.trim() || saving}
              onClick={handleSubmit}
              className="w-full py-2.5 rounded-lg bg-amber-400 text-black text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {saving ? "Saving..." : "Save"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Stat Pill ────────────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-3 p-4 bg-zinc-900/30 border border-zinc-800/60 rounded-xl hover:border-zinc-700/60 transition-all duration-200">
      <div
        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconTheme}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
          {label}
        </p>
        <p className={`text-sm font-black mt-0.5 ${valueColor}`}>{value}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-800 shrink-0" />
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function AthleteProfileDashboard({
  usertoken,
}: {
  usertoken: string;
}) {
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [localAchievements, setLocalAchievements] = useState<Achievement[]>([]);

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

  const handleAddAchievement = (a: Achievement) => {
    setLocalAchievements((prev) => [...prev, a]);
  };

  // ── Loading ──
  if (isPending && !profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-700 animate-pulse">
          Loading Profile
        </p>
      </div>
    );
  }

  // ── Not found ──
  if (!profile && !isPending) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center p-6 text-center gap-4">
        <AlertCircle className="w-10 h-10 text-zinc-800" />
        <h2 className="text-white font-black text-lg tracking-tight">
          Profile Not Found
        </h2>
        <p className="text-zinc-600 text-sm max-w-xs leading-relaxed">
          We couldn't locate an athlete profile for this session.
        </p>
      </div>
    );
  }

  if (!profile) return null;

  const { athleteData, profileImage, userToken: profileToken } = profile;
  const disciplines = athleteData.disciplines;

  // Owner: logged-in usertoken === this profile's userToken
  const isOwner = usertoken === profileToken;

  // Group race results by discipline
  const resultsByDiscipline = disciplines.reduce<
    Record<Discipline, RaceResult[]>
  >(
    (acc, d) => {
      acc[d] = (athleteData.raceResults ?? []).filter(
        (r) => r.discipline === d,
      );
      return acc;
    },
    {} as Record<Discipline, RaceResult[]>,
  );

  const hasRaceResults = (athleteData.raceResults ?? []).length > 0;
  const expMeta = EXPERIENCE_META[athleteData.experienceLevel];
  const compMeta = athleteData.competitionLevel
    ? COMPETITION_META[athleteData.competitionLevel]
    : null;

  const primaryTheme = disciplines[0]
    ? DISCIPLINE_THEMES[disciplines[0]]
    : null;

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans selection:bg-blue-500/30 relative overflow-x-hidden">
      {/* Discipline-tinted ambient glow */}
      {primaryTheme && (
        <div
          className="fixed top-[-30%] left-[-10%] w-[70%] h-[60%] rounded-full blur-[280px] pointer-events-none opacity-[0.12]"
          style={{ background: primaryTheme.colorHex }}
        />
      )}
      <div className="fixed bottom-[-15%] right-[-5%] w-[40%] h-[40%] bg-violet-600/[0.07] rounded-full blur-[200px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* ── PROFILE HEADER ─────────────────────────────────────────── */}
          <motion.div
            variants={item}
            className="relative bg-[#0a0a0a] border border-zinc-800 rounded-3xl overflow-hidden"
          >
            {primaryTheme && (
              <div
                className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${primaryTheme.accent}`}
              />
            )}

            <div className="p-7">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={
                      profileImage ||
                      `https://avatar.vercel.sh/${athleteData.displayName ?? "athlete"}`
                    }
                    alt={athleteData.displayName ?? "Athlete"}
                    className="w-20 h-20 rounded-2xl border border-zinc-800 object-cover"
                    style={
                      primaryTheme
                        ? { boxShadow: `0 0 28px ${primaryTheme.colorHex}33` }
                        : {}
                    }
                  />
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-400 rounded-lg border-2 border-black flex items-center justify-center shadow-[0_0_10px_rgba(52,211,153,0.6)]">
                    <Check className="w-3 h-3 text-black stroke-[3px]" />
                  </div>
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-black text-white tracking-tight leading-none truncate">
                    {athleteData.displayName ?? profile.name ?? "Athlete"}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5">
                    {athleteData.locationCity && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-zinc-600" />
                        <span className="text-[11px] font-bold text-zinc-500">
                          {athleteData.locationCity}
                        </span>
                      </div>
                    )}
                    {profile.inTeam && (
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span className="text-[11px] font-bold text-emerald-500">
                          In a team
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Discipline badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {disciplines.map((d) => {
                      const t = DISCIPLINE_THEMES[d];
                      const Icon = t.icon;
                      return (
                        <span
                          key={d}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${t.color} ${t.bg} ${t.border}`}
                          style={{ boxShadow: `0 0 10px ${t.colorHex}22` }}
                        >
                          <Icon className="w-3 h-3" /> {t.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className={`shrink-0 px-4 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                    copied
                      ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied" : "Share"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── STATS ROW ──────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <SectionLabel>Profile Stats</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatPill
                icon={Gauge}
                label="Experience"
                value={expMeta.label}
                valueColor={expMeta.color}
              />
              <StatPill
                icon={Award}
                label="Competition"
                value={compMeta?.label ?? "—"}
                valueColor={compMeta?.color ?? "text-zinc-600"}
              />
              <StatPill
                icon={Clock}
                label="Training Days / Week"
                value={
                  athleteData.trainingDaysPerWeek != null
                    ? `${athleteData.trainingDaysPerWeek} days`
                    : "—"
                }
                valueColor="text-lime-300"
              />
            </div>
          </motion.div>

          {/* ── RACE RESULTS ───────────────────────────────────────────── */}
          <motion.div variants={item}>
            <SectionLabel>Race Results</SectionLabel>
            {hasRaceResults ? (
              <div className="space-y-4">
                {disciplines.map((d) => {
                  const results = resultsByDiscipline[d];
                  if (!results || results.length === 0) return null;
                  return (
                    <DisciplineRaceGroup
                      key={d}
                      discipline={d}
                      results={results}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 bg-zinc-950/40 border border-zinc-800/50 rounded-2xl gap-3">
                <Timer className="w-8 h-8 text-zinc-800" />
                <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest">
                  No race results yet
                </p>
              </div>
            )}
          </motion.div>

          {/* ── ACHIEVEMENTS ───────────────────────────────────────────── */}
          <motion.div variants={item}>
            <SectionLabel>Achievements</SectionLabel>
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5 space-y-2.5">
              {localAchievements.length > 0 ? (
                localAchievements.map((a, i) => (
                  <AchievementCard
                    key={a.id ?? `achievement-${i}`}
                    achievement={a}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Medal className="w-8 h-8 text-zinc-800" />
                  <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest">
                    No achievements yet
                  </p>
                </div>
              )}

              {isOwner && <AddAchievementForm onAdd={handleAddAchievement} />}
            </div>
          </motion.div>

          {/* ── SUMMARY FOOTER ─────────────────────────────────────────── */}
          <motion.div
            variants={item}
            className="relative p-8 bg-zinc-950/60 border border-zinc-800/50 rounded-3xl flex flex-col items-center text-center gap-5 overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
            <div className="w-11 h-11 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center shadow-[0_0_16px_rgba(251,191,36,0.25)]">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div className="max-w-md space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600">
                Athlete Summary
              </h4>
              <p className="text-sm text-zinc-500 leading-relaxed">
                <span className="text-white font-bold">
                  {athleteData.displayName ?? "This athlete"}
                </span>{" "}
                is a{" "}
                <span className={`font-bold ${expMeta.color}`}>
                  {expMeta.label.toLowerCase()}
                </span>{" "}
                level competitor based in{" "}
                <span className="text-zinc-300 font-bold">
                  {athleteData.locationCity ?? "an undisclosed location"}
                </span>
                , specializing in{" "}
                <span className="text-white font-bold">
                  {disciplines
                    .map((d) => DISCIPLINE_THEMES[d].label.toLowerCase())
                    .join(" and ") || "multisport"}
                </span>
                {athleteData.trainingDaysPerWeek != null && (
                  <>
                    {" "}
                    with a training frequency of{" "}
                    <span className="text-lime-300 font-bold">
                      {athleteData.trainingDaysPerWeek} days/week
                    </span>
                  </>
                )}
                .
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
