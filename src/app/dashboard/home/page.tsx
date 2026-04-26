import Dashboard from "@/src/components/Dashboard";
import NavBar from "@/src/components/NavBar";
import { getCurrentUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

const Page = async () => {
 
  return (
    <div className="w-full h-full">
      <NavBar />
      <Dashboard />
    </div>
  );
};

export default Page;
