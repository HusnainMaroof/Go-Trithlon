import { getCurrentUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
   const data = user?.authsuccess?.data;

  if (!user?.authsuccess?.success || !data?.sessionId) {
    redirect("/");
  }

  return <>{children}</>;
}
