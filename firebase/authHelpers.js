import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '@/src/legal/versions';

/**
 * Creates an account with email and password, then the minimal profile document.
 *
 * Data minimisation (docs/compliance/DATA_FLOW_INVENTORY.md DF-1): only the name the user wants
 * us to use, the email address and the accepted Terms version are stored. Phone number and
 * address are no longer collected. Accepting the Terms is recorded as a contract step; the
 * privacy notice version shown is recorded as information, not as consent.
 */
export const registerUser = async (email, password, { displayName, termsAccepted }) => {
  if (termsAccepted !== true) {
    return { success: false, error: 'Please accept the Terms & Conditions to create an account.', code: 'terms-not-accepted' };
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      displayName: (displayName ?? '').trim(),
      email: user.email,
      createdAt: serverTimestamp(),
      termsVersion: CURRENT_TERMS_VERSION,
      termsAcceptedAt: serverTimestamp(),
      privacyNoticeVersion: CURRENT_PRIVACY_VERSION,
    });

    // Needed before introductory AI credits can be used (SUBSCRIPTION_ENTITLEMENTS.md E1).
    sendEmailVerification(user).catch(() => {});

    return { success: true, user };
  } catch (error) {
    console.warn('Firebase registration failed:', error?.code);
    return { success: false, error: error.message, code: error.code };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    // Log only the error code: messages can contain the email address.
    console.warn('Firebase login failed:', error?.code);
    return { success: false, error: error.message, code: error.code };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message, code: error.code };
  }
};

export const resendVerificationEmail = async () => {
  if (!auth?.currentUser) return { success: false, error: 'Not signed in' };
  try {
    await sendEmailVerification(auth.currentUser);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message, code: error.code };
  }
};

/** Re-authentication is required before account deletion (Account & Data Deletion Policy §1). */
export const reauthenticate = async (password) => {
  const user = auth?.currentUser;
  if (!user?.email) return { success: false, error: 'Not signed in', code: 'not-signed-in' };
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message, code: error.code };
  }
};

/** Subscribes to Firebase auth state changes. Returns the unsubscribe function. */
export const subscribeToAuthState = (callback) => {
  const unsubscribe = onAuthStateChanged(auth, callback);
  return unsubscribe;
};

export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, userData: userDoc.data() };
    }
    return { success: false, error: 'User data not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/** Only the fields the user may edit (firestore.rules enforces the same list). */
const EDITABLE_PROFILE_FIELDS = ['displayName', 'photoURL'];

export const updateUserProfile = async (uid, newData) => {
  const patch = Object.fromEntries(Object.entries(newData).filter(([k]) => EDITABLE_PROFILE_FIELDS.includes(k)));
  try {
    await updateDoc(doc(db, 'users', uid), { ...patch, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/** Records acceptance of a new major Terms version (LEGAL_IMPLEMENTATION_CHECKLIST L4-03). */
export const acceptTerms = async (uid) => {
  try {
    await updateDoc(doc(db, 'users', uid), { termsVersion: CURRENT_TERMS_VERSION, termsAcceptedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
