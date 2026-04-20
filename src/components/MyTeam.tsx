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
} from "lucide-react";
import { useStateContext } from "../context/useContext";
import { createTeamPayload } from "../type/dashboardtype";
import { createTeamAction, getMyTeamAction } from "../actions/dashboardAction";

// ─── MOCKED TYPES & CONTEXT FOR CANVAS PREVIEW ───
export type ActionResponse = {
  success: boolean;
  error: boolean;
  message: string | null;
  data: Record<string, unknown> | null;
};



// --- STYLING HELPERS ---
const roleStyles = {
  Swimmer: {
    icon: Waves,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-500/20",
    glow: "bg-cyan-500/20",
  },
  Cyclist: {
    icon: Bike,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-500/20",
    glow: "bg-amber-500/20",
  },
  Runner: {
    icon: Footprints,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-500/20",
    glow: "bg-emerald-500/20",
  },
};

const initialState: ActionResponse = {
  success: false,
  error: false,
  message: null,
  data: null,
};

const formatRole = (role: string) => {
  if (!role) return "";
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

export default function MyTeamDashboard() {
  const { user } = useStateContext();
  const athlete = user?.athleteData;

  // ─── SERVER ACTION STATES ───
  const [state, dispatcher, isPending] = useActionState<
    ActionResponse,
    createTeamPayload
  >(createTeamAction, initialState);
  const [getTeamState, getTeamDispatcher, getTeamIsPending] =
    useActionState<ActionResponse>(getMyTeamAction, initialState);

  // ─── LOCAL UI STATES ───
  const [teamName, setTeamName] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNoTeamWarning, setShowNoTeamWarning] = useState(false);
  const [newTeamInput, setNewTeamInput] = useState("");
  const [recruitSlot, setRecruitSlot] = useState<string | null>(null);

  const userDisciplines = athlete?.discipline || [];
  const userRolesFormatted = userDisciplines.map(formatRole).join(" and ");

  // ─── EFFECTS ───
  useEffect(() => {
    startTransition(() => {
      getTeamDispatcher();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (getTeamState.success && getTeamState.data) {
      setTeamName(String(getTeamState.data.name));
    }
  }, [getTeamState.success, getTeamState.data]);

  useEffect(() => {
    if (state.success && state.message === "Team created successfully") {
      setShowCreateModal(false);
      setNewTeamInput("");

      if (state.data) {
        setTeamName(String(state.data.name));
      } else {
        startTransition(() => {
          getTeamDispatcher();
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ─── HANDLERS ───
  const handleCreateTeam = () => {
    if (!newTeamInput.trim()) return;
    startTransition(() => {
      dispatcher({ teamName: newTeamInput });
    });
  };

  const handleClaimSlot = () => {
    console.log(`Claiming slot: ${recruitSlot}`);
    setRecruitSlot(null);
  };

  const getFormattedPaces = () => {
    if (!athlete) return "Paces Pending";
    const p = [];
    if (athlete.swimTime100m) p.push(`${athlete.swimTime100m}s 100m`);
    if (athlete.cycleTime10km) p.push(`${athlete.cycleTime10km}m 10k`);
    if (athlete.runTime5km) p.push(`${athlete.runTime5km}m 5k`);
    return p.join(" • ") || "Paces Pending";
  };

  const getRoster = () => {
    const roles = ["Swimmer", "Cyclist", "Runner"];
    const fetchedTeam = getTeamState.data || state.data;

    return roles.map((role) => {
      const isMyRole = userDisciplines.some(
        (d: string) => d.toLowerCase() === role.toLowerCase(),
      );

      if (fetchedTeam && fetchedTeam.members) {
        const members = fetchedTeam.members as any[];
        const memberInRole = members.find(
          (m: any) => m.role.toLowerCase() === role.toLowerCase(),
        );
        return {
          role,
          filled: !!memberInRole,
          name:
            memberInRole?.user?.displayName ||
            memberInRole?.user?.athleteProfile?.displayName ||
            null,
          isMe: memberInRole?.userId === athlete?.userId,
          hasSkill: isMyRole,
          img: memberInRole?.user?.profileImage || null,
        };
      }

      return {
        role,
        filled: false,
        name: isMyRole ? athlete?.displayName || user?.displayName : null,
        isMe: isMyRole,
        hasSkill: isMyRole,
        img: isMyRole ? athlete?.profileImage || user?.profileImage : null,
      };
    });
  };

  const roster = getRoster();
  const missingRoles = roster.filter(
    (member) => !member.filled && !member.isMe,
  );
  const missingRolesText = missingRoles.map((r) => r.role).join(" and ");

  // ─── SKELETON LOADER ───
  if (getTeamIsPending && !getTeamState.data && !getTeamState.error) {
    return (
      <div className="min-h-screen bg-black p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-10 animate-pulse">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-3">
              <div className="h-8 w-40 bg-zinc-900 rounded-lg" />
              <div className="h-4 w-64 bg-zinc-900/50 rounded-lg" />
            </div>
            <div className="h-10 w-48 bg-zinc-900 rounded-xl" />
          </div>
          <div className="h-[120px] w-full bg-zinc-900/40 rounded-[1.25rem] border border-zinc-800/50" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-zinc-900 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 bg-zinc-900/30 rounded-2xl border border-zinc-800/40"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-300/30 p-4 sm:p-6 lg:p-8 relative">
      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        {/* ─── HEADER ─── */}
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

        {/* ─── DYNAMIC BANNER ─── */}
        {!teamName ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0a0a0a] border border-zinc-800/80 rounded-[1.25rem] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="flex items-start md:items-center gap-5">
              <div className="w-12 h-12 rounded-full border border-[#f59e0b]/30 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-[#f59e0b]" />
              </div>
              <div>
                <h2 className="text-[1.35rem] font-bold text-white mb-1.5 tracking-tight">
                  No Team Yet
                </h2>
                <p className="text-zinc-400 text-[15px] leading-snug">
                  You specialize as a {userRolesFormatted}. Create a team to
                  start recruiting a {missingRolesText}.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full md:w-auto px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              Create Team <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 rounded-[1.25rem] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-[-50%] right-[-10%] w-[40%] h-[200%] bg-blue-300/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 bg-blue-300/10 border border-blue-300/20 rounded-2xl flex items-center justify-center shadow-inner">
                <Shield className="w-8 h-8 text-blue-300" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                  {teamName}
                </h2>
                <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />{" "}
                  {athlete?.locationCity || "Location"} Based
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
              <button className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
                <LinkIcon className="w-4 h-4" /> Share Link
              </button>
              <button className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ─── ROSTER GRID ─── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" />{" "}
              {teamName ? "Roster" : "Your Spots"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roster.map((member) => {
              const style = roleStyles[member.role as keyof typeof roleStyles];
              const Icon = style.icon;

              return (
                <div
                  key={member.role}
                  className="relative p-5 rounded-[1.25rem] bg-[#0a0a0a] border border-zinc-800/80 transition-all flex flex-col min-h-[160px]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${style.color} ${style.bg} ${style.border}`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {member.role}
                    </div>
                    {member.hasSkill && (
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800">
                        YOU
                      </span>
                    )}
                  </div>

                  {member.filled ? (
                    <div className="flex items-center gap-4 mt-auto border border-zinc-800/50 p-3 rounded-xl bg-zinc-950/50">
                      {member.img ? (
                        <img
                          src={member.img}
                          alt={member.name || ""}
                          className="w-12 h-12 rounded-full border border-zinc-800 object-cover bg-zinc-900"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                          <Users className="w-5 h-5 text-zinc-500" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-[15px] leading-tight">
                          {member.name}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Joined Team
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (!teamName) setShowNoTeamWarning(true);
                        else setRecruitSlot(member.role);
                      }}
                      className="flex w-full items-center gap-4 group text-left cursor-pointer transition-all mt-auto p-3 rounded-xl border border-zinc-700 hover:border-zinc-500 bg-transparent hover:bg-zinc-900/40"
                    >
                      <div className="w-12 h-12 rounded-full border border-zinc-600 flex items-center justify-center group-hover:border-zinc-500 transition-all shrink-0">
                        <Plus className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-[15px] transition-colors">
                          Empty Spot
                        </h4>
                        <p className="text-[13px] text-zinc-500 mt-0.5">
                          Waiting for recruit
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ─── POPUPS / MODALS ─── */}
      <AnimatePresence>
        {/* CREATE TEAM MODAL */}
        {showCreateModal && (
          <div
            key="create-team-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setShowCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[1.5rem] p-8 shadow-2xl z-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300/10 rounded-full blur-[80px] pointer-events-none" />
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-white bg-zinc-900/80 rounded-full transition-colors cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col relative z-10">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                  Create Your Team
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Pick a name for your team. You'll automatically take the spots
                  for the sports you do.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {userDisciplines.map((d: string, index: number) => {
                    const fRole = formatRole(d);
                    const style = roleStyles[fRole as keyof typeof roleStyles];
                    const Icon = style.icon;
                    return (
                      <motion.div
                        key={d}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15 }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${style.bg} ${style.border}`}
                      >
                        <Icon className={`w-4 h-4 ${style.color}`} />
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${style.color}`}
                        >
                          {fRole}
                        </span>
                        <span className="text-xs bg-black/40 px-1.5 py-0.5 rounded text-white ml-1">
                          YOU
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Team Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Austin Tri-Force"
                      value={newTeamInput}
                      onChange={(e) => setNewTeamInput(e.target.value)}
                      disabled={isPending}
                      className="w-full bg-black border border-zinc-800 focus:border-blue-300 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-700 outline-none transition-all shadow-inner font-medium"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateTeam}
                  disabled={newTeamInput.trim() === "" || isPending}
                  className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${newTeamInput.trim() === "" || isPending ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed" : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]"}`}
                >
                  <Shield className="w-5 h-5" />{" "}
                  {isPending ? "Creating Team..." : "Create Team"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MANAGE SLOT / ADD TEAMMATE POPUP */}
        {recruitSlot && (
          <div
            key="recruit-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRecruitSlot(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-[1.5rem] p-8 shadow-2xl z-10 overflow-hidden"
            >
              <div
                className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] ${roleStyles[recruitSlot as keyof typeof roleStyles]?.glow} rounded-full blur-[80px] pointer-events-none`}
              />

              <button
                onClick={() => setRecruitSlot(null)}
                className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-white bg-zinc-900/80 rounded-full transition-colors cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col mt-2 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-12 h-12 ${roleStyles[recruitSlot as keyof typeof roleStyles]?.bg} ${roleStyles[recruitSlot as keyof typeof roleStyles]?.border} border rounded-full flex items-center justify-center shadow-inner`}
                  >
                    {React.createElement(
                      roleStyles[recruitSlot as keyof typeof roleStyles]
                        ?.icon || UserPlus,
                      {
                        className: `w-6 h-6 ${roleStyles[recruitSlot as keyof typeof roleStyles]?.color}`,
                      },
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">
                      Fill this Spot
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Who will be the {recruitSlot}?
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  {/* Conditional: If User HAS the skill for this slot */}
                  {userDisciplines.some(
                    (d: string) =>
                      d.toLowerCase() === recruitSlot.toLowerCase(),
                  ) && (
                    <button
                      onClick={handleClaimSlot}
                      className="w-full text-left p-4 rounded-xl border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 transition-colors flex items-center gap-4 group cursor-pointer"
                    >
                      <img
                        src={user?.profileImage || ""}
                        alt="You"
                        className="w-12 h-12 rounded-full border border-zinc-700 object-cover opacity-80 group-hover:opacity-100 transition-opacity bg-zinc-950"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                      <div>
                        <h4 className="font-bold text-white text-[15px]">
                          Take this spot
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs text-zinc-400">
                            You play this sport:
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${roleStyles[recruitSlot as keyof typeof roleStyles]?.color} ${roleStyles[recruitSlot as keyof typeof roleStyles]?.bg} ${roleStyles[recruitSlot as keyof typeof roleStyles]?.border}`}
                          >
                            {recruitSlot}
                          </span>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Always Available: Search Athletes */}
                  <button
                    onClick={() => setRecruitSlot(null)}
                    className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-black hover:bg-zinc-900 transition-colors flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center shrink-0">
                      <Search className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-[15px]">
                        Find a Teammate
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Look for a {recruitSlot} to join
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* NO TEAM WARNING POPUP */}
        {showNoTeamWarning && (
          <div
            key="warning-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNoTeamWarning(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-[1.5rem] p-8 shadow-2xl z-10 overflow-hidden"
            >
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#f59e0b]/10 rounded-full blur-[80px] pointer-events-none" />
              <button
                onClick={() => setShowNoTeamWarning(false)}
                className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-white bg-zinc-900/80 rounded-full transition-colors cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center text-center mt-2 relative z-10">
                <div className="w-20 h-20 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-full flex items-center justify-center mb-5 shadow-inner">
                  <AlertCircle className="w-10 h-10 text-[#f59e0b]" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                  You don't have a team yet.
                </h3>
                <p className="text-sm text-zinc-400 mb-8 px-2 leading-relaxed">
                  Please create your team first. Then you can invite others.
                </p>
                <button
                  onClick={() => {
                    setShowNoTeamWarning(false);
                    setShowCreateModal(true);
                  }}
                  className="w-full py-3.5 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Create a Team
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
