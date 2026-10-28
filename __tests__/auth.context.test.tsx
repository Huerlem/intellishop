/**
 * Regression tests for AuthContext defects found in the V1 audit:
 * - the onAuthStateChanged listener was never unsubscribed (async effect returned a Promise);
 * - `updateProfile` referenced an out-of-scope variable in its catch block.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockUnsubscribe = jest.fn();
let mockEmitAuthState: (user: unknown) => Promise<void> | void = () => {};

jest.mock('@/firebase/authHelpers', () => ({
  subscribeToAuthState: jest.fn((callback: (user: unknown) => Promise<void> | void) => {
    mockEmitAuthState = callback;
    return mockUnsubscribe;
  }),
  getUserData: jest.fn(async () => ({ success: true, userData: { displayName: 'Test User' } })),
  updateUserProfile: jest.fn(async () => {
    throw new Error('network down');
  }),
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  resetPassword: jest.fn(),
}));

let latest: ReturnType<typeof useAuth> | null = null;

function Probe() {
  latest = useAuth();
  return <Text testID="state">{latest.initialising ? 'initialising' : latest.isAuthenticated ? 'in' : 'out'}</Text>;
}

beforeEach(() => {
  mockUnsubscribe.mockClear();
  latest = null;
});

it('stays initialising until Firebase reports the first auth state', async () => {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  expect(screen.getByTestId('state')).toHaveTextContent('initialising');

  await act(async () => {
    await mockEmitAuthState(null);
  });
  expect(screen.getByTestId('state')).toHaveTextContent('out');

  await act(async () => {
    await mockEmitAuthState({ uid: 'user-1', email: 'test@example.com' });
  });
  expect(screen.getByTestId('state')).toHaveTextContent('in');
});

it('unsubscribes from auth state changes on unmount', async () => {
  const { unmount } = await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  await unmount();
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});

it('reports a profile update failure instead of throwing', async () => {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  await act(async () => {
    await mockEmitAuthState({ uid: 'user-1', email: 'test@example.com' });
  });

  let result: { success: boolean } | undefined;
  await act(async () => {
    result = await latest!.updateProfile({ displayName: 'New Name' });
  });
  expect(result?.success).toBe(false);
});

it('removes data V1 left on the device (UID under "userToken" and persisted error messages)', async () => {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['userToken', 'errorLogs']);
});
