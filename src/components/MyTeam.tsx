"use client";

import React, {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Plus,
  Users,
  AlertCircle,
  MapPin,
  Settings,
  Link as LinkIcon,
  Target,
  Trophy,
  ArrowRight,
  CheckCircle2,
  LogOut,
  UserMinus,
  Loader2,
  Trash2,
  Check,
} from "lucide-react";
import {
  ActionResponse,
  Discipline,
  RosterEntry,
  SessionAthleteData,
  Team,
  TeamActionPayload,
} from "../type/teamType";
import { useStateContext } from "../context/useContext";
import { teamAction } from "../actions/MyTeamAction";
import { DISCIPLINE_CONFIG } from "./AthleteMarket";
import { DashboardSkeleton } from "./Sekeltons";
import { NoTeamWarningModal, RecruitSlotModal } from "./NoTeamPopu";
import { CreateTeamModal } from "./CreateTeameModel";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_DISCIPLINES: Discipline[] = ["SWIMMER", "CYCLIST", "RUNNER"];

const initialState: ActionResponse = {
  success: false,
  error: false,
  message: "",
  data: null,
};

// ─── Animation Variants ───────────────────────────────────────────────────────

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
} as const;

export const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyTeam() {
  const { user } = useStateContext();
  const athlete = user?.athleteData as SessionAthleteData | undefined;

  const [state, dispatcher, isPending] = useActionState<
    ActionResponse,
    TeamActionPayload
  >(teamAction, initialState);

  const activeServiceRef = useRef<string | null>(null);

  const [isInitialFetch, setIsInitialFetch] = useState(true);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNoTeamWarning, setShowNoTeamWarning] = useState(false);
  const [recruitSlot, setRecruitSlot] = useState<Discipline | null>(null);
  const [newTeamInput, setNewTeamInput] = useState("");
  const [serviceError, setServiceError] = useState<{
    service: string;
    message: string | null;
  } | null>(null);

  const userDisciplines: Discipline[] =
    (athlete?.disciplines as Discipline[]) ?? [];

  // True only when the logged-in user created this team.
  // Non-owners (members) can see the team but cannot delete it or remove others.
  const isOwner = !!teamData && !!user?.userId && teamData.ownerId === user?.userId;

  // console.log("userID", teamData);

  // ─── Initial fetch ───────────────────────────────────────────────────────

  useEffect(() => {
    activeServiceRef.current = "GET_TEAM";
    startTransition(() => dispatcher({ service: "GET_TEAM" }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── State sync ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (isPending) return;

    const service = activeServiceRef.current;

    if (service === "GET_TEAM") setIsInitialFetch(false);

    if (state.success) {
      setServiceError(null);

      switch (service) {
        case "GET_TEAM":
          setTeamData((state.data as Team) ?? null);
          activeServiceRef.current = null;
          setActiveTarget(null);
          break;

        case "CREATE_TEAM":
          setTeamData(state.data as Team);
          setShowCreateModal(false);
          setNewTeamInput("");
          activeServiceRef.current = null;
          setActiveTarget(null);
          break;

        case "DELETE_TEAM":
          setTeamData(null);
          setShowSettings(false);
          activeServiceRef.current = null;
          setActiveTarget(null);
          window.location.reload();
          break;

        case "CLAIM_SLOT":
        case "REMOVE_FROM_TEAM":
          setRecruitSlot(null);
          activeServiceRef.current = null;
          setActiveTarget(null);
          window.location.reload();
          break;

        default:
          activeServiceRef.current = null;
          setActiveTarget(null);
      }
    }

    if (state.error) {
      setServiceError({ service: service ?? "", message: state.message! });
      setActiveTarget(null);
    }
  }, [state, isPending]); // eslint-disable-line react-hooks/exhaustive-deps

  console.log(user);
  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleCreateTeam = () => {
    if (!newTeamInput.trim() || isPending) return;
    setServiceError(null);
    activeServiceRef.current = "CREATE_TEAM";
    startTransition(() =>
      dispatcher({ service: "CREATE_TEAM", teamName: newTeamInput }),
    );
  };

  const handleClaimSlot = (role: Discipline) => {
    if (!teamData?.id || isPending) return;
    setServiceError(null);
    activeServiceRef.current = "CLAIM_SLOT";
    setActiveTarget(role);
    startTransition(() =>
      dispatcher({ service: "CLAIM_SLOT", role, teamId: teamData.id }),
    );
  };

  const handleRemoveFromTeam = (memberId: string) => {
    if (!teamData?.id || isPending) return;
    setServiceError(null);
    activeServiceRef.current = "REMOVE_FROM_TEAM";
    setActiveTarget(memberId);
    startTransition(() =>
      dispatcher({
        service: "REMOVE_FROM_TEAM",
        memberId,
        teamId: teamData.id,
      }),
    );
  };

  const handleDeleteTeam = () => {
    if (!teamData?.id || isPending) return;
    setServiceError(null);
    activeServiceRef.current = "DELETE_TEAM";
    setActiveTarget("TEAM_DELETE");
    startTransition(() =>
      dispatcher({ service: "DELETE_TEAM", teamId: teamData.id }),
    );
  };

  const handleShareLink = () => {
    if (!teamData?.id) return;
    const url = `${window.location.origin}/teams/${teamData.id}`;
    const el = document.createElement("textarea");
    el.value = url;
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand("copy");
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      // silent
    }
    document.body.removeChild(el);
  };

  // ─── Derived Data ─────────────────────────────────────────────────────────

  const getFormattedPaces = (): string => {
    const results = athlete?.raceResults ?? [];
    if (!results.length) return "Paces Pending";
    return results
      .slice(0, 2)
      .map((r) => `${formatSeconds(r.timeSeconds)} ${r.distance}`)
      .join(" • ");
  };

  const roster: RosterEntry[] = ALL_DISCIPLINES.map((disciplineKey) => {
    const config = DISCIPLINE_CONFIG[disciplineKey];
    const hasSkill = userDisciplines.includes(disciplineKey);

    if (teamData?.members) {
      const memberInRole = teamData.members.find(
        (m) => m.role === disciplineKey,
      );
      return {
        memberId: memberInRole?.id ?? null,
        role: config.label,
        discipline: disciplineKey,
        filled: !!memberInRole,
        name: memberInRole?.user.athleteProfile?.displayName ?? null,
        isMe: memberInRole?.userId === athlete?.userId,
        hasSkill,
        img: memberInRole?.user.profileImage ?? null,
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
    isInitialFetch ||
    (isPending && activeServiceRef.current === "GET_TEAM" && !teamData);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-300/30 p-4 sm:p-6 lg:p-8 relative w-full overflow-hidden">
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
            {/* ── Header ── */}
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
                    {athlete?.experienceLevel
                      ? String(athlete.experienceLevel).toLowerCase()
                      : "Pending"}
                  </span>
                </div>
              </div>
            </header>

            {/* ── Team Banner ── */}
            {!teamData ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-zinc-800/80 rounded-[1.25rem] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden"
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
                className="bg-zinc-950 border border-zinc-800 rounded-[1.25rem] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative  shadow-xl"
              >
                <div className="absolute top-[-50%] right-[-10%] w-[40%] h-[200%] bg-blue-300/5 rounded-full blur-[80px] pointer-events-none" />

                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-blue-300/10 border border-blue-300/20 rounded-2xl flex items-center justify-center shadow-inner">
                    <Shield className="w-7 h-7 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                      {teamData.name}
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />{" "}
                      {athlete?.locationCity ?? "Location"} Based
                    </p>
                    {!isOwner && (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-md">
                        Member
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
                  <button
                    onClick={handleShareLink}
                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      shareStatus === "copied"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
                    }`}
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

                  {/* Settings gear — only visible to the team owner */}
                  {isOwner && (
                    <div className="relative z-100">
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2.5 border rounded-xl transition-all cursor-pointer ${
                          showSettings
                            ? "bg-zinc-800 text-white border-zinc-600 shadow-inner"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Settings className="w-5 h-5" />
                      </button>

                      <AnimatePresence>
                        {showSettings && (
                          <>
                            <div
                              className="fixed inset-0 z-80"
                              onClick={() => setShowSettings(false)}
                            />
                            {/* top-full opens downward — avoids being clipped by the banner */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -6 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -6 }}
                              className="absolute right-0 top-full mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50 p-1"
                            >
                              <button
                                onClick={handleDeleteTeam}
                                disabled={
                                  isPending &&
                                  activeServiceRef.current === "DELETE_TEAM"
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
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Roster Grid ── */}
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
                    activeServiceRef.current === "CLAIM_SLOT" &&
                    activeTarget === member.discipline;

                  const isRemovingThis =
                    isPending &&
                    activeServiceRef.current === "REMOVE_FROM_TEAM" &&
                    activeTarget === member.memberId;

                  const hasRemoveError =
                    serviceError?.service === "REMOVE_FROM_TEAM" &&
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
                            You
                          </span>
                        )}
                      </div>

                      {member.filled ? (
                        <div className="flex flex-col gap-2 mt-auto">
                          <div className="flex items-center gap-3 border border-zinc-800 p-4 rounded-xl bg-black shadow-inner">
                            {member.img ? (
                              <img
                                src={member.img}
                                alt={member.name ?? ""}
                                className="w-11 h-11 rounded-full border border-zinc-700 object-cover bg-zinc-900 shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4 text-zinc-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-[15px] leading-tight truncate">
                                {member.name ?? "Athlete"}
                              </h4>
                              <p className="text-xs text-emerald-500/80 font-medium mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Slot Filled
                              </p>
                            </div>

                            {/* Owner can remove anyone; non-owner can only leave their own slot */}
                            {member.memberId && (isOwner || member.isMe) && (
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
                              {serviceError?.message ?? "Action failed."}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!teamData) {
                              setShowNoTeamWarning(true);
                            } else {
                              setRecruitSlot(member.discipline);
                            }
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

      {/* ── Modals ── */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTeamModal
            key="create-modal"
            onClose={() => {
              setShowCreateModal(false);
              setServiceError(null);
            }}
            onSubmit={handleCreateTeam}
            isPending={isPending && activeServiceRef.current === "CREATE_TEAM"}
            errorMsg={
              serviceError?.service === "CREATE_TEAM"
                ? serviceError.message
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
            onClose={() => {
              setRecruitSlot(null);
              setServiceError(null);
            }}
            FromWhere="MyTeamDashboard"
            onClaim={handleClaimSlot}
            userDisciplines={userDisciplines}
            user={user}
            isPending={isPending && activeServiceRef.current === "CLAIM_SLOT"}
            errorMsg={
              serviceError?.service === "CLAIM_SLOT"
                ? serviceError.message
                : null
            }
          />
        )}

        {showNoTeamWarning && (
          <NoTeamWarningModal
            FromWhere=""
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
