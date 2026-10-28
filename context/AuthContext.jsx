import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    getUserData,
    updateUserProfile,
    subscribeToAuthState,
} from '@/firebase/authHelpers';
import { handleError, LEGACY_ERROR_LOG_KEY } from '@/errors/errorHandler';

/** @type {import('react').Context<import('./AuthContext.types').AuthContextValue | undefined>} */
export const AuthContext = createContext(undefined);

// V1 stored the user's UID under this key. It was never a token and is no longer used.
const LEGACY_UID_KEY = 'userToken';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    // `initialising` is true only until Firebase reports the first auth state.
    // Navigation guards wait for it; it is not affected by later login/logout calls.
    const [initialising, setInitialising] = useState(true);
    // `loading` reflects an auth operation in progress (login, register, logout, ...).
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const clearError = useCallback(() => setError(null), []);

    useEffect(() => {
        // Remove data V1 left on the device: the UID under "userToken" and persisted error messages.
        AsyncStorage.multiRemove([LEGACY_UID_KEY, LEGACY_ERROR_LOG_KEY]).catch(() => {});

        const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const result = await getUserData(firebaseUser.uid);
                    if (result.success) {
                        setUserData(result.userData);
                    } else {
                        handleError(result.error, { title: 'User Data Retrieval Failed', silent: true });
                    }
                } catch (dataError) {
                    handleError(dataError, { title: 'Error Fetching User Data', silent: true });
                }
            } else {
                setUser(null);
                setUserData(null);
            }
            setInitialising(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const result = await loginUser(email, password);
            if (result.success) {
                setUser(result.user);
                return { success: true, user: result.user };
            }
            setError(result.error);
            return { success: false, error: result.error, code: result.code };
        } catch (err) {
            const handled = handleError(err, { title: 'Login Failed' });
            setError(handled.message);
            return { success: false, error: handled.message, code: handled.code };
        } finally {
            setLoading(false);
        }
    };

    const register = async (email, password, additionalData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await registerUser(email, password, additionalData);
            if (result.success) {
                setUser(result.user);
                setUserData(additionalData);
                return { success: true, user: result.user };
            }
            setError(result.error);
            return { success: false, error: result.error, code: result.code };
        } catch (err) {
            const handled = handleError(err, { title: 'Registration Failed' });
            setError(handled.message);
            return { success: false, error: handled.message, code: handled.code };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await logoutUser();
            if (result.success) {
                setUser(null);
                setUserData(null);
                return { success: true };
            }
            const handled = handleError(new Error(result.error || 'Logout failed'), { title: 'Logout Failed' });
            setError(handled.message);
            return { success: false, error: handled.message };
        } catch (err) {
            const handled = handleError(err, { title: 'Logout Failed' });
            setError(handled.message);
            return { success: false, error: handled.message, code: handled.code };
        } finally {
            setLoading(false);
        }
    };

    const forgotPassword = async (email) => {
        setLoading(true);
        setError(null);
        try {
            return await resetPassword(email);
        } catch (err) {
            const handled = handleError(err, { title: 'Password Reset Failed' });
            setError(handled.message);
            return { success: false, error: handled.message, code: handled.code };
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (newData) => {
        setLoading(true);
        setError(null);
        try {
            if (!user) throw new Error('User not authenticated');

            const result = await updateUserProfile(user.uid, newData);
            if (result.success) {
                setUserData((prev) => ({ ...prev, ...newData }));
                return { success: true };
            }
            const handled = handleError(new Error(result.error || 'Update failed'), { title: 'Update Failed' });
            setError(handled.message);
            return { success: false, error: handled.message, code: handled.code };
        } catch (err) {
            const handled = handleError(err, { title: 'Update Failed' });
            setError(handled.message);
            return { success: false, error: handled.message, code: handled.code };
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userData,
                initialising,
                loading,
                error,
                setError,
                clearError,
                register,
                login,
                logout,
                forgotPassword,
                updateProfile,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

/** @returns {import('./AuthContext.types').AuthContextValue} */
export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
