import MyTeamDashboard from "@/src/components/MyTeam";
import NavBar from "@/src/components/NavBar";
import React from "react";

const page = () => {
  return (
    <div className="w-full h-full">
      <NavBar />
      <MyTeamDashboard />
    </div>
  );
};

export default page;
