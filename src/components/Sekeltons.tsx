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


export const Shimmer = () => (
  <motion.div
    className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-zinc-700/10 to-transparent z-10"
    animate={{ translateX: ["-100%", "200%"] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
  />
);

export const DashboardSkeleton = () => (
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
    <div className="h-25 w-full bg-zinc-900/30 rounded-[1.25rem] border border-zinc-800/40 relative overflow-hidden">
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
            className="p-5 rounded-[1.25rem] bg-[#0a0a0a] border border-zinc-800/50 h-50 flex flex-col relative overflow-hidden"
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