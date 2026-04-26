import { getCurrentUser } from "@/src/lib/auth";
import { redirect } from "next/navigation";

export default async function SetProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const data = user?.authsuccess?.data;

  // ✅ If already onboarded → kick them out
  if (data?.isOnboard) {
    redirect("/dashboard/home");
  }

  return <>{children}</>;
}
