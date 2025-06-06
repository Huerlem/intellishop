import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ForgotPassword() {
  const { resetPassword, error, loading, setError } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const validateForm = () => {
    let isValid = true;
    setEmailError('');

    if (!email || email.trim() === '') {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Invalid email');
      isValid = false;
    }

    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };

  const handleGoToLogin = () => {
    router.push('/(public)/LoginScreen');
  };

  const handleGoToWelcome = () => {
    router.push('/(public)/WelcomeScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 🔙 Voltar para LoginScreen */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoToLogin}
          >
            <Ionicons name="arrow-back" size={24} color="#4B0082" />
          </TouchableOpacity>

          {/* 🏠 Logo que volta para WelcomeScreen */}
          <TouchableOpacity style={styles.logoContainer} onPress={handleGoToWelcome}>
            <Image
              source={require('../../assets/images/logo-100.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>IntelliShop</Text>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Recover Password</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive recovery instructions
            </Text>

            {resetSent ? (
              <View style={styles.successContainer}>
                <Ionicons name="mail-open-outline" size={64} color="#4B0082" style={styles.emailIcon} />
                <Text style={styles.successTitle}>Email sent!</Text>
                <Text style={styles.successText}>
                  Please check your inbox and follow the instructions to recover your password.
                </Text>
                <Button title="Go back to Login" onPress={handleGoToLogin} />
              </View>
            ) : (
              <>
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Input
                  label="Email"
                  placeholder="example@email.com"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError('');
                    setError(null);
                  }}
                  error={emailError}
                  containerStyle={styles.inputContainer}
                />

                <Button
                  title="Recover Password"
                  onPress={handleResetPassword}
                  loading={loading}
                  style={styles.resetButton}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  appName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#4B0082',
  },
  formContainer: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4B0082',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 24,
  },
  resetButton: {
    marginBottom: 32,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emailIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    maxWidth: 300,
  },
});


