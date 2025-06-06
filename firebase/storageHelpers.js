import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { storage, auth, db } from './config';
import { handleError } from '@/errors/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = async (file, path = 'images', progressCallback = null) => {
  try {
    // Generate unique filename
    const fileExtension = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fullPath = `${path}/${fileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, fullPath);

    // Start upload
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Return a promise that resolves with download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (progressCallback) {
            progressCallback(progress);
          }
        },
        (error) => {
          const handledError = handleError(error, {
            title: 'File Upload Failed',
            logToAnalytics: true
          });
          reject(handledError);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              success: true,
              url: downloadURL,
              path: fullPath
            });
          } catch (error) {
            const handledError = handleError(error, {
              title: 'Get Download URL Failed',
              logToAnalytics: true
            });
            reject(handledError);
          }
        }
      );
    });
  } catch (error) {
    const handledError = handleError(error, {
      title: 'File Upload Initialization Failed',
      logToAnalytics: true
    });
    throw handledError;
  }
};

export const uploadUserProfileImage = async (file, progressCallback = null) => {
  try {
    // Ensure user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Generate unique filename for profile image
    const fileExtension = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `profile_${user.uid}_${uuidv4()}.${fileExtension}`;
    const fullPath = `profile_images/${user.uid}/${fileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, fullPath);

    // Start upload
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Return a promise that resolves with download URL and user update
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (progressCallback) {
            progressCallback(progress);
          }
        },
        (error) => {
          const handledError = handleError(error, {
            title: 'Profile Image Upload Failed',
            logToAnalytics: true
          });
          reject(handledError);
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update user profile in Firebase Auth
            await updateProfile(user, {
              photoURL: downloadURL
            });

            // Update user document in Firestore
            await updateDoc(doc(db, 'users', user.uid), {
              photoURL: downloadURL,
              updatedAt: serverTimestamp()
            });

            resolve({
              success: true,
              url: downloadURL,
              path: fullPath
            });
          } catch (error) {
            const handledError = handleError(error, {
              title: 'Profile Image Update Failed',
              logToAnalytics: true
            });
            reject(handledError);
          }
        }
      );
    });
  } catch (error) {
    const handledError = handleError(error, {
      title: 'Profile Image Upload Initialization Failed',
      logToAnalytics: true
    });
    throw handledError;
  }
};

export const deleteFile = async (url) => {
  try {
    // Extract path from URL
    const decodedUrl = decodeURIComponent(url);
    const startIndex = decodedUrl.indexOf('/o/') + 3;
    const endIndex = decodedUrl.indexOf('?');
    const fullPath = decodedUrl.substring(startIndex, endIndex);

    // Create reference and delete
    const fileRef = ref(storage, fullPath);
    await deleteObject(fileRef);

    return { success: true };
  } catch (error) {
    const handledError = handleError(error, {
      title: 'File Deletion Failed',
      logToAnalytics: true
    });
    return { success: false, error: handledError.message };
  }
};

export const deleteProfileImage = async (url) => {
  try {
    // Extract path from URL
    const decodedUrl = decodeURIComponent(url);
    const startIndex = decodedUrl.indexOf('/o/') + 3;
    const endIndex = decodedUrl.indexOf('?');
    const fullPath = decodedUrl.substring(startIndex, endIndex);

    // Create reference and delete
    const fileRef = ref(storage, fullPath);
    await deleteObject(fileRef);

    // Clear photoURL in user's profile and Firestore
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { photoURL: null });
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: null,
        updatedAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    const handledError = handleError(error, {
      title: 'Profile Image Deletion Failed',
      logToAnalytics: true
    });
    return { success: false, error: handledError.message };
  }
};

export const getFileUrl = async (path) => {
  try {
    const fileRef = ref(storage, path);
    const url = await getDownloadURL(fileRef);
    return { success: true, url };
  } catch (error) {
    const handledError = handleError(error, {
      title: 'Get File URL Failed',
      logToAnalytics: true
    });
    return { success: false, error: handledError.message };
  }
};

export const getProfileImageUrl = async (path) => {
  try {
    const fileRef = ref(storage, path);
    const url = await getDownloadURL(fileRef);
    return { success: true, url };
  } catch (error) {
    const handledError = handleError(error, {
      title: 'Get Profile Image URL Failed',
      logToAnalytics: true
    });
    return { success: false, error: handledError.message };
  }
};

export default {
  uploadFile,
  uploadUserProfileImage,
  deleteFile,
  deleteProfileImage,
  getFileUrl,
  getProfileImageUrl
};