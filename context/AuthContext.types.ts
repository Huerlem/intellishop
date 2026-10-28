import type { User } from 'firebase/auth';

/** Result shape returned by every auth operation in AuthContext. */
export type AuthResult = {
  success: boolean;
  error?: string;
  code?: string;
  user?: User;
};

/** Profile document stored in Firestore `users/{uid}` (V1 shape, to be narrowed in M2). */
export type UserData = Record<string, unknown> & {
  displayName?: string;
  email?: string;
  photoURL?: string;
};

export interface AuthContextValue {
  user: User | null;
  userData: UserData | null;
  /** True until Firebase reports the first auth state. Navigation guards wait for it. */
  initialising: boolean;
  /** True while an auth operation (login, register, logout…) is in progress. */
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  register: (email: string, password: string, additionalData: Record<string, unknown>) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  updateProfile: (data: Record<string, unknown>) => Promise<AuthResult>;
  isAuthenticated: boolean;
}

export interface UseAuthResult extends AuthContextValue {
  getDisplayName: () => string;
  getInitials: () => string;
  getEmail: () => string;
  getPhotoURL: () => string | null;
  hasAddress: () => boolean;
}
