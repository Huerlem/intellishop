import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    getUserData,
    updateUserProfile,
    useAuthState
} from '@/firebase/authHelpers';
import { handleError } from '@/errors/errorHandler';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const clearError = () => setError(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const unsubscribe = useAuthState(async (firebaseUser) => {
                    setLoading(true);
                    
                    if (firebaseUser) {
                        setUser(firebaseUser);
                        
                        try {
                            const userDataResult = await getUserData(firebaseUser.uid);
                            if (userDataResult.success) {
                                setUserData(userDataResult.userData);
                            } else {
                                handleError(userDataResult.error, {
                                    title: 'User Data Retrieval Failed'
                                });
                            }
                            
                            await AsyncStorage.setItem('userToken', firebaseUser.uid);
                        } catch (dataError) {
                            handleError(dataError, {
                                title: 'Error Fetching User Data'
                            });
                        }
                    } else {
                        setUser(null);
                        setUserData(null);
                        await AsyncStorage.removeItem('userToken');
                    }
                    
                    setLoading(false);
                });

                return () => {
                    if (typeof unsubscribe === 'function') {
                        unsubscribe();
                    }
                };
            } catch (err) {
                handleError(err, {
                    title: 'Session Check Error'
                });
                setLoading(false);
            }
        };

        const cleanup = checkSession();

        return () => {
            if (typeof cleanup === 'function') {
                cleanup();
            }
        };
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const result = await loginUser(email, password);
            if (result.success) {
                setUser(result.user);
                return { success: true, user: result.user };
            } else {
                setError(result.error);
                return { success: false, error: result.error, code: result.code };
            }
        } catch (error) {
            const handledError = handleError(error, { 
                title: 'Login Failed' 
            });
            setError(handledError.message);
            return { success: false, error: handledError.message, code: handledError.code };
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
            } else {
                setError(result.error);
                return { success: false, error: result.error, code: result.code };
            }
        } catch (error) {
            const handledError = handleError(error, { 
                title: 'Registration Failed' 
            });
            setError(handledError.message);
            return { success: false, error: handledError.message, code: handledError.code };
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
                await AsyncStorage.removeItem('userToken');
                return { success: true };
            } else {
                const handled = handleError(error, { title: 'Logout Failed' });
                setError(handled.message);
                return { success: false, error: handled.message };
            }
        } catch (error) {
            const handled = handleError(error, { title: 'Logout Failed' });
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
            const result = await resetPassword(email);
            return result;
        } catch (error) {
            const handled = handleError(error, { title: 'Password Reset Failed' });
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
            } else {
                const handled = handleError(result.error, { title: 'Update Failed' });
                setError(handled.message);
                return { success: false, error: handled.message, code: handled.code };
            }
        } catch (error) {
            const handled = handleError(result.error, { title: 'Update Failed' });
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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default useAuth;