// types/team.ts

export interface AthleteProfile {
  id: string;
  userId: string;
  displayName: string;
  locationCity: string;
  disciplines: string[];
  swimTime100m: number | null;
  cycleTime10km: number | null;
  runTime5km: number | null;
  experienceLevel: string;
  trainingDaysPerWeek: number;
  competitionLevel: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberUser {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userToken: string;
  google_id: string;
  is_Onboard: boolean;
  inTeam: boolean;
  profileImage: string;
  athleteProfile: AthleteProfile | null;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "SWIMMER" | "CYCLIST" | "RUNNER";
  joinedAt: string;
  user: TeamMemberUser;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  status: "OPEN" | "CLOSED" | "FULL";
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
}