"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import toast from "react-hot-toast";
import { UserType } from "../type/authTypes";

type StateContextType = {
  user: UserType | null;
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  showLoginPopup: boolean;
  setShowLoginPopup: React.Dispatch<React.SetStateAction<boolean>>;
};

const StateContext = createContext<StateContextType | null>(null);

export const StateProvider = ({
  children,
  user: initialUser,
}: {
  children: ReactNode;
  user: UserType | null;
}) => {
  const [user, setUser] = useState<UserType | null>(initialUser);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    setUser(initialUser);
    // console.log("from state context", initialUser);
  }, [initialUser]);

  return (
    <StateContext.Provider
      value={{
        user,
        setUser,
        showLoginPopup,
        setShowLoginPopup,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => {
  const context = useContext(StateContext);

  if (!context) {
    throw new Error("use State must be used inside State Provider");
  }

  return context;
};
