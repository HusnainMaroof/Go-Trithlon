"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Waves,
  Bike,
  Footprints,
  Trophy,
  Plus,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
  Target,
  Users,
  UserPlus,
  ChevronRight,
  Medal,
  X,
  MapPin,
  Calendar,
  Search,
  User,
} from "lucide-react";
import { useStateContext } from "../context/useContext";


// --- MOCK SUGGESTIONS ---
const topMatches = [
  {
    id: 1,
    name: "Jordan Lee",
    role: "Swimmer",
    pr: "1:08 / 100m",
    match: "98%",
    img: "https://i.pravatar.cc/150?u=12",
    location: "Islamabad",
    level: "Advanced",
    training: "5 days/wk",
  },
  {
    id: 2,
    name: "Casey Smith",
    role: "Swimmer",
    pr: "1:15 / 100m",
    match: "85%",
    img: "https://i.pravatar.cc/150?u=15",
    location: "Rawalpindi",
    level: "Intermediate",
    training: "3 days/wk",
  },
  {
    id: 3,
    name: "Morgan Wright",
    role: "Swimmer",
    pr: "1:12 / 100m",
    match: "79%",
    img: "https://i.pravatar.cc/150?u=18",
    location: "Islamabad",
    level: "Advanced",
    training: "6 days/wk",
  },
];

// Styling helpers
const roleStyles = {
  Swimmer: "text-cyan-400 bg-cyan-400/10 border-cyan-500/20",
  Cyclist: "text-amber-400 bg-amber-400/10 border-amber-500/20",
  Runner: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20",
};

// Advanced helper for dynamic popups
const getRoleDetails = (role: string | null) => {
  if (role === "Swimmer")
    return {
      icon: Waves,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      glow: "bg-cyan-500/20",
    };
  if (role === "Cyclist")
    return {
      icon: Bike,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      glow: "bg-amber-500/20",
    };
  if (role === "Runner")
    return {
      icon: Footprints,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: "bg-emerald-500/20",
    };
  return {
    icon: UserPlus,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    glow: "bg-blue-500/20",
  };
};

export default function Dashboard() {
  const { user } = useStateContext();
  const athlete = user?.athleteData;

  // Popup States
  const [recruitSlot, setRecruitSlot] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<
    (typeof topMatches)[0] | null
  >(null);
  const [showNoTeamWarning, setShowNoTeamWarning] = useState(false);

  // Dynamically format user's pace based on what they provided
  const getFormattedPaces = () => {
    if (!athlete) return "Pace Pending";
    const p = [];
    if (athlete.swimTime100m) p.push(`${athlete.swimTime100m}s 100m`);
    if (athlete.cycleTime10km) p.push(`${athlete.cycleTime10km}m 10k`);
    if (athlete.runTime5km) p.push(`${athlete.runTime5km}m 5k`);
    return p.join(" • ") || "Pace Pending";
  };

  // Dynamically build the team status
  const userDisciplines = athlete?.discipline || [];

  const teamSummary = [
    {
      role: "Swimmer",
      filled: userDisciplines.includes("SWIMMER"),
      isMe: userDisciplines.includes("SWIMMER"),
      name: userDisciplines.includes("SWIMMER") ? athlete?.displayName : null,
    },
    {
      role: "Cyclist",
      filled: userDisciplines.includes("CYCLIST"),
      isMe: userDisciplines.includes("CYCLIST"),
      name: userDisciplines.includes("CYCLIST") ? athlete?.displayName : null,
    },
    {
      role: "Runner",
      filled: userDisciplines.includes("RUNNER"),
      isMe: userDisciplines.includes("RUNNER"),
      name: userDisciplines.includes("RUNNER") ? athlete?.displayName : null,
    },
  ];

  const missingRoles = teamSummary.filter((member) => !member.filled);
  const isTeamComplete = missingRoles.length === 0;

  // Helper for text formatting
  const userRolesText = teamSummary
    .filter((m) => m.isMe)
    .map((m) => m.role)
    .join(" and ");
  const missingRolesText = missingRoles.map((r) => r.role).join(" and ");
  const specializeText = userRolesText
    ? `You specialize as a ${userRolesText}. `
    : "";

  // ADDED: Check if user has a team (Connect this to your actual DB logic later)
  const userHasTeam = false;

  // Handle Invite Logic
  const handleInviteClick = () => {
    if (!userHasTeam) {
      setSelectedAthlete(null); // Hide the athlete profile popup
      setShowNoTeamWarning(true); // Show the missing team warning
    } else {
      // Actual invite logic goes here
      console.log(`Invited ${selectedAthlete?.name}!`);
      setSelectedAthlete(null);
    }
  };

  // Helper for recruit modal
  const recruitDetails = getRoleDetails(recruitSlot);
  const RecruitIcon = recruitDetails.icon;

  // Helper for profile modal - safely assigned for React rendering
  const profileDetails = getRoleDetails(selectedAthlete?.role || null);
  const ProfileIcon = profileDetails.icon;

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-500/30 p-4 sm:p-6 lg:p-8 relative">
      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        {/* --- 1. HEADER --- */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Overview
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              Welcome back,{" "}
              <span className="text-white font-medium">
                {athlete?.displayName || "Athlete"}
              </span>
              .
            </p>
          </div>

          {/* Quick Personal Stats */}
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

        {/* --- 2. STATUS BANNER --- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${
            !userHasTeam
              ? "bg-zinc-950 border-amber-500/20"
              : isTeamComplete
                ? "bg-zinc-950 border-amber-500/20"
                : "bg-zinc-950 border-amber-500/20"
          }`}
        >
          <div
            className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-30 ${!userHasTeam ? "bg-zinc-700/30" : isTeamComplete ? "bg-blue-500" : "bg-amber-500"}`}
          />

          <div className="relative z-10 flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                !userHasTeam
                  ? "bg-zinc-900 border-amber-500/20"
                  : isTeamComplete
                    ? "bg-blue-500/10 border-blue-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
              }`}
            >
              {!userHasTeam ? (
             <AlertCircle className="w-8 h-8 text-amber-400" />
              ) : isTeamComplete ? (
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              ) : (
                <AlertCircle className="w-8 h-8 text-amber-400" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white mb-1">
                {!userHasTeam
                  ? "No Team Yet"
                  : isTeamComplete
                    ? "Team Ready"
                    : "Team Not Full"}
              </h2>
              <p className="text-zinc-400 text-sm max-w-md">
                {!userHasTeam
                  ? `${specializeText}Create a team to start recruiting a ${missingRolesText}.`
                  : isTeamComplete
                    ? "Your team is full. You can now sign up for races."
                    : `You need a ${missingRolesText} to finish your team.`}
              </p>
            </div>
          </div>

          <button
            className={`relative z-10 w-full md:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !userHasTeam
                ? "bg-zinc-100 text-black hover:bg-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                : isTeamComplete
                  ? "bg-blue-500 text-white hover:bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  : "bg-zinc-100 text-black hover:bg-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
            }`}
          >
            {!userHasTeam
              ? "Create Team"
              : isTeamComplete
                ? "Find Races"
                : "Find Teammates"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* --- 3. YOUR TEAM SECTION --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" /> Your Team
            </h3>
            {userHasTeam && (
              <button className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider cursor-pointer transition-colors">
                Manage Team
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamSummary.map((member) => (
              <div
                key={member.role}
                className={`relative p-5 rounded-2xl border transition-all ${
                  member.filled
                    ? "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                    : "bg-zinc-950/40 border-zinc-800/60 border-dashed hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${roleStyles[member.role as keyof typeof roleStyles] || "bg-zinc-800 border-zinc-700 text-zinc-300"}`}
                  >
                    {member.role === "Swimmer" && <Waves className="w-3 h-3" />}
                    {member.role === "Cyclist" && <Bike className="w-3 h-3" />}
                    {member.role === "Runner" && (
                      <Footprints className="w-3 h-3" />
                    )}
                    {member.role}
                  </div>
                  {member.isMe && (
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                      YOU
                    </span>
                  )}
                </div>

                {member.filled ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                      {member.isMe && user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt="You"
                          className="w-full h-full object-cover opacity-50"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      ) : (
                        <Users className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white leading-tight">
                        {member.name || "Athlete"}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Joined</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!userHasTeam) {
                        setShowNoTeamWarning(true);
                      } else {
                        setRecruitSlot(member.role);
                      }
                    }}
                    className="w-full flex items-center gap-3 group cursor-pointer text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                      <Plus className="w-5 h-5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-400 group-hover:text-white transition-colors">
                        Empty Spot
                      </h4>
                      <p className="text-xs text-blue-400/80 group-hover:text-blue-400 transition-colors mt-0.5">
                        Tap to search
                      </p>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* --- 4. SUGGESTED TEAMMATES --- */}
        {(!userHasTeam || !isTeamComplete) && (
          <section className="space-y-4 pt-4 border-t border-zinc-900 pb-12">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" /> Suggested Matches
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {topMatches.map((match) => {
                const MatchIcon =
                  match.role === "Swimmer"
                    ? Waves
                    : match.role === "Cyclist"
                      ? Bike
                      : Footprints;
                const iconColor =
                  match.role === "Swimmer"
                    ? "text-cyan-400"
                    : match.role === "Cyclist"
                      ? "text-amber-400"
                      : "text-emerald-400";

                return (
                  <div
                    key={match.id}
                    onClick={() => setSelectedAthlete(match)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40 rounded-2xl transition-all cursor-pointer gap-4 sm:gap-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={match.img}
                          alt={match.name}
                          className="w-12 h-12 rounded-full border border-zinc-800 object-cover"
                        />
                      </div>

                      <div className="flex flex-col text-left">
                        <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">
                          {match.name}
                        </h4>

                        <div className="flex items-center gap-2 mt-1.5 text-xs font-medium">
                          <span
                            className={`flex items-center gap-1 ${iconColor}`}
                          >
                            <MatchIcon className="w-3.5 h-3.5" />
                            {match.role}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700" />
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Medal className="w-3.5 h-3.5 text-amber-400/80" />
                            {match.pr}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                        {match.match} Match
                      </span>
                      <div className="flex w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center group-hover:bg-zinc-800 transition-colors">
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show More Button */}
            <div className="pt-2">
              <button className="w-full py-4 rounded-xl border border-zinc-800 border-dashed bg-zinc-950/50 hover:bg-zinc-900 transition-all text-sm font-bold text-zinc-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer group">
                Show more teammates{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </section>
        )}
      </div>

      {/* --- POPUPS / MODALS --- */}
      <AnimatePresence>
        {/* 1. RECRUIT SLOT POPUP */}
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
              className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
            >
              {/* Dynamic Glow based on selected role */}
              <div
                className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] ${recruitDetails.glow} rounded-full blur-[80px] pointer-events-none`}
              />

              <button
                onClick={() => setRecruitSlot(null)}
                className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-white bg-zinc-900/80 rounded-full transition-colors cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center mt-2 relative z-10">
                <div
                  className={`w-20 h-20 ${recruitDetails.bg} ${recruitDetails.border} border rounded-full flex items-center justify-center mb-5 shadow-inner`}
                >
                  <RecruitIcon
                    className={`w-10 h-10 ${recruitDetails.color}`}
                  />
                </div>

                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                  Recruit a {recruitSlot || "Teammate"}
                </h3>

                <p className="text-sm text-zinc-400 mb-8 px-2 leading-relaxed">
                  Your team is missing a{" "}
                  <strong className="text-zinc-200">
                    {recruitSlot || "specialist"}
                  </strong>
                  . Head to the directory to scout athletes and complete your
                  trio.
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={() => setRecruitSlot(null)}
                    className={`w-full py-3.5 bg-zinc-100 hover:bg-white text-black rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 cursor-pointer`}
                  >
                    <Search className="w-4 h-4" /> Scout{" "}
                    {recruitSlot ? `${recruitSlot}s` : "Athletes"}
                  </button>
                  <button
                    onClick={() => setRecruitSlot(null)}
                    className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    Not right now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. ATHLETE PROFILE POPUP */}
        {selectedAthlete && (
          <div
            key="profile-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAthlete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl z-10 overflow-hidden"
            >
              {/* Dynamic Decorative Glow */}
              <div
                className={`absolute top-0 right-0 w-56 h-56 ${profileDetails.glow} rounded-full blur-[90px] pointer-events-none opacity-50`}
              />

              <button
                onClick={() => setSelectedAthlete(null)}
                className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-white bg-zinc-900/80 rounded-full transition-colors cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center mt-6 relative z-10">
                <img
                  src={selectedAthlete.img}
                  alt={selectedAthlete.name}
                  className="w-24 h-24 rounded-full border-4 border-zinc-950 shadow-2xl object-cover mb-4 bg-zinc-900"
                />
                <h3 className="text-3xl font-black text-white tracking-tight">
                  {selectedAthlete.name}
                </h3>

                <div className="flex items-center gap-2 mt-2 mb-6 text-sm text-zinc-400 font-medium">
                  <span
                    className={`flex items-center gap-1 ${roleStyles[selectedAthlete.role as keyof typeof roleStyles]?.split(" ")[0] || "text-zinc-400"}`}
                  >
                    <ProfileIcon className="w-4 h-4" />
                    {selectedAthlete.role}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />{" "}
                    {selectedAthlete.location}
                  </span>
                </div>

                {/* Giant PR Highlight Card */}
                <div className="bg-black/40 border border-zinc-800/60 rounded-2xl p-5 w-full flex flex-col items-center justify-center text-center mb-3">
                  <Medal className="w-6 h-6 text-amber-400 mb-2 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                  <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">
                    Personal Record
                  </span>
                  <span className="text-3xl font-black text-white tracking-tighter">
                    {selectedAthlete.pr}
                  </span>
                </div>

                {/* Secondary Stats Row */}
                <div className="w-full grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-black/40 border border-zinc-800/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <Trophy className="w-5 h-5 text-emerald-400 mb-2" />
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">
                      Experience
                    </span>
                    <span className="text-sm font-bold text-white">
                      {selectedAthlete.level}
                    </span>
                  </div>
                  <div className="bg-black/40 border border-zinc-800/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <Calendar className="w-5 h-5 text-blue-400 mb-2" />
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">
                      Training Volume
                    </span>
                    <span className="text-sm font-bold text-white">
                      {selectedAthlete.training}
                    </span>
                  </div>
                </div>

                <div className="flex w-full gap-3">
                  <button
                    onClick={handleInviteClick}
                    className="w-full py-4 bg-zinc-100 hover:bg-white text-black rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" /> Invite to Team
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 3. NO TEAM WARNING POPUP */}
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
              className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
            >
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

              <button
                onClick={() => setShowNoTeamWarning(false)}
                className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-white bg-zinc-900/80 rounded-full transition-colors cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center mt-2 relative z-10">
                <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-5 shadow-inner">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                </div>

                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                  No Team Found
                </h3>

                <p className="text-sm text-zinc-400 mb-8 px-2 leading-relaxed">
                  You don't have a team yet. Please create your team first
                  before sending invites to other athletes.
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={() => setShowNoTeamWarning(false)}
                    className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] cursor-pointer"
                  >
                    Go to My Team
                  </button>
                  <button
                    onClick={() => setShowNoTeamWarning(false)}
                    className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
