// components/InvitesDashboard.tsx
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
  Bell,
  Shield,
  Waves,
  Bike,
  Footprints,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Users,
  Inbox,
  Check,
  X,
  ChevronRight,
  Send,
} from "lucide-react";
import { Discipline } from "../generated/prisma/enums";
import {
  ActionResponse,
  InviteActionPayload,
  InvitesData,
  ReceivedInvite,
  SentInvite,
} from "../type/inviteTypes";
import { inviteAction } from "../actions/InviteAction";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type LocalInviteStatus =
  | { phase: "idle" }
  | { phase: "accepting" }
  | { phase: "rejecting" }
  | { phase: "accepted" }
  | { phase: "rejected" }
  | { phase: "error"; message: string };

type StatusSetter = React.Dispatch<React.SetStateAction<LocalInviteStatus>>;

type Tab = "received" | "sent";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

type DisciplineConfig = {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  accent: string;
};

const DISCIPLINE_CONFIG: Record<Discipline, DisciplineConfig> = {
  SWIMMER: {
    label: "Swimmer",
    icon: Waves,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-500/30",
    accent: "from-transparent via-cyan-500/60 to-transparent",
  },
  CYCLIST: {
    label: "Cyclist",
    icon: Bike,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-500/30",
    accent: "from-transparent via-amber-500/60 to-transparent",
  },
  RUNNER: {
    label: "Runner",
    icon: Footprints,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-500/30",
    accent: "from-transparent via-emerald-500/60 to-transparent",
  },
};

const initialState: ActionResponse<InvitesData> = {
  success: false,
  error: false,
  message: null,
  data: null,
};

// ─── STATUS REGISTRY ──────────────────────────────────────────────────────────

const statusRegistry = new Map<string, StatusSetter>();

function StatusUpdaterPortal({
  inviteId,
  setStatus,
}: {
  inviteId: string;
  setStatus: StatusSetter;
}) {
  useEffect(() => {
    statusRegistry.set(inviteId, setStatus);
    return () => {
      statusRegistry.delete(inviteId);
    };
  }, [inviteId, setStatus]);
  return null;
}

// ─── SKELETON ────────────────────────────────────────────────────────────────

function InviteSkeleton() {
  return (
    <div className="bg-[#0a0a0a] border border-zinc-800/60 rounded-2xl p-6 space-y-4 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
      />
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-zinc-800/60 rounded-xl" />
          <div className="space-y-2">
            <div className="w-32 h-4 bg-zinc-800/60 rounded" />
            <div className="w-20 h-3 bg-zinc-800/40 rounded" />
          </div>
        </div>
        <div className="w-20 h-7 bg-zinc-800/60 rounded-xl" />
      </div>
      <div className="w-full h-14 bg-zinc-800/40 rounded-xl" />
      <div className="flex gap-2.5">
        <div className="flex-1 h-10 bg-zinc-800/40 rounded-xl" />
        <div className="flex-1 h-10 bg-zinc-800/40 rounded-xl" />
      </div>
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-4 bg-zinc-950/40 border border-zinc-800/50 rounded-3xl text-center"
    >
      <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-2xl">
        <Inbox className="w-7 h-7 text-zinc-600" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-white tracking-tight">
          Nothing here
        </h3>
        <p className="text-sm text-zinc-500 max-w-xs">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── RECEIVED CARD ────────────────────────────────────────────────────────────

function ReceivedInviteCard({
  invite,
  onAccept,
  onReject,
}: {
  invite: ReceivedInvite;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [localStatus, setLocalStatus] = useState<LocalInviteStatus>({
    phase: "idle",
  });

  const cfg = DISCIPLINE_CONFIG[invite.role];
  const Icon = cfg.icon;
  const isActing =
    localStatus.phase === "accepting" || localStatus.phase === "rejecting";
  const isResolved =
    localStatus.phase === "accepted" || localStatus.phase === "rejected";

  const senderName =
    invite.fromUser?.athleteProfile?.displayName ||
    invite.fromUser?.name ||
    "Unknown Athlete";
  const senderLocation = invite.fromUser?.athleteProfile?.locationCity ?? null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.95,
        y: -8,
        transition: { duration: 0.3, delay: 0.8 },
      }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`relative bg-[#0a0a0a] border rounded-2xl overflow-hidden transition-all duration-300 ${
        isResolved
          ? "border-zinc-800/40"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${cfg.accent}`}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight leading-none">
                {invite.team.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3 text-zinc-600" />
                <span className="text-[10px] text-zinc-600 font-bold">
                  {new Date(invite.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}
          >
            <Icon className="w-3 h-3" /> {cfg.label}
          </div>
        </div>

        {/* Sender */}
        <div className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800/60 rounded-xl mb-5">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
              Invited by
            </p>
            <p className="text-sm font-bold text-white truncate">
              {senderName}
            </p>
            {senderLocation && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 text-zinc-600" />
                <span className="text-[10px] text-zinc-500">
                  {senderLocation}
                </span>
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-700 shrink-0" />
        </div>

        {/* CTA */}
        <AnimatePresence mode="wait">
          {localStatus.phase === "idle" && (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2.5"
            >
              <button
                disabled={isActing || isResolved}
                onClick={() => {
                  setLocalStatus({ phase: "accepting" });
                  onAccept(invite.id);
                }}
                className="flex-1 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white hover:border-emerald-400 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" /> Accept
              </button>
              <button
                disabled={isActing || isResolved}
                onClick={() => {
                  setLocalStatus({ phase: "rejecting" });
                  onReject(invite.id);
                }}
                className="flex-1 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white hover:border-red-400 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-3.5 h-3.5" /> Decline
              </button>
            </motion.div>
          )}

          {(localStatus.phase === "accepting" ||
            localStatus.phase === "rejecting") && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-2.5"
            >
              <Loader2 className="w-4 h-4 text-zinc-500 animate-spin mr-2" />
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                {localStatus.phase === "accepting"
                  ? "Accepting..."
                  : "Declining..."}
              </span>
            </motion.div>
          )}

          {localStatus.phase === "accepted" && (
            <motion.div
              key="accepted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                Accepted — You joined the team
              </span>
            </motion.div>
          )}

          {localStatus.phase === "rejected" && (
            <motion.div
              key="rejected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl"
            >
              <XCircle className="w-4 h-4 text-zinc-500" />
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                Declined
              </span>
            </motion.div>
          )}

          {localStatus.phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-[11px] font-bold text-red-400">
                  {localStatus.message}
                </span>
              </div>
              <button
                onClick={() => setLocalStatus({ phase: "idle" })}
                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <StatusUpdaterPortal inviteId={invite.id} setStatus={setLocalStatus} />
    </motion.div>
  );
}

// ─── SENT CARD ────────────────────────────────────────────────────────────────

function SentInviteCard({ invite }: { invite: SentInvite }) {
  const cfg = DISCIPLINE_CONFIG[invite.role];
  const Icon = cfg.icon;
  const recipientName =
    invite.toUser?.athleteProfile?.displayName ||
    invite.toUser?.name ||
    "Unknown Athlete";
  const recipientCity = invite.toUser?.athleteProfile?.locationCity ?? null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="relative bg-[#0a0a0a] border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all duration-300"
    >
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${cfg.accent}`}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight leading-none">
                {invite.team.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3 text-zinc-600" />
                <span className="text-[10px] text-zinc-600 font-bold">
                  {new Date(invite.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}
          >
            <Icon className="w-3 h-3" /> {cfg.label}
          </div>
        </div>

        {/* Recipient */}
        <div className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800/60 rounded-xl mb-5">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
              Sent to
            </p>
            <p className="text-sm font-bold text-white truncate">
              {recipientName}
            </p>
            {recipientCity && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 text-zinc-600" />
                <span className="text-[10px] text-zinc-500">
                  {recipientCity}
                </span>
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-700 shrink-0" />
        </div>

        {/* Awaiting badge */}
        <div className="flex items-center justify-center gap-2 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
            Awaiting Response
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function InvitesDashboard() {
  const [state, dispatch, isPending] = useActionState<
    ActionResponse,
    InviteActionPayload
  >(inviteAction, initialState);
  // Track which service + invite is in-flight
  const pendingService = useRef<InviteActionPayload["service"] | null>(null);
  const pendingInviteId = useRef<string | null>(null);

  const [received, setReceived] = useState<ReceivedInvite[]>([]);
  const [sent, setSent] = useState<SentInvite[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("received");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // ── Initial fetch ──
  useEffect(() => {
    startTransition(() => {
      dispatch({ service: "GET_INVITES" });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle all state changes ──
  useEffect(() => {
    if (isPending) return;

    const service = pendingService.current;

    // ── GET_INVITES ──
    if (service === "GET_INVITES" || service === null) {
      setIsInitialLoad(false);
      if (state.success && state.data) {
        setReceived(state?.data?.received!);
        setSent(state.data.sent);
      }
      pendingService.current = null;
      return;
    }

    const inviteId = pendingInviteId.current;
    if (!inviteId) return;
    const setter = statusRegistry.get(inviteId);

    // ── ACCEPT_INVITE ──
    if (service === "ACCEPT_INVITE") {
      if (state.success) {
        setter?.({ phase: "accepted" });
        setTimeout(() => {
          setReceived((prev) => prev.filter((inv) => inv.id !== inviteId));
        }, 1200);
      } else {
        setter?.({
          phase: "error",
          message: state.message ?? "Failed to accept",
        });
      }
    }

    // ── REJECT_INVITE ──
    if (service === "REJECT_INVITE") {
      if (state.success) {
        setter?.({ phase: "rejected" });
        setTimeout(() => {
          setReceived((prev) => prev.filter((inv) => inv.id !== inviteId));
        }, 1200);
      } else {
        setter?.({
          phase: "error",
          message: state.message ?? "Failed to decline",
        });
      }
    }

    pendingService.current = null;
    pendingInviteId.current = null;
  }, [state, isPending]);

  // ── Dispatch helpers ──
  const handleAccept = (inviteId: string) => {
    pendingService.current = "ACCEPT_INVITE";
    pendingInviteId.current = inviteId;
    startTransition(() => {
      dispatch({ service: "ACCEPT_INVITE", inviteId });
    });
  };

  const handleReject = (inviteId: string) => {
    pendingService.current = "REJECT_INVITE";
    pendingInviteId.current = inviteId;
    startTransition(() => {
      dispatch({ service: "REJECT_INVITE", inviteId });
    });
  };

  const tabs = [
    {
      key: "received" as Tab,
      label: "Received",
      icon: Bell,
      count: received.length,
    },
    { key: "sent" as Tab, label: "Sent", icon: Send, count: sent.length },
  ];

  return (
    <div className="min-h-screen bg-black font-sans text-zinc-400 p-4 sm:p-6 lg:p-10 selection:bg-blue-500/30 relative overflow-x-hidden">
      {/* Ambient */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/[0.04] rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/[0.03] rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10 space-y-8">
        {/* ── HEADER ── */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-inner">
              <Bell className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Invitations
              </h1>
              <p className="text-xs text-zinc-500 font-bold">
                Manage your team slot requests
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
            {tabs.map(({ key, label, icon: TabIcon, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                  activeTab === key
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <TabIcon className="w-3 h-3" />
                {label}
                {!isInitialLoad && count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                      activeTab === key
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        </header>

        {/* ── CONTENT ── */}
        <AnimatePresence mode="wait">
          {isInitialLoad ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="space-y-4"
            >
              {[1, 2, 3].map((i) => (
                <InviteSkeleton key={i} />
              ))}
            </motion.div>
          ) : activeTab === "received" ? (
            received.length === 0 ? (
              <EmptyState
                key="received-empty"
                label="When team owners invite you to fill a role, they'll appear here."
              />
            ) : (
              <motion.div
                key="received-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <AnimatePresence>
                  {received.map((invite) => (
                    <ReceivedInviteCard
                      key={invite.id}
                      invite={invite}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )
          ) : sent.length === 0 ? (
            <EmptyState
              key="sent-empty"
              label="Invites you send to athletes will appear here."
            />
          ) : (
            <motion.div
              key="sent-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {sent.map((invite) => (
                <SentInviteCard key={invite.id} invite={invite} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ERROR BANNER ── */}
        {!isInitialLoad && state.error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3.5 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400 font-bold">
              {state.message ?? "Failed to load invitations."}
            </p>
            <button
              onClick={() => {
                pendingService.current = "GET_INVITES";
                startTransition(() => {
                  dispatch({ service: "GET_INVITES" });
                });
              }}
              className="ml-auto text-[11px] font-black uppercase tracking-widest text-red-400 hover:text-white transition-colors cursor-pointer"
            >
              Retry
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
