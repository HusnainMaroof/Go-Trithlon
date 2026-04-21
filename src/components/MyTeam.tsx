"use client";

import React, {
  startTransition,
  useActionState,
  useEffect,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Plus,
  Users,
  AlertCircle,
  X,
  Waves,
  Bike,
  Footprints,
  MapPin,
  Settings,
  Link as LinkIcon,
  Target,
  Trophy,
  ArrowRight,
  UserPlus,
  Search,
  CheckCircle2,
  LogOut,
  UserMinus,
  Loader2,
  Trash2,
  Check,
} from "lucide-react";
import { useStateContext } from "../context/useContext";
import { teamAction } from "../actions/dashboardAction";


export type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";

export type TeamActionPayload =
  | { service: "GET_TEAM" }
  | { service: "CREATE_TEAM"; teamName: string }
  | { service: "CLAIM_SLOT"; role: Discipline; teamId: string }
  | { service: "REMOVE_FROM_TEAM"; memberId: string; teamId: string }
  | { service: "DELETE_TEAM"; teamId: string };

type RosterEntry = {
  memberId: string | null;
  role: string;
  discipline: Discipline;
  filled: boolean;
  name: string | null;
  isMe: boolean;
  hasSkill: boolean;
  img: string | null;
};

// ─── CONSTANTS & CONFIG ──────────────────────────────────────────────────────

const DISCIPLINE_CONFIG: Record<
  Discipline,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    glow: string;
  }
> = {
  SWIMMER: {
    label: "Swimmer",
    icon: Waves,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-500/20",
    glow: "bg-cyan-500/20",
  },
  CYCLIST: {
    label: "Cyclist",
    icon: Bike,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-500/20",
    glow: "bg-amber-500/20",
  },
  RUNNER: {
    label: "Runner",
    icon: Footprints,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-500/20",
    glow: "bg-emerald-500/20",
  },
};

const ALL_DISCIPLINES: Discipline[] = ["SWIMMER", "CYCLIST", "RUNNER"];

const initialState: any = {
  success: false,
  error: false,
  message: null,
  data: null,
};

// ─── ANIMATION VARIANTS ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 400 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } },
};

// ─── PREMIUM SKELETON COMPONENT ─────────────────────────────────────────────

const Shimmer = () => (
  <motion.div
    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-zinc-700/10 to-transparent z-10"
    animate={{ translateX: ["-100%", "200%"] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
  />
);

const DashboardSkeleton = () => (
  <motion.div
    key="skeleton"
    initial={{ opacity: 0, filter: "blur(4px)" }}
    animate={{ opacity: 1, filter: "blur(0px)" }}
    exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.2 } }}
    className="max-w-5xl mx-auto space-y-10"
  >
    <div className="flex flex-col sm:flex-row justify-between gap-4">
      <div className="space-y-3">
        <div className="h-9 w-48 bg-zinc-900/80 rounded-lg relative overflow-hidden">
          <Shimmer />
        </div>
        <div className="h-4 w-64 bg-zinc-900/40 rounded-md relative overflow-hidden">
          <Shimmer />
        </div>
      </div>
      <div className="h-11 w-64 bg-zinc-900/80 rounded-xl relative overflow-hidden">
        <Shimmer />
      </div>
    </div>
    <div className="h-[100px] w-full bg-zinc-900/30 rounded-[1.25rem] border border-zinc-800/40 relative overflow-hidden">
      <Shimmer />
    </div>
    <div className="space-y-4">
      <div className="h-7 w-24 bg-zinc-900/80 rounded-lg relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-[1.25rem] bg-[#0a0a0a] border border-zinc-800/50 h-[200px] flex flex-col relative overflow-hidden"
          >
            <Shimmer />
            <div className="h-7 w-20 bg-zinc-900/80 rounded-md mb-6" />
            <div className="mt-auto h-16 w-full bg-zinc-900/40 rounded-xl flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800/50 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-zinc-800/50 rounded" />
                <div className="h-3 w-16 bg-zinc-800/30 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

// ─── MODAL COMPONENTS ───────────────────────────────────────────────────────

const CreateTeamModal = ({
  onClose,
  onSubmit,
  isPending,
  errorMsg,
  inputValue,
  setInputValue,
}: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !isPending && onClose()}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
    />
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[1.5rem] p-8 shadow-2xl z-10 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/10 rounded-full blur-[80px] pointer-events-none" />
      <button
        onClick={() => !isPending && onClose()}
        className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-white bg-zinc-900/80 rounded-full transition-colors cursor-pointer z-20"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex flex-col relative z-10">
        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
          Create Your Team
        </h3>
        <p className="text-sm text-zinc-400 mb-6">Pick a name for your team.</p>
        <div className="space-y-2 mb-8">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Team Name
          </label>
          <input
            type="text"
            autoFocus
            placeholder="e.g. Austin Tri-Force"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
            disabled={isPending}
            className="w-full bg-black border border-zinc-800 focus:border-blue-300 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-700 outline-none transition-all shadow-inner font-medium disabled:opacity-50"
          />
          {errorMsg && (
            <p className="text-xs text-red-400 pt-1 font-medium">{errorMsg}</p>
          )}
        </div>
        <button
          onClick={onSubmit}
          disabled={!inputValue.trim() || isPending}
          className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            !inputValue.trim() || isPending
              ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
              : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-pointer"
          }`}
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Shield className="w-5 h-5" />
          )}
          {isPending ? "Creating Team..." : "Create Team"}
        </button>
      </div>
    </motion.div>
  </div>
);

const RecruitSlotModal = ({
  slot,
  onClose,
  onClaim,
  userDisciplines,
  user,
  isPending,
  errorMsg,
}: any) => {
  const config = DISCIPLINE_CONFIG[slot as Discipline];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isPending && onClose()}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-[1.5rem] p-8 shadow-2xl z-10 overflow-hidden"
      >
        <div
          className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] ${config.glow} rounded-full blur-[80px] pointer-events-none`}
        />
        <button
          onClick={() => !isPending && onClose()}
          className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-white bg-zinc-900/80 rounded-full transition-colors cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col mt-2 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`w-14 h-14 ${config.bg} ${config.border} border rounded-full flex items-center justify-center shadow-inner`}
            >
              {React.createElement(config.icon, {
                className: `w-7 h-7 ${config.color}`,
              })}
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Fill this Spot
              </h3>
              <p className="text-sm text-zinc-400">
                Who will be the {config.label}?
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full">
            {userDisciplines.includes(slot) ? (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-1">
                  Your Skills Match
                </p>
                <button
                  onClick={() => onClaim(slot)}
                  disabled={isPending}
                  className="w-full text-left p-4 rounded-xl border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="You"
                        className="w-11 h-11 rounded-full border border-zinc-700 object-cover opacity-80 group-hover:opacity-100 transition-opacity bg-zinc-950"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        <UserPlus className="w-4 h-4 text-zinc-500" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white text-[15px]">
                        {isPending ? "Claiming..." : "Take this spot"}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Assign yourself
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${config.color} ${config.bg} ${config.border}`}
                  >
                    {config.label}
                  </div>
                </button>
                {errorMsg && (
                  <p className="text-xs text-red-400 px-1 font-medium">
                    {errorMsg}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-300 text-sm">
                      Skill Required
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      You don't have{" "}
                      <span className="text-white font-medium">
                        {config.label}
                      </span>{" "}
                      on your profile.
                    </p>
                  </div>
                </div>
                <div className="border-t border-zinc-800 pt-3 mt-1">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Your Current Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {userDisciplines.length > 0 ? (
                      userDisciplines.map((d: Discipline) => (
                        <span
                          key={d}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${DISCIPLINE_CONFIG[d].color} ${DISCIPLINE_CONFIG[d].bg} ${DISCIPLINE_CONFIG[d].border}`}
                        >
                          {DISCIPLINE_CONFIG[d].label}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-600 font-medium">
                        No skills listed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mt-2 px-1">
              Other Options
            </p>
            <button
              onClick={onClose}
              className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-black hover:bg-zinc-900 transition-colors flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h4 className="font-bold text-white text-[15px]">
                  Find a Teammate
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Browse athletes to fill this role
                </p>
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const NoTeamWarningModal = ({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: () => void;
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
    />
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-[1.5rem] p-8 shadow-2xl z-10 overflow-hidden"
    >
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-300/10 rounded-full blur-[80px] pointer-events-none" />
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-white bg-zinc-900/80 rounded-full transition-colors cursor-pointer z-20"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex flex-col items-center text-center mt-2 relative z-10">
        <div className="w-20 h-20 bg-blue-300/10 border border-blue-300/20 rounded-full flex items-center justify-center mb-5 shadow-inner">
          <AlertCircle className="w-10 h-10 text-blue-300" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
          You don't have a team.
        </h3>
        <p className="text-sm text-zinc-400 mb-8 px-2 leading-relaxed">
          Please create your team first. Then you can fill spots and invite
          others.
        </p>
        <button
          onClick={onCreate}
          className="w-full py-3.5 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-all cursor-pointer"
        >
          Create a Team
        </button>
      </div>
    </motion.div>
  </div>
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function App() {
  const { user } = useStateContext();
  const athlete = user?.athleteData;

  const [state, dispatcher, isPending] = useActionState<any, TeamActionPayload>(
    teamAction,
    initialState,
  );

  // States
  const [isInitialFetch, setIsInitialFetch] = useState(true);
  const [teamData, setTeamData] = useState<Record<string, any> | null>(null);
  const [activeService, setActiveService] = useState<string | null>(null);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);

  // 🔥 Dropdown and Sharing states
  const [showSettings, setShowSettings] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNoTeamWarning, setShowNoTeamWarning] = useState(false);
  const [recruitSlot, setRecruitSlot] = useState<Discipline | null>(null);
  const [newTeamInput, setNewTeamInput] = useState("");

  // Fix: Mapping from athleteData structure using 'disciplines' (plural)
  const userDisciplines: Discipline[] =
    (athlete?.disciplines as Discipline[]) || [];

  // ─── EFFECTS ──────────────────────────────────────────────────────────────

  useEffect(() => {
    setActiveService("GET_TEAM");
    startTransition(() => {
      dispatcher({ service: "GET_TEAM" });
    });
  }, [dispatcher]);

  useEffect(() => {
    if (!isPending && activeService === "GET_TEAM") {
      setIsInitialFetch(false);
    }

    if (isPending) return;

    if (state.success) {
      if (activeService === "GET_TEAM") {
        setTeamData(state?.data!);
        setActiveService(null);
        setActiveTarget(null);
      } else if (activeService === "CREATE_TEAM") {
        window.location.reload()
        setTeamData(state?.data!);
        setShowCreateModal(false);
        setNewTeamInput("");
        setActiveService(null);
        setActiveTarget(null);
      } else if (activeService === "DELETE_TEAM") {
        window.location.reload()
        setTeamData(null);
        setShowSettings(false);
        setActiveService(null);
        setActiveTarget(null);
      } else if (
        activeService === "CLAIM_SLOT" ||
        activeService === "REMOVE_FROM_TEAM"
      ) {
        window.location.reload()
        setRecruitSlot(null);
        setActiveService("GET_TEAM"); // Trigger a refresh
        startTransition(() => dispatcher({ service: "GET_TEAM" }));
      }
    }
  }, [state, isPending, activeService, dispatcher]);

  // ─── ACTION HANDLERS ──────────────────────────────────────────────────────

  const handleCreateTeam = () => {
    if (!newTeamInput.trim() || isPending) return;
    setActiveService("CREATE_TEAM");
    startTransition(() =>
      dispatcher({ service: "CREATE_TEAM", teamName: newTeamInput }),
    );
  };

  const handleClaimSlot = (role: Discipline) => {
    if (!teamData?.id || isPending) return;
    setActiveService("CLAIM_SLOT");
    setActiveTarget(role); // Only this slot spins
    startTransition(() =>
      dispatcher({
        service: "CLAIM_SLOT",
        role: role,
        teamId: String(teamData.id),
      }),
    );
  };

  const handleRemoveFromTeam = (memberId: string) => {
    if (!teamData?.id || isPending) return;
    setActiveService("REMOVE_FROM_TEAM");
    setActiveTarget(memberId); // Only this member's remove button spins
    startTransition(() =>
      dispatcher({
        service: "REMOVE_FROM_TEAM",
        memberId,
        teamId: String(teamData.id),
      }),
    );
  };

  const handleDeleteTeam = () => {
    if (!teamData?.id || isPending) return;
    setActiveService("DELETE_TEAM");
    setActiveTarget("TEAM_DELETE");
    startTransition(() =>
      dispatcher({
        service: "DELETE_TEAM",
        teamId: String(teamData.id),
      }),
    );
  };

  const handleShareLink = () => {
    if (!teamData?.id) return;
    const url = `${window.location.origin}/teams/${teamData.id}`;

    const textArea = document.createElement("textarea");
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
    document.body.removeChild(textArea);
  };

  // ─── DERIVED DATA ─────────────────────────────────────────────────────────

  const getFormattedPaces = (): string => {
    if (!athlete) return "Paces Pending";
    const p: string[] = [];
    if (athlete.swimTime100m) p.push(`${athlete.swimTime100m}s 100m`);
    if (athlete.cycleTime10km) p.push(`${athlete.cycleTime10km}m 10k`);
    if (athlete.runTime5km) p.push(`${athlete.runTime5km}m 5k`);
    return p.join(" • ") || "Paces Pending";
  };

  const roster: RosterEntry[] = ALL_DISCIPLINES.map((disciplineKey) => {
    const config = DISCIPLINE_CONFIG[disciplineKey];
    const hasSkill = userDisciplines.includes(disciplineKey);

    if (teamData?.members) {
      const memberInRole = (teamData.members as Array<any>).find(
        (m) => m.role === disciplineKey,
      );
      return {
        memberId: memberInRole?.id ?? null,
        role: config.label,
        discipline: disciplineKey,
        filled: !!memberInRole,
        name: memberInRole?.user?.athleteProfile?.displayName ?? null,
        isMe: memberInRole?.userId === athlete?.userId,
        hasSkill,
        img: memberInRole?.user?.profileImage ?? null,
      };
    }

    return {
      memberId: null,
      role: config.label,
      discipline: disciplineKey,
      filled: false,
      name: hasSkill ? (athlete?.displayName ?? null) : null,
      isMe: hasSkill,
      hasSkill,
      img: hasSkill ? (user?.profileImage ?? null) : null,
    };
  });

  const missingRolesText = roster
    .filter((m) => !m.filled && !m.hasSkill)
    .map((m) => m.role)
    .join(" and ");
  const userRolesFormatted = userDisciplines
    .map((d) => DISCIPLINE_CONFIG[d].label)
    .join(" and ");

  const showSkeleton =
    isInitialFetch || (isPending && activeService === "GET_TEAM" && !teamData);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-300/30 p-4 sm:p-6 lg:p-8 relative">
      <AnimatePresence mode="wait">
        {showSkeleton ? (
          <DashboardSkeleton key="skeleton" />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-5xl mx-auto space-y-10 relative z-10"
          >
            {/* HEADER */}
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Team Overview
                </h1>
                <p className="text-zinc-400 mt-1 text-sm">
                  Manage your team and invite athletes.
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

            {/* DYNAMIC BANNER */}
            {!teamData ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-zinc-800/80 rounded-[1.25rem] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full border border-blue-300/30 flex items-center justify-center shrink-0 bg-blue-300/10">
                    <AlertCircle className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
                      No Team Yet
                    </h2>
                    <p className="text-zinc-400 text-sm leading-snug">
                      You specialize as a {userRolesFormatted || "beginner"}.
                      Create a team to start recruiting{" "}
                      {missingRolesText ? `a ${missingRolesText}` : "members"}.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full md:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  Create Team <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-950 border border-zinc-800 rounded-[1.25rem] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden shadow-xl"
              >
                <div className="absolute top-[-50%] right-[-10%] w-[40%] h-[200%] bg-blue-300/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-blue-300/10 border border-blue-300/20 rounded-2xl flex items-center justify-center shadow-inner">
                    <Shield className="w-7 h-7 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                      {String(teamData.name)}
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />{" "}
                      {athlete?.locationCity || "Location"} Based
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
                  <button
                    onClick={handleShareLink}
                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${shareStatus === "copied" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300"}`}
                  >
                    {shareStatus === "copied" ? (
                      <>
                        <Check className="w-4 h-4" /> Copied
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" /> Share Link
                      </>
                    )}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className={`p-2.5 border rounded-xl transition-all cursor-pointer ${showSettings ? "bg-zinc-800 text-white border-zinc-600 shadow-inner" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"}`}
                    >
                      <Settings className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                      {showSettings && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowSettings(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 bottom-full mb-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50 p-1"
                          >
                            <button
                              onClick={handleDeleteTeam}
                              disabled={
                                isPending && activeService === "DELETE_TEAM"
                              }
                              className="w-full text-left px-3 py-2.5 rounded-lg flex cursor-pointer items-center gap-3 text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                            >
                              {isPending && activeTarget === "TEAM_DELETE" ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              <span className="text-sm font-bold">
                                Delete Team
                              </span>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ROSTER GRID */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 px-1">
                <Users className="w-5 h-5 text-zinc-400" /> Roster
              </h3>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {roster.map((member) => {
                  const config = DISCIPLINE_CONFIG[member.discipline];
                  const isClaimingThis =
                    isPending &&
                    activeService === "CLAIM_SLOT" &&
                    activeTarget === member.discipline;
                  const isRemovingThis =
                    isPending &&
                    activeService === "REMOVE_FROM_TEAM" &&
                    activeTarget === member.memberId;
                  const hasRemoveError =
                    !state.success &&
                    state.error &&
                    activeService === "REMOVE_FROM_TEAM" &&
                    activeTarget === member.memberId;

                  return (
                    <motion.div
                      variants={itemVariants}
                      key={member.discipline}
                      className="p-5 rounded-[1.25rem] bg-[#0a0a0a] border border-zinc-800/80 flex flex-col h-full hover:border-zinc-700/80 transition-colors shadow-lg"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div
                          className={`px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${config.color} ${config.bg} ${config.border}`}
                        >
                          <config.icon className="w-3.5 h-3.5" /> {member.role}
                        </div>
                        {member.isMe && (
                          <span className="text-[10px] font-bold text-zinc-500 bg-[#1a1a1a] border border-zinc-800 px-2.5 py-1 rounded-md">
                            YOU
                          </span>
                        )}
                      </div>

                      {member.filled ? (
                        <div className="flex flex-col gap-2 mt-auto">
                          <div className="flex items-center gap-3 border border-zinc-800 p-4 rounded-xl bg-black shadow-inner">
                            {member.img ? (
                              <img
                                src={member.img}
                                alt={member.name || ""}
                                className="w-11 h-11 rounded-full border border-zinc-700 object-cover bg-zinc-900 shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4 text-zinc-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-[15px] leading-tight truncate">
                                {member.name || "Athlete"}
                              </h4>
                              <p className="text-xs text-emerald-500/80 font-medium mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Slot Filled
                              </p>
                            </div>

                            {member.memberId && (
                              <button
                                onClick={() =>
                                  handleRemoveFromTeam(member.memberId!)
                                }
                                disabled={isRemovingThis}
                                title={
                                  member.isMe ? "Leave team" : "Remove member"
                                }
                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                              >
                                {isRemovingThis ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : member.isMe ? (
                                  <LogOut className="w-4 h-4" />
                                ) : (
                                  <UserMinus className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>

                          {hasRemoveError && (
                            <div className="text-[11px] font-medium text-red-400 bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">
                              {state.message || "Action failed."}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            !teamData
                              ? setShowNoTeamWarning(true)
                              : setRecruitSlot(member.discipline);
                          }}
                          disabled={isClaimingThis}
                          className="flex w-full items-center gap-4 group text-left cursor-pointer transition-all mt-auto p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-transparent hover:bg-zinc-900/40 disabled:opacity-50"
                        >
                          <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center group-hover:border-zinc-500 transition-all shrink-0 shadow-inner">
                            {isClaimingThis ? (
                              <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                            ) : (
                              <Plus className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-[15px]">
                              {isClaimingThis ? "Claiming..." : "Empty Spot"}
                            </h4>
                            <p className="text-[13px] text-zinc-500 mt-0.5">
                              Waiting for recruit
                            </p>
                          </div>
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <CreateTeamModal
            key="create-modal"
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateTeam}
            isPending={isPending && activeService === "CREATE_TEAM"}
            errorMsg={
              !state.success && state.error && activeService === "CREATE_TEAM"
                ? state.message
                : null
            }
            inputValue={newTeamInput}
            setInputValue={setNewTeamInput}
          />
        )}
        {recruitSlot && (
          <RecruitSlotModal
            key="recruit-modal"
            slot={recruitSlot}
            onClose={() => setRecruitSlot(null)}
            onClaim={handleClaimSlot}
            userDisciplines={userDisciplines}
            user={user}
            isPending={isPending && activeService === "CLAIM_SLOT"}
            errorMsg={
              !state.success && state.error && activeService === "CLAIM_SLOT"
                ? state.message
                : null
            }
          />
        )}
        {showNoTeamWarning && (
          <NoTeamWarningModal
            key="warning-modal"
            onClose={() => setShowNoTeamWarning(false)}
            onCreate={() => {
              setShowNoTeamWarning(false);
              setShowCreateModal(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
