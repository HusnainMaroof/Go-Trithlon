"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import { useStateContext } from "../context/useContext";

const RegistrationPopup = ({}) => {
  const { showLoginPopup, setShowLoginPopup } = useStateContext();

  const handelgoogle = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <AnimatePresence>
      {showLoginPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Subtle backdrop fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLoginPopup(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Popup Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Background Glow Effect */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setShowLoginPopup(false)}
              className="absolute top-5 right-5  group-hover:bg-zinc-800 text-zinc-500 hover:text-white  rounded-full transition-all duration-200 cursor-pointer hover:scale-105"
            >
              <X className="w-5 h-5 group" />
            </button>

            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-400/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
                <Zap className="text-blue-400 w-7 h-7" fill="currentColor" />
              </div>

              {/* Headings */}
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white tracking-tight">
                  Join TriMatch
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
                  Sign in to specialize your discipline and find your perfect
                  triathlon relay team.
                </p>
              </div>

              {/* Action Button - Google Only */}
              <div onClick={handelgoogle} className="w-full pt-4">
                <button className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white transition-all cursor-pointer group shadow-sm">
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="font-medium text-sm text-zinc-200 group-hover:text-white">
                    Continue with Google
                  </span>
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-zinc-500 max-w-[260px] text-center mt-4">
                By continuing, you agree to TriMatch's Terms of Service and
                Privacy Policy.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RegistrationPopup;
