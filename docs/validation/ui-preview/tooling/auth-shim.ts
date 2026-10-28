const ok = async () => ({ success: true });
const auth = {
  user: { uid: 'user-1', emailVerified: true },
  userData: { displayName: 'Peter', email: 'peter@example.com', termsVersion: '0.2.0-draft' },
  emailVerified: true,
  isAuthenticated: true,
  initialising: false,
  loading: false,
  getDisplayName: () => 'Peter',
  getInitials: () => 'P',
  getEmail: () => 'peter@example.com',
  getPhotoURL: () => null,
  login: ok, register: ok, logout: ok, forgotPassword: ok, updateProfile: ok, refreshUser: ok, resendVerification: ok, reauthenticate: ok, acceptTerms: ok,
};
export const useAuth = () => auth;
export default useAuth;
