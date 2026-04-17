"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Menu, X, User, LogOut, Activity } from "lucide-react";
import { useState } from "react";
import { useStateContext } from "../context/useContext";

// Mocking the context for the standalone preview environment

const NavBar = () => {
  const { user, setShowLoginPopup } = useStateContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // Local state for demo purposes

  // Determine auth status based on userToken
  const isLoggedIn = Boolean(user?.userToken);

  const navLinks = [
    { id: "dashboard", label: "Dashboard" },
    { id: "athletes", label: "Athletes" },
    { id: "my-team", label: "My Team" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Updated to match Popup Icon style */}
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-400/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
                <Zap className="text-blue-400 w-5 h-5" fill="currentColor" />
              </div>
              <span className="font-semibold text-xl tracking-tight text-white">
                TriMatch
              </span>
            </div>

            {/* Desktop Navigation (Only show if onboarded/logged in) */}
            {isLoggedIn && user?.isOnboard && (
              <div className="hidden md:block">
                <div className="flex items-center space-x-1 border border-zinc-800 rounded-full p-1 bg-zinc-950">
                  {navLinks.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        activeTab === tab.id
                          ? "bg-zinc-800 text-white border-zinc-700 shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900 border-transparent"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Right Side Actions: Profile OR Sign In */}
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  {/* Desktop Profile */}
                  <div className="hidden md:flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-full pl-4 pr-1.5 py-1.5 shadow-sm">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-semibold text-white leading-tight">
                        {user?.displayName || "Athlete"}
                      </span>
                      <span className="text-xs text-blue-400 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {user?.athleteData?.discipline || "In Training"}
                      </span>
                    </div>

                    {/* Profile Image with Fallback */}
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.displayName}
                        className="w-9 h-9 rounded-full border border-zinc-700 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <User className="w-4 h-4 text-zinc-400" />
                      </div>
                    )}
                  </div>

                  {/* Mobile menu button (Only show hamburger if logged in) */}
                  <div className="md:hidden flex items-center">
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors"
                    >
                      {mobileMenuOpen ? (
                        <X className="w-6 h-6" />
                      ) : (
                        <Menu className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* Updated Sign In button to match popup's low-fade Google button */
                <button
                  onClick={() => setShowLoginPopup(true)}
                 className="px-6 py-2 rounded-xl font-medium text-sm transition-all duration-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-200 hover:text-white shadow-sm whitespace-nowrap cursor-pointer "
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-950 border-b border-zinc-800 overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Mobile User Profile Section */}
              {isLoggedIn && (
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full border border-zinc-700 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <User className="w-6 h-6 text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-white">
                      {user?.displayName || "Athlete"}
                    </div>
                    <div className="text-sm text-zinc-400">{user?.email}</div>
                  </div>
                </div>
              )}

              {/* Mobile Nav Links */}
              {user?.isOnboard && (
                <div className="space-y-1">
                  {navLinks.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors border ${
                        activeTab === tab.id
                          ? "bg-zinc-900 text-white border-zinc-800 shadow-sm"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-white border-transparent"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                  <button className="flex items-center gap-2 w-full text-left px-4 py-3 mt-4 rounded-xl text-base font-medium text-red-400 hover:bg-red-500/10 border border-transparent transition-colors cursor-pointer">
                    <LogOut className="w-5 h-5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavBar;
