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
  Timer,
} from "lucide-react";
import { inviteAction } from "../actions/InviteAction";
import { InviteActionPayload } from "../type/inviteTypes";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";

interface RaceResult {
  discipline: Discipline;
  distance: string;
  timeSeconds: number;
}

export interface InviteTarget {
  userId: string;
  displayName: string;
  locationCity: string | null;
  profileImage: string | null;
  disciplines: Discipline[];
  invitedRoles: Discipline[];
  experienceLevel: string | null;
  trainingDaysPerWeek: number | null;
  raceResults: RaceResult[]; // ← Updated to use raceResults array
}

interface InviteAthleteModalProps {
  inviteTarget: InviteTarget;
  missingSlots: Discipline[];
  hasTeam: boolean;
  onClose: () => void;
  onInviteSent: () => void;
}

const DISCIPLINE_CONFIG: Record<Discipline, any> = {
  SWIMMER: {
    label: "Swimmer",
    bg: "bg-cyan-500/10",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    icon: Waves,
  },
  CYCLIST: {
    label: "Cyclist",
    bg: "bg-orange-500/10",
    color: "text-orange-400",
    border: "border-orange-500/20",
    icon: Bike,
  },
  RUNNER: {
    label: "Runner",
    bg: "bg-lime-500/10",
    color: "text-lime-400",
    border: "border-lime-500/20",
    icon: Footprints,
  },
};

type LocalState = {
  success: boolean;
  error: boolean;
  message: string | null;
  data: null;
};
const initialState: LocalState = {
  success: false,
  error: false,
  message: null,
  data: null,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const getBestPace = (raceResults: RaceResult[], role: Discipline) => {
  const results = raceResults.filter((r) => r.discipline === role);
  if (!results.length) return null;

  const best = results.sort((a, b) => a.timeSeconds - b.timeSeconds)[0];
  const h = Math.floor(best.timeSeconds / 3600);
  const m = Math.floor((best.timeSeconds % 3600) / 60);
  const s = best.timeSeconds % 60;

  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  return `${timeStr} / ${best.distance}`;
};

// ─── OVERLAYS ────────────────────────────────────────────────────────────────

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
    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5">
      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
    </div>
    <h3 className="text-xl font-black text-white tracking-tight mb-2">
      Invite Sent
    </h3>
    <p className="text-sm text-zinc-400 text-center leading-relaxed mb-8">
      Your invitation to{" "}
      <span className="text-white font-semibold">{name}</span> as{" "}
      <span className="text-white font-semibold">{role}</span> has been
      delivered.
    </p>
    <button
      onClick={onClose}
      className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-xl font-bold text-sm transition-colors"
    >
      Done
    </button>
  </motion.div>
);

const ErrorBanner = ({ message }: { message: string }) => (
  <motion.div
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function InviteAthleteModal({
  inviteTarget,
  missingSlots,
  hasTeam,
  onClose,
  onInviteSent,
}: InviteAthleteModalProps) {
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

  useEffect(() => {
    if (state.success && !isPending) {
      onInviteSent();
    }
  }, [state.success, isPending]);

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

  const showSuccess = state.success && !isPending;
  const showError = state.error && !isPending && !!state.message;
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(inviteTarget.displayName)}&background=18181b&color=ffffff&bold=true`;

  const guardState = !hasTeam
    ? "no_team"
    : availableRoles.length === 0
      ? "all_invited"
      : "ready";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-[#0a0a0a] border border-zinc-800 p-8 rounded-3xl w-full max-w-sm shadow-[0_50px_100px_rgba(0,0,0,1)] overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

        <AnimatePresence>
          {isPending && <PendingOverlay key="pending" />}
          {showSuccess && selectedRole && (
            <SuccessOverlay
              key="success"
              name={inviteTarget.displayName}
              role={selectedRole}
              onClose={onClose}
            />
          )}
        </AnimatePresence>

        <button
          onClick={onClose}
          disabled={isPending}
          className="absolute top-5 right-5 p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center relative z-10">
          <img
            src={inviteTarget.profileImage ?? avatarFallback}
            className="w-20 h-20 rounded-2xl border-2 border-zinc-800 mb-4 object-cover shadow-xl"
            alt="Athlete"
          />
          <h2 className="text-2xl font-black text-white tracking-tight">
            {inviteTarget.displayName}
          </h2>
          {inviteTarget.locationCity && (
            <div className="flex items-center gap-1.5 mt-1 text-zinc-400">
              <MapPin className="w-3.5 h-3.5" />{" "}
              <span className="text-xs font-bold">
                {inviteTarget.locationCity}
              </span>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2 mt-4 mb-6">
            {inviteTarget.disciplines.map((d) => {
              const cfg = DISCIPLINE_CONFIG[d];
              const isAvail = availableRoles.includes(d);
              return (
                <span
                  key={d}
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${isAvail ? `${cfg.bg} ${cfg.color} ${cfg.border}` : "bg-zinc-900 text-zinc-500 border-zinc-800"}`}
                >
                  <cfg.icon className="w-3 h-3" /> {cfg.label}
                </span>
              );
            })}
          </div>

          {guardState === "no_team" && (
            <div className="flex flex-col items-center gap-2 py-4">
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-white font-bold">No Team Yet</p>
              <p className="text-zinc-400 text-xs">
                Create a team to send invites.
              </p>
            </div>
          )}
          {guardState === "all_invited" && (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-white font-bold">Invited / Slots Full</p>
              <p className="text-zinc-400 text-xs">
                You either invited them already or your team slots are full.
              </p>
            </div>
          )}

          {guardState === "ready" && (
            <>
              {/* Dynamic Race Results Display */}
              <div className="w-full space-y-2 mb-6">
                {inviteTarget.disciplines.map((role) => {
                  const pace = getBestPace(inviteTarget.raceResults, role);
                  if (!pace) return null;
                  const cfg = DISCIPLINE_CONFIG[role];
                  return (
                    <div
                      key={role}
                      className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 flex justify-between items-center px-4"
                    >
                      <span className="text-[11px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                        <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />{" "}
                        {cfg.label}
                      </span>
                      <span className="text-sm font-bold text-white tabular-nums">
                        {pace}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Role selector */}
              {availableRoles.length > 1 && (
                <div className="flex flex-col gap-2 w-full mb-6">
                  <p className="text-[10px] uppercase font-bold text-zinc-500 text-left">
                    Invite For Slot:
                  </p>
                  {availableRoles.map((d) => {
                    const cfg = DISCIPLINE_CONFIG[d];
                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedRole(d)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedRole === d ? `${cfg.bg} ${cfg.border}` : "bg-zinc-900 border-zinc-800"}`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 ${selectedRole === d ? cfg.color : "text-zinc-700"}`}
                        />
                        <span
                          className={`text-[11px] font-black uppercase ${selectedRole === d ? cfg.color : "text-zinc-400"}`}
                        >
                          {cfg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <AnimatePresence mode="wait">
                {showError && (
                  <ErrorBanner key={state.message!} message={state.message!} />
                )}
              </AnimatePresence>

              <button
                onClick={handleSendInvite}
                disabled={isPending || !selectedRole}
                className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" /> Send Invite
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
