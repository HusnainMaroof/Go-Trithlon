import Image from "next/image";
import NavBar from "../components/NavBar";
import HeroSection from "../components/HeroSections";
import RegistrationPopup from "../components/LoginPopUp";
import { getCurrentUser } from "../lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();
  const data = user?.authsuccess?.data;

 if (user.authsuccess.success && data?.userToken) {
    if (!data.isOnboard) {
      redirect("/dashboard/setprofile");
    }

    redirect("/dashboard/home");
  }

  return (
    <div className="w-full bg-black/80">
      <RegistrationPopup />
      <NavBar />
      <HeroSection />
    </div>
  );
}
