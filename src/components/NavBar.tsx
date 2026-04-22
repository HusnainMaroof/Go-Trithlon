"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Zap,
  Menu,
  X,
  User,
  LogOut,
  Activity,
  ChevronDown,
  Settings,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";
import { useStateContext } from "../context/useContext";

// Helper component for robust profile image loading
const ProfileAvatar = ({
  src,
  alt,
  sizeClass = "w-9 h-9",
  borderClass = "border border-zinc-700",
}: {
  src?: string;
  alt: string;
  sizeClass?: string;
  borderClass?: string;
}) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state if the source changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (!src || imgError) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-b from-zinc-800 to-zinc-900 ${borderClass} flex items-center justify-center shadow-inner`}
      >
        <User className="w-[45%] h-[45%] text-zinc-500" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setImgError(true)}
      className={`${sizeClass} rounded-full ${borderClass} object-cover shadow-sm bg-zinc-900`}
    />
  );
};

const NavBar = () => {
  const { user, setShowLoginPopup } = useStateContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use Next.js pathname to dynamically highlight the active tab
  const pathname = usePathname();

  const isLoggedIn = Boolean(user?.userToken);

  const navLinks = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard/home" },
    { id: "athletes", label: "Athletes", href: "/dashboard/athletes" },
    { id: "my-team", label: "My Team", href: "/dashboard/myteam" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Premium Dropdown Animation Variants
  const dropdownVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 12,
      scale: 0.95,
      filter: "blur(8px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
        mass: 0.8,
      },
    },
    exit: {
      opacity: 0,
      y: 8,
      scale: 0.96,
      filter: "blur(4px)",
      transition: { duration: 0.15, ease: "easeIn" },
    },
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              onClick={() => {
                redirect("/");
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-400/10 border border-blue-500/20 flex items-center justify-center shadow-inner group-hover:border-blue-500/40 group-hover:shadow-blue-500/20 transition-all duration-300">
                <Zap
                  className="text-blue-400 w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                  fill="currentColor"
                />
              </div>
              <span className="font-semibold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                TriMatch
              </span>
            </div>

            {/* Desktop Navigation (Only show if onboarded/logged in) */}
            {isLoggedIn && user?.isOnboard && (
              <div className="hidden md:block">
                <div className="flex items-center space-x-1 border border-zinc-800 rounded-full p-1 bg-zinc-950 shadow-inner">
                  {navLinks.map((tab) => {
                    // Check if current route matches tab href
                    const isActive = pathname?.startsWith(tab.href);

                    return (
                      <Link key={tab.id} href={tab.href}>
                        <button
                          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border cursor-pointer ${
                            isActive
                              ? "bg-zinc-800 text-white border-zinc-700 shadow-sm"
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900 border-transparent"
                          }`}
                        >
                          {tab.label}
                        </button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Right Side Actions: Profile OR Sign In */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-1 border border-zinc-800 rounded-full p-1 bg-zinc-950 shadow-inner">
                <Link key={0} href={`/dashboard/invites`}>
                  <button
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border cursor-pointer 
                    
                         "bg-zinc-800 text-white border-zinc-700 shadow-sm"
                      
                    `}
                  >
                    My Invites
                  </button>
                </Link>
              </div>

              {isLoggedIn ? (
                <>
                  {/* Desktop Profile Dropdown */}
                  <div className="hidden md:block relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`flex items-center gap-3 bg-zinc-950 border rounded-full pl-4 pr-2 py-1.5 shadow-sm transition-all cursor-pointer group ${
                        dropdownOpen
                          ? "border-zinc-600 bg-zinc-900"
                          : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"
                      }`}
                    >
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-white leading-tight">
                          {user?.displayName || "Athlete"}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {user?.athleteData?.discipline?.join(", ") ||
                            "In Training"}
                        </span>
                      </div>

                      <div className="ml-1 relative">
                        {/* Dynamic glow effect behind avatar on hover/open */}
                        <div
                          className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300 ${dropdownOpen ? "bg-blue-500/30 opacity-100" : "bg-blue-500/0 opacity-0 group-hover:opacity-40"}`}
                        />
                        <ProfileAvatar
                          src={user?.profileImage}
                          alt={user?.displayName || "User"}
                          sizeClass="w-9 h-9"
                          borderClass={`border transition-colors duration-300 relative z-10 ${dropdownOpen ? "border-zinc-500" : "border-zinc-700 group-hover:border-zinc-600"}`}
                        />
                      </div>

                      <ChevronDown
                        className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ease-out ${dropdownOpen ? "rotate-180 text-zinc-300" : "group-hover:text-zinc-400"}`}
                      />
                    </button>

                    {/* Animated Dropdown Menu */}
                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute right-0 mt-3 w-60 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden py-2 z-50 origin-top-right"
                        >
                          {/* Mini header inside dropdown */}
                          <div className="px-4 py-2 border-b border-zinc-800/60 mb-1">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                              Signed in as
                            </p>
                            <p className="text-sm font-medium text-zinc-300 truncate">
                              {user?.email}
                            </p>
                          </div>

                          <div className="px-2 py-1 space-y-0.5">
                            <Link
                              href={`/dashboard/athletes/athletesprofile/${user?.sessionId}`}
                            >
                              <button className="group flex items-center gap-3 w-full px-3 py-2.5 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition-all cursor-pointer">
                                <User className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                                <span className="transform transition-transform duration-200 group-hover:translate-x-1">
                                  View Profile
                                </span>
                              </button>
                            </Link>
                            <button className="group flex items-center gap-3 w-full px-3 py-2.5 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition-all cursor-pointer">
                              <Settings className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                              <span className="transform transition-transform duration-200 group-hover:translate-x-1">
                                Account Settings
                              </span>
                            </button>
                          </div>

                          <div className="h-px bg-zinc-800/60 my-1 w-full" />

                          <div className="px-2 py-1">
                            <button className="group flex items-center gap-3 w-full px-3 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer">
                              <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Mobile menu button */}
                  <div className="md:hidden flex items-center">
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
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
                <button
                  onClick={() => setShowLoginPopup(true)}
                  className="px-6 py-2 md:px-6 md:py-2.5 rounded-xl font-bold text-sm transition-all bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white shadow-sm whitespace-nowrap cursor-pointer hover:shadow-zinc-800/50"
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
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-zinc-950 border-b border-zinc-800 overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-5 space-y-5">
              {isLoggedIn && (
                <div className="flex items-center gap-4 pb-5 border-b border-zinc-800/60">
                  <ProfileAvatar
                    src={user?.profileImage}
                    alt={user?.displayName || "User"}
                    sizeClass="w-14 h-14"
                    borderClass="border-2 border-zinc-700"
                  />
                  <div>
                    <div className="font-bold text-white text-lg">
                      {user?.displayName || "Athlete"}
                    </div>
                    <div className="text-sm text-zinc-400">{user?.email}</div>
                  </div>
                </div>
              )}

              {user?.isOnboard && (
                <div className="space-y-1.5">
                  {navLinks.map((tab) => {
                    const isActive = pathname?.startsWith(tab.href);

                    return (
                      <Link
                        key={tab.id}
                        href={tab.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <button
                          className={`block w-full text-left px-4 py-3.5 rounded-xl text-base font-bold transition-colors border cursor-pointer ${
                            isActive
                              ? "bg-zinc-900 text-white border-zinc-800 shadow-sm"
                              : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white border-transparent"
                          }`}
                        >
                          {tab.label}
                        </button>
                      </Link>
                    );
                  })}

                  <div className="h-px bg-zinc-800/60 my-4 w-full" />

                  <button className="flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl text-base font-bold text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent transition-colors cursor-pointer">
                    <User className="w-5 h-5 text-zinc-500" /> View Profile
                  </button>
                  <button className="flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl text-base font-bold text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent transition-colors cursor-pointer">
                    <Settings className="w-5 h-5 text-zinc-500" /> Account
                    Settings
                  </button>

                  <button className="flex items-center gap-3 w-full text-left px-4 py-3.5 mt-2 rounded-xl text-base font-bold text-red-400 hover:bg-red-500/10 border border-transparent transition-colors cursor-pointer">
                    <LogOut className="w-5 h-5 opacity-80" /> Sign Out
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
