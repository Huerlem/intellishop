import { Redirect } from 'expo-router';

/** Stable default route for visitors and post-sign-out navigation. */
export default function PublicIndex() {
  return <Redirect href='/WelcomeScreen' />;
}
