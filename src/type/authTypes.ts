export interface ErrorState {
  error?: boolean;
  message?: string;
}

export interface AuthSuccess {
  success: boolean;
  authMessage: string;
  data: {
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
  sessionId?: string;
  userToken: string;
  displayName: string;
  email: string;
  isOnboard: boolean;
  profileImage?: string;
  athleteData?: any;
} | null;
