import React from 'react';
import { Alert, Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

//Common error code
export const ERROR_CODES = {
    //General errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',

    //Authentication errors
    AUTH_INVALID_EMAIL: 'AUTH_INVALID_EMAIL',
    AUTH_WRONG_PASSWORD: 'AUTH_WRONG_PASSWORD',
    AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
    AUTH_EMAIL_IN_USE: 'AUTH_EMAIL_IN_USE',
    AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
    AUTH_EXPIRED_TOKEN: 'AUTH_EXPIRED_TOKEN',

    //Database errors
    DB_WRITE_ERROR: 'DB_WRITE_ERROR',
    DB_READ_ERROR: 'DB_READ_ERROR',
    DB_DELETE_ERROR: 'DB_DELETE_ERROR',
    DB_PERMISSION_DENIED: 'DB_PERMISSION_DENIED',

    //Storage errors
    STORAGE_ERROR: 'STORAGE_ERROR',

    //Permission errors
    PERMISSION_DENIED: 'PERMISSION_DENIED',

    //Specifics Features errors
    AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
    PRICE_COMPARISON_ERROR: 'PRICE_COMPARISON_ERROR',
};

//Error code map to friendly message to users
const ERROR_MESSAGES = {
    [ERROR_CODES.UNKNOWN_ERROR]: 'An unknown error has occurred. Please try again later.',
    [ERROR_CODES.NETWORK_ERROR]: 'Connection error. Check your internet and try again.',
    [ERROR_CODES.TIMEOUT_ERROR]: 'The operation timed out. Please try again.',
    [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later.',

    [ERROR_CODES.AUTH_INVALID_EMAIL]: 'The email provided is invalid.',
    [ERROR_CODES.AUTH_WRONG_PASSWORD]: 'Password Incorrect. Try again.',
    [ERROR_CODES.AUTH_USER_NOT_FOUND]: 'User not found with this email.',
    [ERROR_CODES.AUTH_EMAIL_IN_USE]: 'This email is already in use for other account.',
    [ERROR_CODES.AUTH_WEAK_PASSWORD]: 'Password must be at least 6 characters long.',
    [ERROR_CODES.AUTH_EXPIRED_TOKEN]: 'Your session has expired. Please log in again.',

    [ERROR_CODES.DB_WRITE_ERROR]: 'Failed to save data. Try again.',
    [ERROR_CODES.DB_READ_ERROR]: 'Failed to load data. Try again.',
    [ERROR_CODES.DB_DELETE_ERROR]: 'Failed to delete data. Try again.',
    [ERROR_CODES.DB_PERMISSION_DENIED]: 'You do not have permission to perform this operation',

    [ERROR_CODES.STORAGE_ERROR]: 'Error accessing local storage.',

    [ERROR_CODES.PERMISSION_DENIED]: 'Permission denied to access this resource.',

    [ERROR_CODES.AI_SERVICE_ERROR]: 'Unable to load AI suggestions.',
    [ERROR_CODES.PRICE_COMPARISON_ERROR]: 'Failed to load the price comparison.'

};

/**
 * Function to log errors to console (substitute for analytics)
 * This will be replaced with actual analytics integration later
 */
const logErrorToConsole = (errorCode, errorMessage) => {
    console.error(`[ERROR][${errorCode}]: ${errorMessage}`);
    
    // Save error to AsyncStorage for debugging purposes
    try {
        (async () => {
            const errorsJSON = await AsyncStorage.getItem('errorLogs');
            const errors = errorsJSON ? JSON.parse(errorsJSON) : [];
            errors.unshift({
                code: errorCode,
                message: errorMessage,
                timestamp: new Date().toISOString(),
                device: Platform.OS,
                appVersion: Application.nativeApplicationVersion || 'unknown'
            });
            
            // Keep only the last 50 errors
            const trimmedErrors = errors.slice(0, 50);
            await AsyncStorage.setItem('errorLogs', JSON.stringify(trimmedErrors));
        })();
    } catch (e) {
        console.error('Failed to save error log:', e);
    }
};

/**
 * Map Firebase errors to internal error codes
 * 
 * @param {Error} error - original error
 * @returns {string} Internal error code
 */
export const mapFirebaseError = (error) => {
    if (!error || !error.code) {
        return ERROR_CODES.UNKNOWN_ERROR;
    }

    switch (error.code) {
        //Error auth
        case 'auth/invalid-email':
            return ERROR_CODES.AUTH_INVALID_EMAIL;
        case 'auth/wrong-password':
            return ERROR_CODES.AUTH_WRONG_PASSWORD;
        case 'auth/user-not-found':
            return ERROR_CODES.AUTH_USER_NOT_FOUND;
        case 'auth/email-already-in-use':
            return ERROR_CODES.AUTH_EMAIL_IN_USE;
        case 'auth/weak-password':
            return ERROR_CODES.AUTH_WEAK_PASSWORD;
        case 'auth/id-token-expired':
        case 'auth/session-expired':
            return ERROR_CODES.AUTH_EXPIRED_TOKEN;

        //Firestore errors
        case 'permission-denied':
            return ERROR_CODES.DB_PERMISSION_DENIED;

        //Network errors
        case 'network-request-failed':
            return ERROR_CODES.NETWORK_ERROR;

        //Default
        default:
            return ERROR_CODES.UNKNOWN_ERROR;
    }
};

/**
 * Get an error message friendly to error code
 * 
 * @param {string} errorCode - error code
 * @returns {string} Friendly error message
 */
export const getErrorMessage = (errorCode) => {
    return ERROR_MESSAGES[errorCode] || 'An unexpected error occurred.';
};

/**
 * Handles application errors
 * 
 * @param {Error|string} error - Original error or error code
 * @param {Object} options - additional options
 * @returns {Object} processed error information
 */
export const handleError = (error, options = {}) => {
    const {
        silent = false,
        title = 'Error',
        showAlert = !silent,
        logToAnalytics = true,
    } = options;

    let errorCode = ERROR_CODES.UNKNOWN_ERROR;
    let errorMessage = '';
    let originalError = error;

    //Determines code and error message
    if (typeof error === 'string') {
        errorCode = error;
        errorMessage = getErrorMessage(errorCode);
    } else if (error instanceof Error) {
        //Try map error firebase/backend
        if (error.code) {
            errorCode = mapFirebaseError(error);
        }
        errorMessage = getErrorMessage(errorCode);

        //In development, show original error
        if (__DEV__) {
            console.error('Error details:', error);
        }
    } else {
        errorMessage = getErrorMessage(ERROR_CODES.UNKNOWN_ERROR);
    }

    //Error register in analytics
    if (logToAnalytics) {
        // Only the mapped, user-facing message is recorded: raw error messages can contain
        // personal data (e.g. email addresses).
        logErrorToConsole(errorCode, errorMessage);
    }

    //Show an Alert to user
    if (showAlert) {
        Alert.alert(title, errorMessage);
    }

    //Return processed error with additional information
    return {
        code: errorCode,
        message: errorMessage,
        original: originalError,
    };
};

/**
 * Wrapper for try/catch with more concise syntax
 * 
 * @param {Function} fn - Function that may throw an exception
 * @param {Object} options - Error treatment optional
 * @returns {Promise<[Error, null]|[null, any]>} Array with error or result
 */
export const tryCatch = async (fn, options = {}) => {
    try {
        const result = await fn();
        return [null, result];
    } catch (error) {
        const handledError = handleError(error, options);
        return [handledError, null];
    }
};

export default {
    ERROR_CODES,
    handleError,
    getErrorMessage,
    mapFirebaseError,
    tryCatch,
};
