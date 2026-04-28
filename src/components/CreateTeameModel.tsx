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
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 400 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } },
} as const;

export const CreateTeamModal = ({
  onClose,
  onSubmit,
  isPending,
  errorMsg,
  inputValue,
  setInputValue,
}: any) => (
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
      className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
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
