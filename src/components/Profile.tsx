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
import { setprofileAction } from "../actions/dashboardAction";
import {
  CompetitionLevel,
  Discipline,
  ExperienceLevel,
  setProfilePayload,
} from "../type/dashboardtype";

interface FormState {
  displayName: string;
  locationCity: string;
  discipline: Discipline[];
  swimTime100m: string;
  cycleTime10km: string;
  runTime5km: string;
  experienceLevel: ExperienceLevel | null;
  trainingDaysPerWeek: number | null;
  competitionLevel: CompetitionLevel | null;
}

export type ActionResponse = {
  success: boolean;
  error: boolean;
  message: string | null;
  data: unknown;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6; // Steps 1–5 are inputs; step 6 is the summary.

const initialState: ActionResponse = {
  success: false,
  error: false,
  message: null,
  data: null,
};

const initialFormState: FormState = {
  displayName: "",
  locationCity: "",
  discipline: [],
  swimTime100m: "",
  cycleTime10km: "",
  runTime5km: "",
  experienceLevel: null,
  trainingDaysPerWeek: null,
  competitionLevel: null,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileSetup() {
  const [state, dispatcher, isPending] = useActionState<
    ActionResponse,
    setProfilePayload
  >(setprofileAction, initialState);

  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormState>(initialFormState);

  // Drive UI off action response (redirect on success, surface error on failure)
  useEffect(() => {
    if (state.success) {
      // TODO: replace with router.push("/dashboard") or similar
      console.info("Profile saved — redirect here");
    }
    if (state.error) {
      // TODO: replace with a toast / inline error component
      console.error("Profile save failed:", state.message);
    }
  }, [state]);

  const updateData = (fields: Partial<FormState>) =>
    setData((prev) => ({ ...prev, ...fields }));

  const toggleDiscipline = (disc: Discipline) => {
    setData((prev) => {
      const alreadySelected = prev.discipline.includes(disc);
      const newDiscipline = alreadySelected
        ? prev.discipline.filter((d) => d !== disc)
        : [...prev.discipline, disc];

      return {
        ...prev,
        discipline: newDiscipline,
        ...(alreadySelected && disc === Discipline.SWIMMER
          ? { swimTime100m: "" }
          : {}),
        ...(alreadySelected && disc === Discipline.CYCLIST
          ? { cycleTime10km: "" }
          : {}),
        ...(alreadySelected && disc === Discipline.RUNNER
          ? { runTime5km: "" }
          : {}),
      };
    });
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return (
          data.displayName.trim() !== "" && data.locationCity.trim() !== ""
        );
      case 2:
        return data.discipline.length > 0;
      case 3:
        return data.discipline.every((d) => {
          if (d === Discipline.SWIMMER) return data.swimTime100m.trim() !== "";
          if (d === Discipline.CYCLIST) return data.cycleTime10km.trim() !== "";
          if (d === Discipline.RUNNER) return data.runTime5km.trim() !== "";
          return false;
        });
      case 4:
        return data.experienceLevel !== null;
      case 5:
        return (
          data.trainingDaysPerWeek !== null && data.competitionLevel !== null
        );
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

  /**
   * Builds the strictly-typed payload and dispatches the server action.
   * Guards ensure experienceLevel and competitionLevel are non-null here,
   * matching isStepValid() enforcement on step 4 and 5.
   */
  const onComplete = () => {
    if (!data.experienceLevel || !data.competitionLevel) return;

    const finalPayload: setProfilePayload = {
      displayName: data.displayName,
      locationCity: data.locationCity,
      discipline: data.discipline,
      swimTime100m: data.swimTime100m ? parseFloat(data.swimTime100m) : null,
      cycleTime10km: data.cycleTime10km ? parseFloat(data.cycleTime10km) : null,
      runTime5km: data.runTime5km ? parseFloat(data.runTime5km) : null,
      experienceLevel: data.experienceLevel,
      trainingDaysPerWeek: data.trainingDaysPerWeek,
      competitionLevel: data.competitionLevel,
    };

    startTransition(() => {
      dispatcher(finalPayload);
    });
  };

  /** "SWIMMER" → "Swimmer" */
  const formatEnum = (val: string | null): string => {
    if (!val) return "";
    return val.charAt(0) + val.slice(1).toLowerCase();
  };

  useEffect(() => {
    if (state.success && state.message === "Profile updated successfully") {
      window.location.href="/dashboard/home"
    }
  }, [state]);

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 sm:p-6 selection:bg-blue-500/30 font-sans">
      {/* Background Gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800/80 rounded-[2rem] p-6 sm:p-10 shadow-2xl overflow-hidden flex flex-col min-h-[550px] sm:min-h-[600px]">
        {/* Progress Bar */}
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
        <div className="flex-grow relative z-10 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col"
            >
              {/* ── Step 1: Basic Information ────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Profile Setup
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Let's set up your identity on TriMatch.
                    </p>
                  </div>

                  <div className="space-y-5 mt-8">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Display Name
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
                        <MapPin className="w-3.5 h-3.5" /> Location (City)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Austin, TX"
                        value={data.locationCity}
                        onChange={(e) =>
                          updateData({ locationCity: e.target.value })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-blue-500 focus:bg-zinc-900 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Disciplines ───────────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Your Disciplines
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Select the triathlon legs you want to compete in. You can
                      pick one or more.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <SelectableCard
                      icon={Waves}
                      label="Swimmer"
                      iconColor="text-cyan-400"
                      selected={data.discipline.includes(Discipline.SWIMMER)}
                      onClick={() => toggleDiscipline(Discipline.SWIMMER)}
                    />
                    <SelectableCard
                      icon={Bike}
                      label="Cyclist"
                      iconColor="text-amber-400"
                      selected={data.discipline.includes(Discipline.CYCLIST)}
                      onClick={() => toggleDiscipline(Discipline.CYCLIST)}
                    />
                    <SelectableCard
                      icon={Footprints}
                      label="Runner"
                      iconColor="text-emerald-400"
                      selected={data.discipline.includes(Discipline.RUNNER)}
                      onClick={() => toggleDiscipline(Discipline.RUNNER)}
                    />
                  </div>

                  <div className="pt-4 h-12 flex justify-center items-center">
                    {data.discipline.length > 0 ? (
                      <div className="flex flex-wrap gap-2 justify-center">
                        <span className="text-xs text-zinc-500 flex items-center mr-2">
                          Selected:
                        </span>
                        {data.discipline.map((d) => (
                          <motion.span
                            key={d}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center shadow-sm"
                          >
                            {formatEnum(d)}
                          </motion.span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600 animate-pulse">
                        Awaiting Selection...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 3: Performance Metrics ──────────────────────────── */}
              {step === 3 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Performance Metrics
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Log your best recent times to help match with similar
                      athletes.
                    </p>
                  </div>

                  <div
                    className={`mt-6 grid gap-4 w-full max-h-[360px] overflow-y-auto hide-scrollbar px-1 ${
                      data.discipline.length > 1
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1 max-w-sm mx-auto"
                    }`}
                  >
                    {data.discipline.map((disc) => {
                      const isSwimmer = disc === Discipline.SWIMMER;
                      const isCyclist = disc === Discipline.CYCLIST;

                      const val = isSwimmer
                        ? data.swimTime100m
                        : isCyclist
                          ? data.cycleTime10km
                          : data.runTime5km;

                      const setVal = (newVal: string) => {
                        if (isSwimmer) updateData({ swimTime100m: newVal });
                        else if (isCyclist)
                          updateData({ cycleTime10km: newVal });
                        else updateData({ runTime5km: newVal });
                      };

                      return (
                        <div
                          key={disc}
                          className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center transition-all hover:bg-zinc-900/60"
                        >
                          <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center justify-center gap-2 mb-4 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 w-fit mx-auto">
                            <Activity className="w-3.5 h-3.5" />
                            {isSwimmer && "100m Pace (Seconds)"}
                            {isCyclist && "10km Pace (Mins)"}
                            {!isSwimmer && !isCyclist && "5k Pace (Mins)"}
                          </label>

                          <input
                            type="number"
                            step="any"
                            min={isSwimmer ? "30" : "5"}
                            max={isSwimmer ? "300" : "120"}
                            placeholder={
                              isSwimmer ? "85.5" : isCyclist ? "20.5" : "21.5"
                            }
                            value={val}
                            onChange={(e) => setVal(e.target.value)}
                            className="w-full bg-black border border-zinc-800 focus:border-blue-500 rounded-xl px-4 py-4 text-white placeholder:text-zinc-700 outline-none transition-all text-2xl sm:text-3xl font-black text-center tracking-tighter shadow-inner"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step 4: Experience Level ──────────────────────────────── */}
              {step === 4 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Experience Level
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Select your current level of competitive racing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    {(
                      [
                        { label: "Beginner", value: ExperienceLevel.BEGINNER },
                        {
                          label: "Intermediate",
                          value: ExperienceLevel.INTERMEDIATE,
                        },
                        { label: "Advanced", value: ExperienceLevel.ADVANCED },
                      ] as const
                    ).map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => updateData({ experienceLevel: value })}
                        className={`w-full relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all cursor-pointer group overflow-hidden min-h-[130px] ${
                          data.experienceLevel === value
                            ? "bg-zinc-900 border-zinc-600 shadow-lg scale-[1.02]"
                            : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 hover:scale-[1.01]"
                        }`}
                      >
                        {data.experienceLevel === value && (
                          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        )}
                        <span
                          className={`text-lg font-bold ${
                            data.experienceLevel === value
                              ? "text-white"
                              : "text-zinc-400 group-hover:text-zinc-200"
                          }`}
                        >
                          {label}
                        </span>
                        {data.experienceLevel === value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3"
                          >
                            <CheckCircle2 className="w-5 h-5 text-blue-400" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 5: Training & Competition ───────────────────────── */}
              {step === 5 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                      Training & Competition
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      Let others know your commitment level.
                    </p>
                  </div>

                  <div className="space-y-8 mt-6">
                    <div className="space-y-4">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Training Days /
                        Week
                      </label>
                      <div className="grid grid-cols-7 gap-2 sm:gap-3">
                        {([1, 2, 3, 4, 5, 6, 7] as const).map((num) => (
                          <button
                            key={num}
                            onClick={() =>
                              updateData({ trainingDaysPerWeek: num })
                            }
                            className={`aspect-square w-full rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all cursor-pointer ${
                              data.trainingDaysPerWeek === num
                                ? "bg-zinc-100 text-black border border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-110"
                                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-white hover:scale-105"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5" /> Competition Level
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {(
                          [
                            { label: "None", value: CompetitionLevel.NONE },
                            { label: "Local", value: CompetitionLevel.LOCAL },
                            {
                              label: "National",
                              value: CompetitionLevel.NATIONAL,
                            },
                            {
                              label: "Professional",
                              value: CompetitionLevel.PROFESSIONAL,
                            },
                          ] as const
                        ).map(({ label, value }) => (
                          <button
                            key={value}
                            onClick={() =>
                              updateData({ competitionLevel: value })
                            }
                            className={`py-3.5 px-4 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                              data.competitionLevel === value
                                ? "bg-zinc-800 border-zinc-600 text-white shadow-md"
                                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-300"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 6: Summary ──────────────────────────────────────── */}
              {step === 6 && (
                <div className="space-y-6 flex flex-col h-full justify-center">
                  <div className="text-center mb-4">
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
                      Review your profile details before finishing.
                    </p>
                  </div>

                  {/* Error banner */}
                  {state.error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 text-center">
                      {state.message ??
                        "Something went wrong. Please try again."}
                    </div>
                  )}

                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-1 max-h-[300px] overflow-y-auto hide-scrollbar">
                    <SummaryRow label="Display Name" value={data.displayName} />
                    <SummaryRow label="Location" value={data.locationCity} />
                    <SummaryRow
                      label="Experience Level"
                      value={formatEnum(data.experienceLevel)}
                    />
                    <SummaryRow
                      label="Training & Comp"
                      value={`${data.trainingDaysPerWeek}d/wk • ${formatEnum(data.competitionLevel)}`}
                    />

                    <div className="pt-4 pb-2 mt-2 border-t border-zinc-800/50">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-3 block">
                        Disciplines & Performance
                      </span>
                      <div className="space-y-2">
                        {data.discipline.map((d) => {
                          const isSwimmer = d === Discipline.SWIMMER;
                          const isCyclist = d === Discipline.CYCLIST;
                          const val = isSwimmer
                            ? data.swimTime100m
                            : isCyclist
                              ? data.cycleTime10km
                              : data.runTime5km;
                          const unit = isSwimmer ? "sec" : "min";

                          return (
                            <div
                              key={d}
                              className="flex justify-between items-center bg-black/50 px-3 py-2.5 rounded-lg border border-zinc-800/50"
                            >
                              <span className="text-sm text-zinc-300 font-bold">
                                {formatEnum(d)}
                              </span>
                              <span className="text-sm font-bold text-white truncate max-w-[60%] text-right">
                                {val} {unit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
              disabled={isPending}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-sm text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
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
              onClick={onComplete}
              disabled={isPending}
              className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 transition-all bg-blue-500 text-white hover:bg-blue-400 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isPending ? "Saving..." : "Finish Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

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
      className={`w-full min-h-[140px] relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all cursor-pointer group overflow-hidden ${
        selected
          ? "bg-zinc-900 border-zinc-600 shadow-lg scale-[1.02]"
          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 hover:scale-[1.01]"
      }`}
    >
      {selected && (
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      )}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3"
        >
          <CheckCircle2 className="w-5 h-5 text-zinc-400" />
        </motion.div>
      )}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
          selected ? "bg-zinc-800" : "bg-zinc-900 group-hover:bg-zinc-800"
        }`}
      >
        <Icon
          className={`w-6 h-6 ${
            selected ? iconColor : "text-zinc-500 group-hover:text-zinc-300"
          }`}
        />
      </div>
      <span
        className={`text-base font-bold ${
          selected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
        }`}
      >
        {label}
      </span>
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
    <div className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span
        className={`text-sm font-bold text-right ${
          highlight ? "text-blue-400" : "text-zinc-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
