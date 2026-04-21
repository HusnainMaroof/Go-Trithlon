import AthleteProfileDashboard from "@/src/components/AthleteProfile";
import NavBar from "@/src/components/NavBar";

const page =async ({ params }: { params: Promise<{ usertoken: string }> }) => {
  const { usertoken } = await params;

  return (
    <div className="w-full h-full">
      <NavBar />
      <AthleteProfileDashboard usertoken={usertoken} />
    </div>
  );
};

export default page;