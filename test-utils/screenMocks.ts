/**
 * Module mocks for V2 screen tests (no app imports here, so jest.mock factories can require
 * this file without circular imports). TEST USE ONLY. See test-utils/screenHarness.tsx.
 */
export const UID = 'user-1';

export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  navigate: jest.fn(),
};
let params: Record<string, string> = {};
export function setParams(p: Record<string, string>) {
  params = p;
}

export const routerModule = {
  useRouter: () => router,
  useLocalSearchParams: () => params,
  Stack: Object.assign(() => null, { Screen: () => null, Protected: ({ children }: { children: unknown }) => children }),
  Link: () => null,
};

export const auth = {
  user: { uid: UID, emailVerified: true },
  userData: { displayName: 'Peter', email: 'peter@example.com', termsVersion: '0.2.0-draft' },
  emailVerified: true,
  isAuthenticated: true,
  initialising: false,
  loading: false,
  getDisplayName: () => 'Peter',
  getInitials: () => 'P',
  getEmail: () => 'peter@example.com',
  getPhotoURL: () => null,
  login: jest.fn(async () => ({ success: true })),
  register: jest.fn(async () => ({ success: true })),
  logout: jest.fn(async () => ({ success: true })),
  forgotPassword: jest.fn(async () => ({ success: true })),
  updateProfile: jest.fn(async () => ({ success: true })),
  refreshUser: jest.fn(async () => ({ success: true })),
  resendVerification: jest.fn(async () => ({ success: true })),
  reauthenticate: jest.fn(async () => ({ success: true })),
  acceptTerms: jest.fn(async () => ({ success: true })),
};
export const authModule = { useAuth: () => auth };

/** Callable functions: tests set `callable.handlers[name]`; unknown names reject as "unavailable". */
export const callable = {
  handlers: {} as Record<string, (data: unknown) => unknown>,
  calls: [] as { name: string; data: unknown }[],
};
export const functionsModule = {
  getFunctions: () => ({}),
  connectFunctionsEmulator: () => {},
  httpsCallable: (_f: unknown, name: string) => async (data: unknown) => {
    callable.calls.push({ name, data });
    const h = callable.handlers[name];
    if (!h) throw Object.assign(new Error('unavailable'), { code: 'functions/unavailable' });
    return { data: await h(data) };
  },
};

export const firebaseConfig = { db: {}, auth: null, storage: null, functions: {}, isFirebaseConfigured: true, missingFirebaseConfigKeys: [], usingEmulators: false, FUNCTIONS_REGION: 'europe-west2' };

export function resetHarness() {
  Object.values(router).forEach((f) => (f as jest.Mock).mockClear?.());
  router.canGoBack.mockImplementation(() => true);
  params = {};
  callable.handlers = {};
  callable.calls = [];
  auth.emailVerified = true;
  auth.user.emailVerified = true;
}

