"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  ArrowRight,
  Waves,
  Bike,
  Footprints,
  LucideIcon,
} from "lucide-react";

// Define strict types for the disciplines
type Discipline = "Swimmer" | "Cyclist" | "Runner";
const DISCIPLINES: Discipline[] = ["Swimmer", "Cyclist", "Runner"];

// Interface for the styling object
interface DisciplineStyle {
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  gradient: string;
}

const disciplineStyles: Record<Discipline, DisciplineStyle> = {
  Swimmer: {
    icon: Waves,
    color: "text-cyan-400/80 group-hover:text-cyan-400",
    bg: "bg-zinc-900",
    border: "border-zinc-800 group-hover:border-zinc-700",
    gradient: "from-cyan-500/10 to-transparent",
  },
  Cyclist: {
    icon: Bike,
    color: "text-amber-400/80 group-hover:text-amber-400",
    bg: "bg-zinc-900",
    border: "border-zinc-800 group-hover:border-zinc-700",
    gradient: "from-amber-500/10 to-transparent",
  },
  Runner: {
    icon: Footprints,
    color: "text-emerald-400/80 group-hover:text-emerald-400",
    bg: "bg-zinc-900",
    border: "border-zinc-800 group-hover:border-zinc-700",
    gradient: "from-emerald-500/10 to-transparent",
  },
};

// Define component props
interface HeroSectionProps {
  onGetStarted?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <div className="relative w-full bg-black text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden py-20 lg:py-32">
      {/* Background Gradients - Low Fade Monochromatic & Blue Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Badge - Updated to match popup low-fade style */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-400/10 border border-blue-500/20 text-zinc-300 text-sm font-medium mb-4 shadow-sm">
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

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Don't want to swim, bike,{" "}
            <span className="italic text-zinc-300">and</span> run? You don't
            have to. Join the premier team-matching platform for relay
            triathlons. Specialize in what you love, and find teammates for the
            rest.
          </p>

          {/* Call to Actions - Updated to zinc/dark premium styling */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-medium text-lg transition-all bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white shadow-sm flex items-center justify-center gap-2 group cursor-pointer"
            >
              Start Building Your Team
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-medium text-lg transition-all bg-transparent hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-zinc-400 hover:text-white cursor-pointer">
              Browse Events
            </button>
          </div>
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

            return (
              <div
                key={discipline}
                className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 text-left hover:border-zinc-800 transition-all relative overflow-hidden group shadow-lg shadow-black/50"
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
                  {discipline}
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
    </div>
  );
};

export default HeroSection;
