import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

//Hooks and components
import { useAuth } from '@/hooks/useAuth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

//Schema validation
const LoginSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
});

export default function LoginScreen () {
    const router = useRouter();
    const { login, loading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    //Manipulate the form
    const handleSubmit = async (values) => {
      
        try {
            const result = await login(values.email, values.password);
      
          // On success the auth guard (src/navigation/RootStack.tsx) switches to the signed-in area.
          if (!result.success) {
            Alert.alert(
                "Login Error",
                result.error || "Please check your credentials and try again."
            );
          }
        } catch (error) {
            Alert.alert("Login Error", "An unexpected error occurred. Please try again later.");
            console.warn("Login error:", error?.code);
        }
      };

    //Navigation to register screen
    const handleRegister = () => {
        router.push('/(public)/RegisterScreen');
    };

    //navigation to recover password screen
    const handleForgotPassword = () => {
        router.push('/(public)/forgot-password');
    };

    //change the visibility password
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    if (loading) {
        return <LoadingSpinner />
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style='dark' />

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color='#4A5568' />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/(public)/WelcomeScreen')}>
                            <Image
                                source={require('../../assets/images/logo-100.png')}
                                style={styles.logo}
                                resizeMode='contain'
                            />
                        </TouchableOpacity>

                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>
                            Sign in to continue to IntelliShop
                        </Text>
                    </View>

                    <Formik
                        initialValues={{ email : '', password: ''}}
                        validationSchema={LoginSchema}
                        onSubmit={handleSubmit}
                    >
                        {({
                            handleChange,
                            handleBlur,
                            handleSubmit,
                            values,
                            errors,
                            touched,
                        }) => (
                            <View style={styles.form}>
                                <Input
                                    label="Email"
                                    iconName="mail-outline"
                                    placeholder="Enter your email"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={values.email}
                                    onChangeText={handleChange('email')}
                                    onBlur={handleBlur('email')}
                                    error={touched.email && errors.email}
                                />


                                <Input
                                    label="Password"
                                    iconName="lock-closed-outline"
                                    placeholder="Enter your password"
                                    secureTextEntry={!showPassword}
                                    value={values.password}
                                    onChangeText={handleChange('password')}
                                    onBlur={handleBlur('password')}
                                    error={touched.password && errors.password}
                                    rightIcon={
                                        <TouchableOpacity onPress={togglePasswordVisibility}>
                                            <Ionicons
                                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                size={20}
                                                color='#A0AEEC0'
                                            />
                                        </TouchableOpacity>
                                    }
                                />

                                <TouchableOpacity
                                    style={styles.forgotPassword}
                                    onPress={handleForgotPassword}
                                >
                                    <Text style={styles.forgotPasswordText}>
                                        Forgot Password?
                                    </Text>
                                </TouchableOpacity>

                                <Button 
                                    title="Login"
                                    onPress={handleSubmit}
                                    loading={loading}
                                    style={styles.loginButton}          
                                />
                            </View>
                        )}
                    </Formik>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account?</Text>
                        <TouchableOpacity onPress={handleRegister}>
                            <Text style={styles.registerText}>Create Account</Text>
                        </TouchableOpacity>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 40,
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        padding: 4,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 24,
    },
    title: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 24,
        color: '#4338CA',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        marginBottom: 40,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 16,
    },
    forgotPasswordText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#4338CA',
    },
    loginButton: {
        width: '100%',
        maxWidth: 300,
        alignSelf: 'center',
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
    },
    footerText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#718096',
        marginRight: 4,
    },
    registerText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: '#4338CA',
    },
});

