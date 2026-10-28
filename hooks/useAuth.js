import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

/**
 * Access to the auth context plus small display helpers.
 * @returns {import('@/context/AuthContext.types').UseAuthResult}
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    const { user, userData } = context;

    const getDisplayName = () => userData?.displayName || user?.displayName || user?.email || 'there';

    const getInitials = () => {
        const name = (userData?.displayName || user?.displayName || user?.email || '?').trim();
        const parts = name.split(/\s+/).filter(Boolean);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const getEmail = () => userData?.email || user?.email || '';

    const getPhotoURL = () => userData?.photoURL || user?.photoURL || null;

    return {
        ...context,
        getDisplayName,
        getInitials,
        getEmail,
        getPhotoURL,
    };
};

export default useAuth;
