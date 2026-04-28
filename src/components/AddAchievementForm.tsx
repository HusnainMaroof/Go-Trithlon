// components/AddAchievementForm.tsx
"use client";

import React, {
  useState,
  useEffect,
  useActionState,
  startTransition,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, Loader2 } from "lucide-react";

import { ActionResponse } from "../type/ProfileType";
import { addAchievementAction } from "../actions/SetProfileAction";

interface Achievement {
  id?: string;
  title: string;
  description?: string | null;
}

const initialState: ActionResponse = {
  success: false,
  error: false,
  message: null,
  data: null,
};

export default function AddAchievementForm({
  onAdd,
}: {
  onAdd: (a: Achievement) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [state, dispatcher, isPending] = useActionState<ActionResponse, any>(
    addAchievementAction,
    initialState,
  );

  useEffect(() => {
    if (state.success && state.data && !isPending) {
      onAdd(state.data as Achievement);
      setTitle("");
      setDescription("");
      setOpen(false);

      // Reset the state so the next achievement doesn't immediately trigger this effect
      state.success = false;
    } else if (state.error && !isPending) {
      console.error(state.message || "Failed to save achievement");
    }
  }, [state, isPending, onAdd]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    startTransition(() => {
      dispatcher({
        title: trimmedTitle,
        description: description.trim() || undefined,
      });
    });
  };

  return (
    <div className="mt-3">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            className="w-full py-3 rounded-xl border border-dashed border-zinc-800 text-zinc-600 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-amber-400/40 hover:text-amber-400 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Achievement
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70">
                New Achievement
              </p>
              <button
                onClick={() => {
                  setOpen(false);
                  setTitle("");
                  setDescription("");
                }}
                className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Achievement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                disabled={isPending}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500/40 transition-colors font-medium disabled:opacity-50"
              />

              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                rows={2}
                disabled={isPending}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500/40 transition-colors resize-none font-medium disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!title.trim() || isPending}
                className="w-full py-2.5 rounded-lg bg-amber-400 text-black text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {isPending ? "Saving..." : "Save"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
