import AthleteMarketplace from "@/src/components/AthleteMarket";
import NavBar from "@/src/components/NavBar";
import { getCurrentUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

const page = async () => {

  return (
    <div className="w-full h-full">
      <NavBar />
      <AthleteMarketplace />
    </div>
  );
};

export default page;
