import ProfileSetup from "@/src/components/Profile";
import { getCurrentUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

const Page = async () => {
 

  return <div><ProfileSetup /> </div>;
};

export default Page;
