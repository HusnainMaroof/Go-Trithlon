export interface ErrorState {
  error?: boolean;
  message?: string;
}

export interface AuthSuccess {
  success: boolean;
  authMessage: string;
  data: {
    userId: string;
    sessionId?: string;
    userToken: string;
    email: string;
    displayName: string;
    isOnboard: boolean;
    profileImage?: string;
    athleteData?: any;
  };
}

export interface AuthError {
  error: boolean;
  message: string;
}

export interface AuthPayload {
  autherror: AuthError;
  authsuccess: AuthSuccess;
}

export const authFalse: AuthSuccess = {
  success: false,
  authMessage: "",
  data: {
    userId: "",
    sessionId: "",
    userToken: "",
    email: "",
    displayName: "",
    isOnboard: false,
    profileImage: "",
    athleteData: null,
  },
};

export type UserType = {
  userId?: string;
  sessionId?: string;
  userToken: string;
  displayName: string;
  email: string;
  isOnboard: boolean;
  profileImage?: string;
  athleteData?: any;
} | null;
