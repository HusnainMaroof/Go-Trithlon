"use client";

import React, { startTransition, useActionState, useEffect } from "react";

import { logoutAction } from "../actions/logoutAction";
import { LogOut, Loader2 } from "lucide-react";
import { useStateContext } from "../context/useContext";
import { ActionResponse } from "../type/inviteTypes";
import { useRouter } from "next/navigation";

const initialState: ActionResponse = {
  success: false,
  error: false,
  message: null,
  data: null,
};

const Logout = () => {
  const { user, setUser } = useStateContext();
  const router = useRouter();

  const [state, dispatcher, isPending] = useActionState<ActionResponse>(
    logoutAction as any,
    initialState,
  );

  const handleLogout = () => {
    startTransition(() => {
      dispatcher();
    });
  };

  useEffect(() => {
    if (state.success && state.message === "logout") {
      console.log(
        "wdkvkjnwrojvnwrkj;nwrkjlvnwerkjvbwekljvbwrlkjgbwekljbwrlkjb erkjfwrkjverwkljb",
      );

      setUser(null); // 🔥 THIS is the real logout
      router.refresh(); // optional redirect
    }
  }, [state]);
  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-3 sm:py-3.5 mt-2 rounded-xl text-sm  font-bold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 opacity-80 animate-spin shrink-0" />
      ) : (
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5 opacity-80 shrink-0" />
      )}
      <span>{isPending ? "Signing out..." : "Sign Out"}</span>
    </button>
  );
};

export default Logout;
