/**
 * Public screens (Figma clarification C1): Welcome, Sign in, Create account, Reset password.
 * Restyled with V2 components. Registration collects only name, email and password
 * (page 03 "collect only essential data"; L2-01) and requires explicit Terms acceptance with
 * the Privacy Policy available before an account is created.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validateNewPassword } from '@/src/features/forms';
import { ROUTES, routeTo } from '@/src/navigation/routes';
import { Alert, AppText, Button, CheckboxField, Header, IconButton, Screen, TextField } from '@/src/ui';

const logo = require('../../../assets/images/logo-100.png');

function useBack(fallback: string) {
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace(fallback as never));
}

export function WelcomeScreen() {
  const router = useRouter();
  return (
    <Screen testID="welcome-screen" footer={<><Button title="Create account" onPress={() => router.push(ROUTES.register)} testID="welcome-register" /><Button title="Sign in" variant="secondary" onPress={() => router.push(ROUTES.login)} testID="welcome-login" /></>}>
      <View style={{ alignItems: 'flex-start', gap: 16, paddingTop: 32 }}>
        <Image source={logo} style={{ width: 64, height: 64 }} accessibilityIgnoresInvertColors accessible accessibilityLabel="IntelliShop logo" />
        <AppText variant="display">IntelliShop</AppText>
        <AppText variant="body" tone="secondary">
          Plan your shop, tick items off in store and keep your Pantry up to date.
        </AppText>
      </View>
      <View style={{ gap: 12 }}>
        {[
          ['Shopping lists', 'Plan what you need, with your own prices if you want an estimate.'],
          ['Shopping Mode', 'Tick items off one-handed, note substitutes and unavailable items.'],
          ['Pantry', 'See what is running low or needs using soon.'],
          ['Recipe ideas', 'Optional AI suggestions from what you have — only with your permission.'],
        ].map(([title, body]) => (
          <View key={title} style={{ gap: 2 }}>
            <AppText variant="label">{title}</AppText>
            <AppText variant="bodySmall" tone="secondary">
              {body}
            </AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const back = useBack(ROUTES.welcome);
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e = { email: validateEmail(email), password: password ? null : 'Enter your password.' };
    setFieldErrors(e);
    if (e.email || e.password) return;
    setBusy(true);
    setError(null);
    const r = await login(email.trim(), password);
    setBusy(false);
    if (!r.success) setError(r.error ?? 'Email or password is incorrect.');
  };

  return (
    <Screen testID="login-screen" header={<Header left={<IconButton kind="back" onPress={back} />} title="Sign in" />} footer={<Button title="Sign in" onPress={submit} loading={busy} testID="login-submit" />}>
      {error ? <Alert tone="error" title="Could not sign in" detail={error} testID="login-error" /> : null}
      <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" error={fieldErrors.email} testID="login-email" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" error={fieldErrors.password} onSubmitEditing={submit} testID="login-password" />
      <Button title="Forgotten your password?" variant="tertiary" align="start" onPress={() => router.push(ROUTES.forgotPassword)} />
      <Button title="New to IntelliShop? Create an account" variant="tertiary" align="start" onPress={() => router.replace(ROUTES.register)} />
    </Screen>
  );
}

export function RegisterScreen() {
  const router = useRouter();
  const back = useBack(ROUTES.welcome);
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e = {
      name: name.trim() ? (name.trim().length > 50 ? 'Use 50 characters or fewer.' : null) : 'Enter the name you would like us to use.',
      email: validateEmail(email),
      password: validateNewPassword(password),
      terms: terms ? null : 'You need to accept the Terms to create an account.',
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setBusy(true);
    setError(null);
    const r = await register(email.trim(), password, { displayName: name.trim(), termsAccepted: true });
    setBusy(false);
    if (!r.success) setError(r.error ?? 'Your account could not be created.');
  };

  return (
    <Screen testID="register-screen" header={<Header left={<IconButton kind="back" onPress={back} />} title="Create account" />} footer={<Button title="Create account" onPress={submit} loading={busy} testID="register-submit" />}>
      {error ? <Alert tone="error" title="Could not create your account" detail={error} testID="register-error" /> : null}
      <TextField label="Name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" maxLength={50} error={errors.name} hint="The name IntelliShop uses to greet you." testID="register-name" />
      <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" error={errors.email} hint="We'll send a link to verify it." testID="register-email" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" error={errors.password} hint="At least 8 characters." testID="register-password" />
      <CheckboxField
        checked={terms}
        onChange={(v) => {
          setTerms(v);
          setErrors((x) => ({ ...x, terms: null }));
        }}
        label="I accept the Terms and Conditions"
        error={errors.terms}
        testID="register-terms"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Button title="Read the Terms" variant="tertiary" compact onPress={() => router.push(routeTo.legal('terms'))} testID="register-read-terms" />
        <Button title="Privacy Policy" variant="tertiary" compact onPress={() => router.push(routeTo.legal('privacy'))} testID="register-read-privacy" />
      </View>
      <AppText variant="caption" tone="muted">
        We use your name and email to run your account. Read the Privacy Policy to see how we handle your information. We never ask for your address or phone number.
      </AppText>
    </Screen>
  );
}

export function ForgotPasswordScreen() {
  const back = useBack(ROUTES.login);
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e = validateEmail(email);
    setFieldError(e);
    if (e) return;
    setBusy(true);
    await forgotPassword(email.trim()).catch(() => undefined);
    setBusy(false);
    // Same message whether or not an account exists (avoids revealing registered emails).
    setSent(true);
  };

  return (
    <Screen testID="forgot-screen" header={<Header left={<IconButton kind="back" onPress={back} />} title="Reset password" />} footer={<Button title="Send reset link" onPress={submit} loading={busy} testID="forgot-submit" />}>
      {sent ? <Alert tone="success" title="Check your email" detail="If an account exists for that address, we have sent a link to reset your password." testID="forgot-sent" /> : null}
      <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={fieldError} testID="forgot-email" />
    </Screen>
  );
}

/** Shown in the signed-in area when the user has not accepted the current Terms (L4-03). */
export function TermsUpdateScreen() {
  const router = useRouter();
  const { acceptTerms, logout } = useAuth();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Screen
      testID="terms-update-screen"
      header={<Header title="Updated Terms" />}
      footer={
        <>
          <Button
            title="Continue"
            loading={busy}
            onPress={async () => {
              if (!checked) return setError('Tick the box to accept the Terms.');
              setBusy(true);
              const r = await acceptTerms();
              setBusy(false);
              if (!r.success) setError('Could not save. Check your connection and try again.');
            }}
            testID="terms-accept"
          />
          <Button title="Sign out" variant="tertiary" onPress={() => logout()} />
        </>
      }
    >
      <AppText variant="bodySmall" tone="secondary">
        To keep using IntelliShop, please read and accept our Terms and Conditions. Our Privacy Policy explains how we use your information.
      </AppText>
      {error ? <Alert tone="error" title={error} /> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Button title="Read the Terms" variant="tertiary" compact onPress={() => router.push(routeTo.legal('terms'))} />
        <Button title="Privacy Policy" variant="tertiary" compact onPress={() => router.push(routeTo.legal('privacy'))} />
      </View>
      <CheckboxField checked={checked} onChange={setChecked} label="I accept the Terms and Conditions" />
    </Screen>
  );
}
