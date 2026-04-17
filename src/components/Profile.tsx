"use client";

import React, {
  startTransition,
  useActionState,
  useEffect,
  useState,
} from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Waves,
  Bike,
  Footprints,
  CheckCircle2,
  MapPin,
  User,
  Activity,
  Trophy,
  Calendar,
  LucideIcon,
} from "lucide-react";
import { ActionResponse, setprofileAction } from "../actions/dashboardAction";
import { setProfilePayload } from "../type/dashboardtype";

// --- TYPES ---
type Discipline = "Swimmer" | "Cyclist" | "Runner" | "";
type Experience = "Beginner" | "Intermediate" | "Advanced" | "";
type Competition = "None" | "Local" | "National" | "Professional" | "";
const initialState: ActionResponse = {
  success: false,
  error: false,
  message: null,
  data: null,
};
interface ProfileData {
  displayName: string;
  location: string;
  discipline: Discipline;
  performance: string;
  experienceLevel: Experience;
  trainingDays: number | null;
  competitionLevel: Competition;
}

// --- CONSTANTS ---
const TOTAL_STEPS = 6; // 1-5 for inputs, 6 for summary

export default function ProfileSetup() {
  const [state, dispatcher, isPending] = useActionState<
    ActionResponse,
    setProfilePayload
  >(setprofileAction, initialState);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ProfileData>({
    displayName: "",
    location: "",
    discipline: "",
    performance: "",
    experienceLevel: "",
    trainingDays: null,
    competitionLevel: "",
  });

  const updateData = (fields: Partial<ProfileData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  // Validation to disable 'Next' button if required fields are missing
  const isStepValid = () => {
    switch (step) {
      case 1:
        return data.displayName.trim() !== "" && data.location.trim() !== "";
      case 2:
        return data.discipline !== "";
      case 3:
        return data.performance.trim() !== "";
      case 4:
        return data.experienceLevel !== "";
      case 5:
        return data.trainingDays !== null && data.competitionLevel !== "";
      default:
        return true;
    }
  };

  const stepVariants: Variants = {
    hidden: { opacity: 0, x: 30, scale: 0.98 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    exit: {
      opacity: 0,
      x: -30,
      scale: 0.98,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  const onComplete = (finalData: ProfileData) => {
    console.log(finalData);

    startTransition(() => {
      dispatcher(finalData);
    });
  };

  useEffect(() => {
    console.log(state);
  }, [state]);
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 sm:p-6 selection:bg-blue-500/30 font-sans">
      {/* Background Gradients - Low Fade Monochromatic & Blue Accents */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Container - Adjusted responsive padding and height */}
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800/80 rounded-[2rem] p-6 sm:p-10 shadow-2xl overflow-hidden flex flex-col min-h-[550px] sm:min-h-[600px]">
        {/* Progress Bar (Hidden on Summary Step) */}
        {step < TOTAL_STEPS && (
          <div className="mb-8 relative z-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Stage {step} of 5
              </span>
              <span className="text-xs font-bold text-blue-400">
                {Math.round((step / 5) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 5) * 100}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-grow relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="h-full flex flex-col justify-center"
            >
              {/* STEP 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Athlete Profile
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Establish your competitive identity on the TriMatch
                      circuit.
                    </p>
                  </div>

                  <div className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Athlete Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alex River"
                        value={data.displayName}
                        onChange={(e) =>
                          updateData({ displayName: e.target.value })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-blue-500 focus:bg-zinc-900 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" /> Training Base (City)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Austin, TX"
                        value={data.location}
                        onChange={(e) =>
                          updateData({ location: e.target.value })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-blue-500 focus:bg-zinc-900 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Select Discipline */}
              {step === 2 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Primary Discipline
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Select the triathlon leg you're built to dominate.
                    </p>
                  </div>

                  <div className="grid gap-4 mt-6">
                    <SelectableCard
                      icon={Waves}
                      label="Swimmer"
                      iconColor="text-cyan-400"
                      selected={data.discipline === "Swimmer"}
                      onClick={() => updateData({ discipline: "Swimmer" })}
                    />
                    <SelectableCard
                      icon={Bike}
                      label="Cyclist"
                      iconColor="text-amber-400"
                      selected={data.discipline === "Cyclist"}
                      onClick={() => updateData({ discipline: "Cyclist" })}
                    />
                    <SelectableCard
                      icon={Footprints}
                      label="Runner"
                      iconColor="text-emerald-400"
                      selected={data.discipline === "Runner"}
                      onClick={() => updateData({ discipline: "Runner" })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Performance Input (Dynamic - Sports Stopwatch Style) */}
              {step === 3 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      {data.discipline} Metrics
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Log your personal records to match with athletes at your
                      pace.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col items-center justify-center">
                    <label className="text-[11px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-4 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
                      <Activity className="w-4 h-4" />
                      {data.discipline === "Swimmer" && "100m Swim Pace"}
                      {data.discipline === "Cyclist" &&
                        "10km Time OR Avg Speed"}
                      {data.discipline === "Runner" && "5k Personal Best"}
                    </label>

                    {/* Big bold "Stopwatch" style input */}
                    <input
                      type="text"
                      placeholder={
                        data.discipline === "Swimmer"
                          ? "85 sec"
                          : data.discipline === "Cyclist"
                            ? "22 mph"
                            : "21:30"
                      }
                      value={data.performance}
                      onChange={(e) =>
                        updateData({ performance: e.target.value })
                      }
                      className="w-full max-w-[280px] bg-black border-2 border-zinc-800 focus:border-blue-500 rounded-3xl px-6 py-6 text-white placeholder:text-zinc-800 outline-none transition-all text-4xl sm:text-5xl font-black text-center tracking-tighter shadow-inner"
                    />

                    <p className="text-xs text-zinc-500 mt-6 max-w-xs text-center">
                      {data.discipline === "Swimmer" &&
                        "Log your most recent, all-out 100m split."}
                      {data.discipline === "Cyclist" &&
                        "Ensure consistent units (mph or km/h) for accurate matching."}
                      {data.discipline === "Runner" &&
                        "Log a recent, verified race result or time trial."}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4: Experience Level */}
              {step === 4 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Experience Class
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Define your current level of competitive racing.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 mt-6">
                    {["Beginner", "Intermediate", "Advanced"].map((level) => (
                      <button
                        key={level}
                        onClick={() =>
                          updateData({ experienceLevel: level as Experience })
                        }
                        className={`w-full py-4 px-6 rounded-xl border text-left font-bold transition-all flex justify-between items-center group ${
                          data.experienceLevel === level
                            ? "bg-zinc-800 border-zinc-600 text-white shadow-lg"
                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-300"
                        }`}
                      >
                        {level}
                        {data.experienceLevel === level && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-blue-400" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: Training & Competition */}
              {step === 5 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Training Volume
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Outline your weekly training intensity and competition
                      goals.
                    </p>
                  </div>

                  <div className="space-y-8 mt-6">
                    <div className="space-y-4">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Weekly Training
                        Days
                      </label>
                      {/* Responsive Grid for Days */}
                      <div className="grid grid-cols-7 gap-2 sm:gap-3">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <button
                            key={num}
                            onClick={() => updateData({ trainingDays: num })}
                            className={`aspect-square w-full rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                              data.trainingDays === num
                                ? "bg-zinc-100 text-black border border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-110"
                                : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-white hover:scale-105"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5" /> Target Competition
                        Circuit
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {["None", "Local", "National", "Professional"].map(
                          (level) => (
                            <button
                              key={level}
                              onClick={() =>
                                updateData({
                                  competitionLevel: level as Competition,
                                })
                              }
                              className={`py-3.5 px-4 rounded-xl border text-center font-bold transition-all ${
                                data.competitionLevel === level
                                  ? "bg-zinc-800 border-zinc-600 text-white shadow-md"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-300"
                              }`}
                            >
                              {level}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Summary Screen */}
              {step === 6 && (
                <div className="space-y-6 flex flex-col h-full justify-center">
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 15 }}
                      className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/10"
                    >
                      <CheckCircle2 className="w-8 h-8 text-blue-400" />
                    </motion.div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Profile Complete
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Review your racing credentials before joining the roster.
                    </p>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
                    <SummaryRow label="Athlete Name" value={data.displayName} />
                    <SummaryRow label="Training Base" value={data.location} />
                    <SummaryRow
                      label="Discipline"
                      value={data.discipline}
                      highlight
                    />
                    <SummaryRow label="Key Metric" value={data.performance} />
                    <SummaryRow
                      label="Experience Class"
                      value={data.experienceLevel}
                    />
                    <SummaryRow
                      label="Training Volume"
                      value={`${data.trainingDays}d/wk • ${data.competitionLevel}`}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-zinc-900 flex items-center justify-between relative z-10">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-4 cursor-pointer py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-sm text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div></div> // Empty div to maintain flex spacing
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                isStepValid()
                  ? "bg-zinc-100 text-black hover:bg-white cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95"
                  : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onComplete?.(data)}
              className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 transition-all bg-blue-500 text-white hover:bg-blue-400 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:scale-105 active:scale-95"
            >
              Finalize Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function SelectableCard({
  icon: Icon,
  label,
  iconColor,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  iconColor: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full relative flex items-center p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group overflow-hidden ${
        selected
          ? "bg-zinc-900 border-zinc-600 shadow-lg scale-[1.02]"
          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 hover:scale-[1.01]"
      }`}
    >
      {/* Active state background flare */}
      {selected && (
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      )}

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors ${
          selected ? "bg-zinc-800" : "bg-zinc-900 group-hover:bg-zinc-800"
        }`}
      >
        <Icon
          className={`w-6 h-6 ${selected ? iconColor : "text-zinc-500 group-hover:text-zinc-300"}`}
        />
      </div>

      <span
        className={`text-lg font-bold ${selected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}
      >
        {label}
      </span>

      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto"
        >
          <CheckCircle2 className="w-6 h-6 text-zinc-400" />
        </motion.div>
      )}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/50 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span
        className={`text-sm font-bold text-right ${highlight ? "text-blue-400" : "text-zinc-200"}`}
      >
        {value}
      </span>
    </div>
  );
}
