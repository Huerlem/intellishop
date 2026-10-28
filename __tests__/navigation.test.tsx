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
import { useState, type Dispatch, type SetStateAction } from 'react';
import { Text } from 'react-native';

import * as PublicLayoutModule from '@/app/(public)/_layout';
import { RootStack } from '@/src/navigation/RootStack';
import { TabsLayout } from '@/src/navigation/TabsLayout';

const appRoutes = {
  '(app)/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(app)/(tabs)/_layout': TabsLayout,
  '(app)/(tabs)/index': () => <Text testID="home-screen">Home screen</Text>,
  '(app)/(tabs)/lists': () => <Text testID="lists-screen">Lists screen</Text>,
  '(app)/(tabs)/pantry': () => <Text testID="pantry-screen">Pantry screen</Text>,
  '(app)/profile': () => <Text testID="profile-screen">Profile screen</Text>,
  '(public)/_layout': PublicLayoutModule,
  '(public)/WelcomeScreen': () => <Text testID="welcome-screen">Welcome</Text>,
  '(public)/LoginScreen': () => <Text testID="login-screen">Login</Text>,
  '(public)/RegisterScreen': () => <Text testID="register-screen">Register</Text>,
  '(public)/forgot-password': () => <Text testID="forgot-screen">Forgot password</Text>,
};

describe('signed-out user', () => {
  it('lands on Welcome and cannot open the signed-in area', async () => {
    await renderRouter({ _layout: () => <RootStack isAuthenticated={false} />, ...appRoutes }, { initialUrl: '/' });

    expect(screen.getByTestId('welcome-screen')).toBeVisible();
    expect(screen.queryByTestId('home-screen')).toBeNull();

    await act(() => router.navigate('/pantry'));
    expect(screen.queryByTestId('pantry-screen')).toBeNull();
  });
});

describe('signed-in user', () => {
  it('sees exactly the Home, Lists and Pantry tabs', async () => {
    await renderRouter({ _layout: () => <RootStack isAuthenticated />, ...appRoutes }, { initialUrl: '/' });

    expect(screen.getByTestId('home-screen')).toBeVisible();

    const home = screen.getByLabelText('Home, tab, 1 of 3');
    expect(screen.getByLabelText('Lists, tab, 2 of 3')).toBeTruthy();
    expect(screen.getByLabelText('Pantry, tab, 3 of 3')).toBeTruthy();
    expect(home.parent?.children).toHaveLength(3);
  });

  it('switches tabs from the bottom navigation', async () => {
    await renderRouter({ _layout: () => <RootStack isAuthenticated />, ...appRoutes }, { initialUrl: '/' });

    await fireEvent.press(screen.getByLabelText('Pantry, tab, 3 of 3'));
    expect(screen.getByTestId('pantry-screen')).toBeVisible();
    expect(screen).toHavePathname('/pantry');

    await fireEvent.press(screen.getByLabelText('Lists, tab, 2 of 3'));
    expect(screen.getByTestId('lists-screen')).toBeVisible();
    expect(screen).toHavePathname('/lists');
  });

  it('opens Profile contextually without adding a tab', async () => {
    await renderRouter({ _layout: () => <RootStack isAuthenticated />, ...appRoutes }, { initialUrl: '/' });

    await act(() => router.push('/profile'));
    expect(screen.getByTestId('profile-screen')).toBeVisible();
    expect(screen.queryByLabelText(/Profile, tab/)).toBeNull();
  });

  it('returns to the public area after signing out', async () => {
    let auth: [boolean, Dispatch<SetStateAction<boolean>>];

    await renderRouter(
      {
        _layout: function Layout() {
          auth = useState(true);
          return <RootStack isAuthenticated={auth[0]} />;
        },
        ...appRoutes,
      },
      { initialUrl: '/' }
    );

    expect(screen.getByTestId('home-screen')).toBeVisible();

    await act(() => {
      auth[1](false);
    });

    expect(screen.getByTestId('welcome-screen')).toBeVisible();
    expect(screen.queryByTestId('home-screen')).toBeNull();
  });
});
