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
import { modalVariants } from "./CreateTeameModel";
import { redirect } from "next/navigation";
export type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";

export const DISCIPLINE_CONFIG: Record<
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

export const RecruitSlotModal = ({
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
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
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
        className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
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

export const NoTeamWarningModal = ({
  FromWhere,
  onClose,
  onCreate,
}: {
  FromWhere: string;
  onClose: () => void;
  onCreate: () => void;
}) => (
  <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
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
      className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
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

        {FromWhere === "MainDashboard" ? (
          <button
            onClick={() => redirect("/dashboard/myteam")}
            className="w-full py-3.5 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-all cursor-pointer"
          >
            Create a Team
          </button>
        ) : (
          <button
            onClick={onCreate}
            className="w-full py-3.5 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-all cursor-pointer"
          >
            Create a Team
          </button>
        )}
      </div>
    </motion.div>
  </div>
);
