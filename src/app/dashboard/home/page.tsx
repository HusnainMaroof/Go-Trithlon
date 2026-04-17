import { getCurrentUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

const Page = async () => {
  const user = await getCurrentUser();

  const data = user?.authsuccess?.data;

  if (user.autherror.error || !data?.userToken) {
    redirect("/");
  }

  return <div>page</div>;
};

export default Page;