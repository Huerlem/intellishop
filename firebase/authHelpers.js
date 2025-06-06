import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';

/**
 * Cria um novo usuário com email e senha
 */
export const registerUser = async (email, password, additionalData = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Salva dados adicionais no Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: additionalData.displayName || '',
      phoneNumber: additionalData.phoneNumber || '',
      address: {
        street: additionalData.street || '',
        city: additionalData.city || '',
        postcode: additionalData.postcode || '',
        country: additionalData.country || 'UK',
      },
      createdAt: new Date().toISOString(),
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message, code: error.code };
  }
};

/**
 * Realiza login com email e senha
 */
export const loginUser = async (email, password) => {
  try {
    console.log('Calling signInWithEmailAndPassword:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Firebase login error:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

/**
 * Faz logout do usuário atual
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Envia email de redefinição de senha
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Escuta mudanças no estado de autenticação
 */
export const useAuthState = (callback) => {
  const unsubscribe = onAuthStateChanged(auth, callback);
  return unsubscribe;
};

/**
 * Recupera os dados do usuário do Firestore
 */
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, userData: userDoc.data() };
    } else {
      return { success: false, error: 'User data not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Atualiza os dados do usuário no Firestore
 */
export const updateUserProfile = async (uid, newData) => {
  try {
    await updateDoc(doc(db, 'users', uid), newData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
