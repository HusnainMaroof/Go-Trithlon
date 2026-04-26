import InvitesDashboard from "@/src/components/InvitesDashboard";
import NavBar from "@/src/components/NavBar";
import { getCurrentUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

const pages = async () => {
  

  return (
    <div className="w-full">
      {" "}
      <NavBar />
      <InvitesDashboard />{" "}
    </div>
  );
};

export default pages;
