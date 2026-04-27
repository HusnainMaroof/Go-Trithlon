"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ArrowRight,
  Waves,
  Bike,
  Footprints,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Mail,
  Lock,
  LucideIcon,
} from "lucide-react";
import { useStateContext } from "../context/useContext";
import RegistrationPopup from "./LoginPopUp";

// Define strict types for the disciplines
type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";
const DISCIPLINES: Discipline[] = ["SWIMMER", "CYCLIST", "RUNNER"];

// Interface for the styling object
interface DisciplineStyle {
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  gradient: string;
}

const disciplineStyles: Record<Discipline, DisciplineStyle> = {
  SWIMMER: {
    icon: Waves,
    color: "text-cyan-400/80 group-hover:text-cyan-400",
    bg: "bg-zinc-900/80 backdrop-blur-sm",
    border: "border-zinc-800 group-hover:border-zinc-700",
    gradient: "from-cyan-500/10 to-transparent",
  },
  CYCLIST: {
    icon: Bike,
    color: "text-amber-400/80 group-hover:text-amber-400",
    bg: "bg-zinc-900/80 backdrop-blur-sm",
    border: "border-zinc-800 group-hover:border-zinc-700",
    gradient: "from-amber-500/10 to-transparent",
  },
  RUNNER: {
    icon: Footprints,
    color: "text-emerald-400/80 group-hover:text-emerald-400",
    bg: "bg-zinc-900/80 backdrop-blur-sm",
    border: "border-zinc-800 group-hover:border-zinc-700",
    gradient: "from-emerald-500/10 to-transparent",
  },
};

export default function HeroSection() {
  // Modal State
  const [isSignupOpen, setIsSignupOpen] = useState<boolean>(false);
  const { setShowLoginPopup, showLoginPopup } = useStateContext();
  const specializeText = "Focus on your best leg. ";
  const missingRolesText = "Cyclist and Runner";

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.5;
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-black text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden py-20 lg:py-32">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover opacity-40"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/video-poster.jpg"
        >
          <source
            src="https://res.cloudinary.com/dwtskde96/video/upload/f_auto,q_auto/v1777289101/IRONMAN___A_Story_That_Can_Be_Yours_dwj27b.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
        {/* Overlay to ensure text remains highly readable */}
        {/* <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black pointer-events-none" /> */}
      </div>

      {/* Background Gradients - Low Fade Monochromatic & Blue Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Hero Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-8 w-full"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-400/10 border border-blue-500/30 text-zinc-200 text-sm font-medium mb-4 shadow-sm backdrop-blur-md">
            <Trophy className="w-4 h-4 text-blue-400" /> The New Way to
            Triathlon
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight">
            Master One. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
              Conquer All.
            </span>
          </h1>

          {/* Subheadline - Formatted visibly as requested */}
          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Don't want to be a{" "}
            <span className="font-extrabold text-white tracking-wide">
              SWIMMER, CYCLIST, and RUNNER?
            </span>{" "}
            You don't have to. Join the premier team-matching platform for relay
            triathlons. Specialize in what you love, and find teammates for the
            rest.
          </p>

          {/* Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border bg-zinc-950/80 backdrop-blur-xl border-amber-500/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 max-w-3xl mx-auto mt-8 shadow-2xl"
          >
            <div
              className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-30 transition-colors duration-700 
                
                    bg-amber-500
              `}
            />

            <div className="relative z-10 flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-colors 
                      bg-amber-500/10 border-amber-500/20
                `}
              >
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-white mb-1">
                  Build a Team
                </h2>
                <p className="text-zinc-400 text-sm max-w-md">
                  Create a team to start recruiting a your Team mate , You can
                  now sign up for races."
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowLoginPopup(true)}
              className={`relative z-10 w-fit text-nowrap md:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 
           
              bg-zinc-100 text-black hover:bg-white shadow-[0_0_15px_rgba(255,255,255,0.15)]
              `}
            >
              Create Team
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mx-auto mt-24"
        >
          {DISCIPLINES.map((discipline) => {
            const styles = disciplineStyles[discipline];
            const Icon = styles.icon;

            // Convert "SWIMMER" to "Swimmer" for display purposes
            const displayLabel =
              discipline.charAt(0) + discipline.slice(1).toLowerCase();

            return (
              <div
                key={discipline}
                className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-3xl p-8 text-left hover:border-zinc-800 transition-all relative overflow-hidden group shadow-lg shadow-black/50"
              >
                {/* Card Background Flare */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 opacity-10 bg-gradient-to-br ${styles.gradient} blur-2xl rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`}
                />

                {/* Card Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl ${styles.bg} border ${styles.border} flex items-center justify-center mb-6 transition-colors`}
                >
                  <Icon
                    className={`w-7 h-7 ${styles.color} transition-colors`}
                  />
                </div>

                {/* Card Text */}
                <h3 className="text-xl font-semibold text-zinc-100 mb-2">
                  {displayLabel}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Lock in your best discipline and let your specialized skills
                  shine on race day. Match with athletes who complement your
                  strengths.
                </p>
              </div>
            );
          })}
        </motion.div>
      </main>

      {/* ─── Animated Sign Up Modal ─── */}
      <AnimatePresence>
        <RegistrationPopup />
      </AnimatePresence>
    </div>
  );
}

// ─── Modal Component ───────────────────────────────────────────────────────
