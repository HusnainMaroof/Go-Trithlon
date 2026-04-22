"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useActionState,
  startTransition,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  MapPin,
  Trophy,
  Waves,
  Bike,
  Footprints,
  UserPlus,
  Eye,
  CheckCircle2,
  X,
  Shield,
  Loader2,
  Activity,
  Zap,
  Clock,
  Calendar,
  Lock,
  Search,
} from "lucide-react";

import { ActionResponse } from "./AthleteMarket";
import { sendInvitesPayload } from "../type/dashboardtype";
import { inviteAction } from "../actions/InviteAction";

type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";
const initialState: ActionResponse = {
  success: false,
  error: false,
  message: null,
  data: null,
};
const InviteAthleteModel = ({
  setInviteTarget,
  inviteTarget,
  DISCIPLINE_CONFIG,
}: any) => {
  const [state, Dispatcher, isPending] = useActionState<
    ActionResponse,
    sendInvitesPayload
  >(inviteAction, initialState);

  const handelsendInvite = () => {
    startTransition(() => {
      Dispatcher({
        role: inviteTarget.disciplines[0],
        toUserId: inviteTarget?.userId!,
      });
    });
  };

  useEffect(() => {
    console.log("from inviti model", state);
  }, [state]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setInviteTarget(null)}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-[#0a0a0a] border border-zinc-800 p-8 rounded-[2rem] w-full max-w-sm shadow-[0_50px_100px_rgba(0,0,0,1)]"
      >
        <button
          onClick={() => setInviteTarget(null)}
          className="absolute top-5 right-5 p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mt-2 relative z-10">
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
            <img
              src={
                inviteTarget.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(inviteTarget.displayName)}&background=18181b&color=ffffff&size=128&bold=true`
              }
              className="w-20 h-20 rounded-full border-2 border-zinc-700 shadow-2xl relative z-10 object-cover"
              alt={inviteTarget.displayName}
              onError={(e) => {
                const target = e.currentTarget;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(inviteTarget.displayName)}&background=18181b&color=ffffff&size=128&bold=true`;
                target.onerror = null;
              }}
            />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            {inviteTarget.displayName}
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 mb-6">
            {inviteTarget.disciplines.map((d: Discipline) => (
              <span
                key={d}
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${DISCIPLINE_CONFIG[d]?.bg} ${DISCIPLINE_CONFIG[d]?.color} ${DISCIPLINE_CONFIG[d]?.border}`}
              >
                {DISCIPLINE_CONFIG[d]?.label}
              </span>
            ))}
          </div>

          {/* Athlete Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full mb-8">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-zinc-500">
                Experience
              </span>
              <span className="text-sm font-bold text-white capitalize">
                {inviteTarget.experienceLevel?.toLowerCase() ?? "—"}
              </span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-zinc-500">
                Training
              </span>
              <span className="text-sm font-bold text-white">
                {inviteTarget.trainingDaysPerWeek ?? "—"} Days/Wk
              </span>
            </div>

            {inviteTarget.swimTime100m && (
              <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex justify-between items-center px-4">
                <span className="text-[11px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" /> SWIMMER Pace
                </span>
                <span className="text-sm font-bold text-white">
                  {inviteTarget.swimTime100m}s / 100m
                </span>
              </div>
            )}
            {inviteTarget.cycleTime10km && (
              <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex justify-between items-center px-4">
                <span className="text-[11px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                  <Bike className="w-3.5 h-3.5 text-amber-400" /> CYCLIST Pace
                </span>
                <span className="text-sm font-bold text-white">
                  {inviteTarget.cycleTime10km}m / 10k
                </span>
              </div>
            )}
            {inviteTarget.runTime5km && (
              <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex justify-between items-center px-4">
                <span className="text-[11px] uppercase font-bold text-zinc-500 flex items-center gap-2">
                  <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                  RUNNER Run Pace
                </span>
                <span className="text-sm font-bold text-white">
                  {inviteTarget.runTime5km}m / 5k
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handelsendInvite}
            className="w-full py-4 bg-white hover:bg-zinc-200 text-black rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Send Invitation
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteAthleteModel;
