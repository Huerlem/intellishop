/**
 * Navigation regression tests for the approved IA:
 * - exactly three permanent tabs: Home | Lists | Pantry
 * - signed-out users cannot reach the signed-in area
 * - signing out returns to the public area
 *
 * Uses the real RootStack guard, the real tab layout and the real public layout; screen bodies
 * are stubs so the tests do not depend on Firebase.
 */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useSyncExternalStore } from 'react';
import { Text } from 'react-native';

import * as PublicLayoutModule from '@/app/(public)/_layout';
import { RootStack } from '@/src/navigation/RootStack';
import { TabsLayout } from '@/src/navigation/TabsLayout';

function AppStackStub() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
function stubScreen(testID: string, label: string) {
  function StubScreen() {
    return <Text testID={testID}>{label}</Text>;
  }
  StubScreen.displayName = `Stub(${testID})`;
  return StubScreen;
}

const appRoutes = {
  '(app)/_layout': AppStackStub,
  '(app)/(tabs)/_layout': TabsLayout,
  '(app)/(tabs)/index': stubScreen('home-screen', 'Home screen'),
  '(app)/(tabs)/lists': stubScreen('lists-screen', 'Lists screen'),
  '(app)/(tabs)/pantry': stubScreen('pantry-screen', 'Pantry screen'),
  '(app)/profile': stubScreen('profile-screen', 'Profile screen'),
  '(public)/_layout': PublicLayoutModule,
  '(public)/WelcomeScreen': stubScreen('welcome-screen', 'Welcome'),
  '(public)/LoginScreen': stubScreen('login-screen', 'Login'),
  '(public)/RegisterScreen': stubScreen('register-screen', 'Register'),
  '(public)/forgot-password': stubScreen('forgot-screen', 'Forgot password'),
};

function SignedOutRoot() {
  return <RootStack isAuthenticated={false} />;
}
function SignedInRoot() {
  return <RootStack isAuthenticated />;
}

/** Minimal external store so a test can sign the user out without mutating state during render. */
const session = {
  signedIn: true,
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    session.listeners.add(listener);
    return () => void session.listeners.delete(listener);
  },
  get: () => session.signedIn,
  set(value: boolean) {
    session.signedIn = value;
    session.listeners.forEach((l) => l());
  },
};

function SessionRoot() {
  const signedIn = useSyncExternalStore(session.subscribe, session.get);
  return <RootStack isAuthenticated={signedIn} />;
}

describe('signed-out user', () => {
  it('lands on Welcome and cannot open the signed-in area', async () => {
    await renderRouter({ _layout: SignedOutRoot, ...appRoutes }, { initialUrl: '/' });

    expect(screen.getByTestId('welcome-screen')).toBeVisible();
    expect(screen.queryByTestId('home-screen')).toBeNull();

    await act(() => router.navigate('/pantry'));
    expect(screen.queryByTestId('pantry-screen')).toBeNull();
  });
});

describe('signed-in user', () => {
  it('sees exactly the Home, Lists and Pantry tabs', async () => {
    await renderRouter({ _layout: SignedInRoot, ...appRoutes }, { initialUrl: '/' });

    expect(screen.getByTestId('home-screen')).toBeVisible();

    const home = screen.getByLabelText('Home, tab, 1 of 3');
    expect(screen.getByLabelText('Lists, tab, 2 of 3')).toBeTruthy();
    expect(screen.getByLabelText('Pantry, tab, 3 of 3')).toBeTruthy();
    expect(home.parent?.children).toHaveLength(3);
  });

  it('switches tabs from the bottom navigation', async () => {
    await renderRouter({ _layout: SignedInRoot, ...appRoutes }, { initialUrl: '/' });

    await fireEvent.press(screen.getByLabelText('Pantry, tab, 3 of 3'));
    expect(screen.getByTestId('pantry-screen')).toBeVisible();
    expect(screen).toHavePathname('/pantry');

    await fireEvent.press(screen.getByLabelText('Lists, tab, 2 of 3'));
    expect(screen.getByTestId('lists-screen')).toBeVisible();
    expect(screen).toHavePathname('/lists');
  });

  it('opens Profile contextually without adding a tab', async () => {
    await renderRouter({ _layout: SignedInRoot, ...appRoutes }, { initialUrl: '/' });

    await act(() => router.push('/profile'));
    expect(screen.getByTestId('profile-screen')).toBeVisible();
    expect(screen.queryByLabelText(/Profile, tab/)).toBeNull();
  });

  it('returns to the public area after signing out', async () => {
    session.set(true);
    await renderRouter({ _layout: SessionRoot, ...appRoutes }, { initialUrl: '/' });

    expect(screen.getByTestId('home-screen')).toBeVisible();

    await act(() => {
      session.set(false);
    });

    expect(screen.getByTestId('welcome-screen')).toBeVisible();
    expect(screen.queryByTestId('home-screen')).toBeNull();
  });
});
