import ProfileSetup from "@/src/components/Profile";
import { getCurrentUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

const Page = async () => {
  const user = await getCurrentUser();
  const data = user?.authsuccess?.data;

  if (user.autherror.error || !data?.userToken) {
    redirect("/");
  }

  // if already onboarded, send them to dashboard
  if (data?.isOnboard) {
    redirect("/dashboard/home");
  }

  return <div><ProfileSetup /> </div>;
};

export default Page;
