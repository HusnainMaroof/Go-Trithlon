import AthleteMarketplace from "@/src/components/AthleteMarket";
import NavBar from "@/src/components/NavBar";
import React from "react";

const page = () => {
  return (
    <div className="w-full h-full">
      <NavBar />
      <AthleteMarketplace />
    </div>
  );
};

export default page;
