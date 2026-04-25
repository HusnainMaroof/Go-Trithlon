"use client";

import React, {
  useState,
  useEffect,
  startTransition,
  useActionState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Waves,
  Bike,
  Footprints,
  UserPlus,
  CheckCircle2,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { inviteAction } from "../actions/InviteAction";
import { InviteActionPayload } from "../type/inviteTypes";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";

interface DisciplineConfig {
  label: string;
  bg: string;
  color: string;
  border: string;
  icon: React.ElementType;
}

interface InviteTarget {
  userId: string;
  displayName: string;
  locationCity: string | null;
  profileImage: string | null;
  disciplines: Discipline[];
  invitedRoles: Discipline[];
  experienceLevel: string | null;
  trainingDaysPerWeek: number | null;
  swimTime100m: number | null;
  cycleTime10km: number | null;
  runTime5km: number | null;
}

interface InviteAthleteModalProps {
  inviteTarget: InviteTarget;
  missingSlots: Discipline[];
  hasTeam: boolean;
  setInviteTarget: (target: null) => void;
  onInviteSent: () => void; // closes modal + triggers marketplace refetch
  DISCIPLINE_CONFIG: Record<Discipline, DisciplineConfig>;
}

type LocalState =
  | { success: false; error: false; message: null; data: null }
  | { success: true; error: false; message: null; data: null }
  | { success: false; error: true; message: string; data: null };

const initialState: LocalState = {
  success: false,
  error: false,
  message: null,
  data: null,
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const PendingOverlay = () => (
  <motion.div
    key="pending"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0a0a0a]/90 rounded-2xl backdrop-blur-sm"
  >
    <div className="relative flex items-center justify-center mb-4">
      <div className="absolute w-16 h-16 rounded-full border border-zinc-700 animate-ping opacity-20" />
      <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-white animate-spin" />
      </div>
    </div>
    <p className="text-sm font-semibold text-zinc-300 tracking-wide">
      Sending invite...
    </p>
    <p className="text-xs text-zinc-600 mt-1">This will only take a moment</p>
  </motion.div>
);

const SuccessOverlay = ({
  name,
  role,
  onClose,
}: {
  name: string;
  role: Discipline;
  onClose: () => void;
}) => (
  <motion.div
    key="success"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0a0a0a]/95 rounded-2xl backdrop-blur-sm px-6"
  >
    <div className="relative flex items-center justify-center mb-5">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 12,
            delay: 0.2,
          }}
        >
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </motion.div>
      </motion.div>
    </div>
    <motion.h3
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="text-xl font-black text-white tracking-tight mb-2"
    >
      Invite Sent
    </motion.h3>
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-sm text-zinc-400 text-center leading-relaxed mb-8"
    >
      Your invitation to{" "}
      <span className="text-white font-semibold">{name}</span> as{" "}
      <span className="text-white font-semibold">{role}</span> has been
      delivered.
    </motion.p>
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      onClick={onClose}
      className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
    >
      Done
    </motion.button>
  </motion.div>
);

const ErrorBanner = ({ message }: { message: string }) => (
  <motion.div
    key={message}
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    className="w-full mb-4 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
  >
    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
    <p className="text-xs text-red-300 font-medium leading-relaxed">
      {message}
    </p>
  </motion.div>
);

// availableRoles = athlete disciplines ∩ team missing slots − already invited
const RoleSelector = ({
  availableRoles,
  selected,
  onSelect,
  config,
}: {
  availableRoles: Discipline[];
  selected: Discipline;
  onSelect: (d: Discipline) => void;
  config: Record<Discipline, DisciplineConfig>;
}) => {
  // Single role — show as read-only pill, no choice needed
  if (availableRoles.length === 1) {
    const d = availableRoles[0];
    const cfg = config[d];
    const Icon = cfg.icon;
    return (
      <div className="w-full mb-6">
        <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">
          Invite For Role
        </p>
        <div
          className={`w-full py-2.5 px-4 rounded-xl border text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 ${cfg.bg} ${cfg.color} ${cfg.border}`}
        >
          <Icon className="w-3.5 h-3.5" />
          {cfg.label}
        </div>
      </div>
    );
  }

  // Multiple available roles — let user pick
  return (
    <div className="w-full mb-6">
      <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">
        Invite For Role
        <span className="ml-1 text-zinc-600 normal-case tracking-normal font-medium">
          — pick one
        </span>
      </p>
      <div className="flex flex-col gap-2">
        {availableRoles.map((d) => {
          const cfg = config[d];
          const Icon = cfg.icon;
          const isSelected = selected === d;
          return (
            <button
              key={d}
              onClick={() => onSelect(d)}
              className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? `${cfg.bg} ${cfg.border} shadow-sm`
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isSelected ? `${cfg.bg} ${cfg.border} border` : "bg-zinc-800"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isSelected ? cfg.color : "text-zinc-500"}`}
                />
              </div>
              <div className="flex-1 text-left">
                <p
                  className={`font-black text-[11px] uppercase tracking-wider ${isSelected ? cfg.color : "text-zinc-300"}`}
                >
                  {cfg.label}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Open slot on your team
                </p>
              </div>
              {isSelected && (
                <CheckCircle2 className={`w-4 h-4 ${cfg.color} shrink-0`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const InviteAthleteModal = ({
  setInviteTarget,
  inviteTarget,
  missingSlots,
  hasTeam,
  onInviteSent,
  DISCIPLINE_CONFIG,
}: InviteAthleteModalProps) => {
  // Roles this athlete can fill ∩ team needs ∩ not yet invited
  const availableRoles: Discipline[] = inviteTarget.disciplines.filter(
    (d) => missingSlots.includes(d) && !inviteTarget.invitedRoles.includes(d),
  );

  const [state, dispatcher, isPending] = useActionState<
    LocalState,
    InviteActionPayload
  >(inviteAction as any, initialState);

  const [selectedRole, setSelectedRole] = useState<Discipline | null>(
    availableRoles[0] ?? null,
  );

  // When invite succeeds — fire parent refetch, which also closes modal
  useEffect(() => {
    if (state.success && !isPending) {
      onInviteSent();
    }
  }, [state.success, isPending]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendInvite = () => {
    if (!selectedRole || !inviteTarget.userId || isPending) return;
    startTransition(() => {
      dispatcher({
        service: "SEND_INVITE",
        toUserId: inviteTarget.userId,
        role: selectedRole as any,
      });
    });
  };

  const handleClose = () => {
    if (!isPending) setInviteTarget(null);
  };

  const showSuccess = state.success && !isPending;
  const showError = state.error && !isPending && !!state.message;

  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    inviteTarget.displayName,
  )}&background=18181b&color=ffffff&size=128&bold=true`;

  // Priority: no team → no matching slot → all roles already invited → ready
  const guardState: "no_team" | "no_slot" | "all_invited" | "ready" = (() => {
    if (!hasTeam) return "no_team";
    const invitableAtAll = inviteTarget.disciplines.filter((d) =>
      missingSlots.includes(d),
    );
    if (invitableAtAll.length === 0) return "no_slot";
    if (availableRoles.length === 0) return "all_invited";
    return "ready";
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="relative bg-[#0a0a0a] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm shadow-[0_50px_100px_rgba(0,0,0,1)] overflow-hidden"
      >
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Overlay states */}
        <AnimatePresence>
          {isPending && <PendingOverlay key="pending" />}
          {showSuccess && selectedRole && (
            <SuccessOverlay
              key="success"
              name={inviteTarget.displayName}
              role={selectedRole}
              onClose={handleClose}
            />
          )}
        </AnimatePresence>

        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isPending}
          className="absolute top-5 right-5 p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer z-20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mt-2 relative z-10">
          {/* Avatar */}
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
            <img
              src={inviteTarget.profileImage ?? avatarFallback}
              className="w-20 h-20 rounded-full border-2 border-zinc-700 shadow-2xl relative z-10 object-cover"
              alt={inviteTarget.displayName}
              onError={(e) => {
                e.currentTarget.src = avatarFallback;
                e.currentTarget.onerror = null;
              }}
            />
          </div>

          {/* Name + location */}
          <h2 className="text-2xl font-black text-white tracking-tight">
            {inviteTarget.displayName}
          </h2>
          {inviteTarget.locationCity && (
            <div className="flex items-center gap-1 mt-1 mb-1">
              <MapPin className="w-3 h-3 text-zinc-500" />
              <span className="text-[11px] text-zinc-400 font-bold">
                {inviteTarget.locationCity}
              </span>
            </div>
          )}

          {/* All discipline pills — amber if pending, coloured if available, grey if filled */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 mb-6">
            {inviteTarget.disciplines.map((d) => {
              const cfg = DISCIPLINE_CONFIG[d];
              const isAlreadyInvited = inviteTarget.invitedRoles.includes(d);
              const isAvailable = availableRoles.includes(d);
              return (
                <span
                  key={d}
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                    isAlreadyInvited
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : isAvailable
                        ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                        : "bg-zinc-900 text-zinc-500 border-zinc-800"
                  }`}
                >
                  {cfg.label}
                  {isAlreadyInvited && (
                    <span className="text-[8px] text-amber-400/70 font-bold">
                      · Pending
                    </span>
                  )}
                  {!isAvailable && !isAlreadyInvited && (
                    <span className="text-[8px] text-zinc-600 font-bold">
                      · Filled
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          {/* ── GUARD STATES ── */}
          {guardState === "no_team" && (
            <div className="flex flex-col items-center gap-3 py-4 w-full">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-white font-bold">No Team Yet</p>
              <p className="text-zinc-400 text-sm">
                Create a team before sending invites.
              </p>
            </div>
          )}

          {guardState === "no_slot" && (
            <div className="flex flex-col items-center gap-3 py-4 w-full">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-white font-bold">No Matching Slots</p>
              <p className="text-zinc-400 text-sm">
                This athlete's disciplines don't match your open team slots.
              </p>
            </div>
          )}

          {guardState === "all_invited" && (
            <div className="flex flex-col items-center gap-3 py-4 w-full">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-white font-bold">Already Invited</p>
              <p className="text-zinc-400 text-sm">
                You've already sent pending invites for all matching roles.
              </p>
            </div>
          )}

          {guardState === "ready" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 w-full mb-6">
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 flex flex-col items-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                    Experience
                  </span>
                  <span className="text-sm font-bold text-white capitalize">
                    {inviteTarget.experienceLevel?.toLowerCase() ?? "—"}
                  </span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 flex flex-col items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                    Training
                  </span>
                  <span className="text-sm font-bold text-white">
                    {inviteTarget.trainingDaysPerWeek
                      ? `${inviteTarget.trainingDaysPerWeek} Days/Wk`
                      : "—"}
                  </span>
                </div>

                {inviteTarget.swimTime100m != null && (
                  <div className="col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 flex justify-between items-center px-4">
                    <span className="text-[11px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                      <Waves className="w-3.5 h-3.5 text-cyan-400" /> Swim
                    </span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {inviteTarget.swimTime100m}s / 100m
                    </span>
                  </div>
                )}
                {inviteTarget.cycleTime10km != null && (
                  <div className="col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 flex justify-between items-center px-4">
                    <span className="text-[11px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                      <Bike className="w-3.5 h-3.5 text-amber-400" /> Cycle
                    </span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {inviteTarget.cycleTime10km}m / 10k
                    </span>
                  </div>
                )}
                {inviteTarget.runTime5km != null && (
                  <div className="col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 flex justify-between items-center px-4">
                    <span className="text-[11px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                      <Footprints className="w-3.5 h-3.5 text-emerald-400" />{" "}
                      Run
                    </span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {inviteTarget.runTime5km}m / 5k
                    </span>
                  </div>
                )}
              </div>

              {/* Role selector */}
              {selectedRole !== null && (
                <RoleSelector
                  availableRoles={availableRoles}
                  selected={selectedRole}
                  onSelect={setSelectedRole}
                  config={DISCIPLINE_CONFIG}
                />
              )}

              {/* Error banner */}
              <AnimatePresence mode="wait">
                {showError && (
                  <ErrorBanner key={state.message!} message={state.message!} />
                )}
              </AnimatePresence>

              {/* CTA */}
              <button
                onClick={handleSendInvite}
                disabled={isPending || !selectedRole}
                className="w-full py-4 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-black rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                Send Invite{selectedRole ? ` as ${selectedRole}` : ""}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default InviteAthleteModal;
