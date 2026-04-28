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
  Mail,
  Loader2,
  Bell,
} from "lucide-react";
import { useState, useRef, useEffect, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStateContext } from "../context/useContext";
import { logoutAction } from "../actions/logoutAction";
import Logout from "./Logout";
import { inviteAction } from "../actions/InviteAction"; // Make sure this path is correct

// ─── POLLING HOOK ──────────────────────────────────────────────────────────────
function useInvitePolling(intervalMs = 15000) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchInvites = async () => {
      try {
        const response = await inviteAction(
          { success: false, error: false, message: null, data: null },
          { service: "GET_INVITES" },
        );

        if (isMounted && response.success && response.data) {
          const received = response.data.received || [];
          // Only count invites that are PENDING and haven't been read yet
          const count = received.filter(
            (inv: any) => inv.status === "PENDING" && inv.isRead === false,
          ).length;
          setPendingCount(count);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    fetchInvites();
    const intervalId = setInterval(fetchInvites, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [intervalMs]);

  return pendingCount;
}

// ─── Profile Avatar ────────────────────────────────────────────────────────────
const ProfileAvatar = ({
  src,
  alt,
  sizeClass = "w-9 h-9",
  borderClass = "border border-zinc-700",
}: {
  src?: string | null;
  alt: string;
  sizeClass?: string;
  borderClass?: string;
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (!src || imgError) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-linear-to-b from-zinc-800 to-zinc-900 ${borderClass} flex items-center justify-center shadow-inner shrink-0 overflow-hidden relative`}
      >
        <User className="w-[45%] h-[45%] text-zinc-500" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full ${borderClass} overflow-hidden shadow-sm bg-zinc-900 shrink-0 relative`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="48px"
        className="object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
};

// ─── Nav Item ──────────────────────────────────────────────────────────────────
const NavItem = ({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}) => (
  <Link href={href} onClick={onClick}>
    <button
      className={`relative px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200 border cursor-pointer ${
        isActive
          ? "bg-zinc-800 text-white border-zinc-700 shadow-sm"
          : "text-zinc-400 hover:text-white hover:bg-zinc-900 border-transparent"
      }`}
    >
      {isActive && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-full bg-zinc-800 border border-zinc-700 -z-10"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      {label}
    </button>
  </Link>
);

// ─── NavBar ────────────────────────────────────────────────────────────────────
const NavBar = () => {
  const { user, setShowLoginPopup } = useStateContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const isLoggedIn = Boolean(user?.userToken);

  // Poll for invites
  const pendingInviteCount = useInvitePolling(15000);

  const navLinks = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard/home" },
    { id: "athletes", label: "Athletes", href: "/dashboard/athletes" },
    { id: "my-team", label: "My Team", href: "/dashboard/myteam" },
    { id: "invites", label: "My Invites", href: "/dashboard/invites" },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const dropdownVariants: Variants = {
    hidden: { opacity: 0, y: 12, scale: 0.95, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 350, damping: 25, mass: 0.8 },
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
            {/* ── Logo ── */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-3 cursor-pointer group bg-transparent border-none outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500/10 to-cyan-400/10 border border-blue-500/20 flex items-center justify-center shadow-inner group-hover:border-blue-500/40 group-hover:shadow-blue-500/20 transition-all duration-300">
                <Zap
                  className="text-blue-400 w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                  fill="currentColor"
                />
              </div>
              <span className="font-semibold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                TriMatch
              </span>
            </button>

            {/* ── Desktop Nav ── */}
            {isLoggedIn && user?.isOnboard && (
              <div className="hidden md:block">
                <div className="flex items-center space-x-1 border border-zinc-800 rounded-full p-1 bg-zinc-950 shadow-inner">
                  {navLinks.map((tab) => (
                    <NavItem
                      key={tab.id}
                      href={tab.href}
                      label={tab.label}
                      isActive={Boolean(pathname?.startsWith(tab.href))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Right Side ── */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  {/* Notification Bell */}
                  {user?.isOnboard && (
                    <Link href="/dashboard/invites">
                      <button className="relative p-2 rounded-full border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer mr-1">
                        <Bell className="w-5 h-5" />
                        <AnimatePresence>
                          {pendingInviteCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 border-2 border-zinc-950 text-[9px] font-bold text-white shadow-sm"
                            >
                              {pendingInviteCount}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </Link>
                  )}

                  {/* Desktop Profile Dropdown */}
                  <div className="hidden md:block relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen((prev) => !prev)}
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
                          {user?.athleteData?.disciplines?.join(", ") ||
                            "In Training"}
                        </span>
                      </div>

                      <div className="ml-1 relative">
                        <div
                          className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300 ${
                            dropdownOpen
                              ? "bg-blue-500/30 opacity-100"
                              : "bg-blue-500/0 opacity-0 group-hover:opacity-40"
                          }`}
                        />
                        <ProfileAvatar
                          src={user?.profileImage}
                          alt={user?.displayName || "User"}
                          sizeClass="w-9 h-9"
                          borderClass={`border transition-colors duration-300 relative z-10 ${
                            dropdownOpen
                              ? "border-zinc-500"
                              : "border-zinc-700 group-hover:border-zinc-600"
                          }`}
                        />
                      </div>

                      <ChevronDown
                        className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ease-out ${
                          dropdownOpen
                            ? "rotate-180 text-zinc-300"
                            : "group-hover:text-zinc-400"
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute right-0 mt-3 w-60 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden py-2 z-50 origin-top-right"
                        >
                          {/* Signed-in header */}
                          <div className="px-4 py-2.5 border-b border-zinc-800/60 mb-1">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
                              Signed in as
                            </p>
                            <p className="text-sm font-medium text-zinc-300 truncate">
                              {user?.email}
                            </p>
                          </div>

                          <div className="px-2 py-1 space-y-0.5">
                            <Link
                              href={`/dashboard/athletes/athletesprofile/${user?.sessionId}`}
                              onClick={() => setDropdownOpen(false)}
                            >
                              <button className="group flex items-center gap-3 w-full px-3 py-2.5 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition-all cursor-pointer">
                                <User className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                                <span className="transform transition-transform duration-200 group-hover:translate-x-1">
                                  View Profile
                                </span>
                              </button>
                            </Link>

                            <Link
                              href="/dashboard/invites"
                              onClick={() => setDropdownOpen(false)}
                            >
                              <button className="group flex items-center justify-between w-full px-3 py-2.5 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition-all cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <Mail className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                                  <span className="transform transition-transform duration-200 group-hover:translate-x-1">
                                    My Invites
                                  </span>
                                </div>
                                {pendingInviteCount > 0 && (
                                  <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-md">
                                    {pendingInviteCount}
                                  </span>
                                )}
                              </button>
                            </Link>

                            <button className="group flex items-center gap-3 w-full px-3 py-2.5 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition-all cursor-pointer">
                              <Settings className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                              <span className="transform transition-transform duration-200 group-hover:translate-x-1">
                                Account Settings
                              </span>
                            </button>
                          </div>

                          <div className="h-px bg-zinc-800/60 my-1 mx-2" />

                          {/* ── Desktop Sign Out ── */}
                          <div className="px-2 py-1">
                            <Logout />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Mobile Hamburger */}
                  <div className="md:hidden flex items-center">
                    <button
                      onClick={() => setMobileMenuOpen((prev) => !prev)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={mobileMenuOpen ? "close" : "open"}
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {mobileMenuOpen ? (
                            <X className="w-6 h-6" />
                          ) : (
                            <Menu className="w-6 h-6" />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginPopup(true)}
                  className="px-6 py-2 md:px-6 md:py-2.5 rounded-xl font-bold text-sm transition-all bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white shadow-sm whitespace-nowrap cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
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
              {/* Mobile Profile Header */}
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

              {user?.isOnboard && (
                <div className="space-y-1.5">
                  {navLinks.map((tab) => {
                    const isActive = Boolean(pathname?.startsWith(tab.href));
                    return (
                      <Link key={tab.id} href={tab.href}>
                        <button
                          className={`block w-full text-left px-4 py-3.5 rounded-xl text-base font-bold transition-colors border cursor-pointer flex items-center justify-between ${
                            isActive
                              ? "bg-zinc-900 text-white border-zinc-800 shadow-sm"
                              : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white border-transparent"
                          }`}
                        >
                          <span>{tab.label}</span>
                          {/* Render badge on mobile nav if it's the invites tab */}
                          {tab.id === "invites" && pendingInviteCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                              {pendingInviteCount} NEW
                            </span>
                          )}
                        </button>
                      </Link>
                    );
                  })}

                  <div className="h-px bg-zinc-800/60 my-3 w-full" />

                  <Link
                    href={`/dashboard/athletes/athletesprofile/${user?.sessionId}`}
                  >
                    <button className="flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl text-base font-bold text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent transition-colors cursor-pointer">
                      <User className="w-5 h-5 text-zinc-500" />
                      View Profile
                    </button>
                  </Link>

                  <button className="flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl text-base font-bold text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent transition-colors cursor-pointer">
                    <Settings className="w-5 h-5 text-zinc-500" />
                    Account Settings
                  </button>

                  {/* ── Mobile Sign Out ── */}
                  <Logout />
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
