import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

/**
 * Hook personalized to access Auth context
 * Simplify auth state and function access
 * @return {Object} - Authentication State and function
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    //Destructures context values ​​to make them easier to use
    const { user, userData, loading, error, setError, register, login, logout,
        forgotPassword, updateProfile, isAuthenticated
    } = context;

    //Additional assistant function
    const getDisplayName = () => {
        if (userData?.displayName) {
            return userData.displayName;
        }

        if (user?.displayName) {
            return user.displayName;
        }

        return user?.email || 'User';
    };

    const getInitials = () => {
        const name = getDisplayName();
        const parts = name.split(' ');

        if (parts.length === 1) {
            return name.substring(0, 2).toUpperCase();
        }

        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const getEmail = () => {
        return userData?.email || user?.email || '';
    };

    const getPhotoURL = () => {
        return userData?.photoURL || user?.photoURL || null;
    };

    const hasAddress = () => {
        return !!(userData?.address?.street && userData?.address?.postcode);
    };

    //Return context values and assistant functions
    return {
        user,
        userData,
        loading,
        error,
        setError,
        register,
        login,
        logout,
        forgotPassword,
        updateProfile,
        isAuthenticated,
        getDisplayName,
        getInitials,
        getEmail,
        getPhotoURL,
        hasAddress
    };
};

export default useAuth;