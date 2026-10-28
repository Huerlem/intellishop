import React, { useState, useEffect } from 'react';
import { View, Text,
    StyleSheet, TextInput,
    TouchableOpacity,
    Image, Alert, ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadUserProfileImage } from '@/firebase/storageHelpers';

//Hooks
import { useAuth } from '@/hooks/useAuth';

//Components
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, userData, updateProfile, error: authError } = useAuth();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        displayName: '',
        phoneNumber: '',
        photoURL: '',
        email: user?.email,
        address: {
            street: '',
            city: '',
            postcode: '',
            country: 'UK'
        }
    });
    const [uploadedImage, setUploadedImage] = useState(null);
    const [error, setError] = useState(null);
    

    useEffect(() => {
        if (userData) {
            setProfileData({
                displayName: userData.displayName || '',
                phoneNumber: userData.phoneNumber || '',
                photoURL: userData.photoURL || '',
                email: userData.email || '',
                address: {
                    street: userData.address?.street || '',
                    city: userData.address?.city || '',
                    postcode: userData.address?.postcode || '',
                    country: userData.address?.country || 'UK'
                }
            });
        }
    }, [userData]);

    //Select image from gallery
    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('Permission denied', 'You need to enable permission to access the library');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setUploadedImage(result.assets[0].uri);

            }
        } catch (error) {
            console.error('Error picking image:', error);
            setError('Error picking image. Please try again.')
        }
    };

    //Update user profile
    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            setError(null);

            //validation
            if (!profileData.displayName.trim()) {
                setError('Display name is required');
                setSaving(false);
                return;
            }
            

            //Prepare data to update
            const updatedProfile = {
                ...profileData,
            };

            //If image is selected, add it to the update data
            if (uploadedImage) {
                setLoading(true);
                try {
                    const result = await uploadUserProfileImage(uploadedImage);

                    if (result.success) {
                        updatedProfile.photoURL = result.url;
                    } else {
                        throw new Error(result.error || 'Error uploading image');
                    }
                } catch (uploadError) {
                    console.error('Error uploading imege:', uploadError);
                    setError('Error uploading image.Please try again.');
                    setSaving(false);
                    setLoading(false);
                    return;
                }
            }

            const result = await updateProfile(updatedProfile);
            if (!result?.success) {
                throw new Error(result?.error || 'It was not possible to update the profile, please try again.');
            }

            Alert.alert('Success', 'Profile updated successfully!');
                router.back();
            
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.message || 'It was not possible to update the profile, please try again.');
        } finally {
            setSaving(false);
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading Profile data..." />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <KeyboardAvoidingView 
                behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => router.back()}
                            accessibilityRole="button"
                            accessibilityLabel="Back"
                        >
                            <MaterialIcons name="arrow-back" size={24} color='#C0C0C0' />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>Edit Profile</Text>

                        <View style={styles.placeholder} />
                    </View>

                    {/* Profile Image */}
                    <View style={styles.profileImageContainer}>
                        {(uploadedImage || profileData.photoURL) ? (
                            <Image
                                source={{ uri: uploadedImage || profileData.photoURL }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <Text style={styles.profileImageText}>
                                    {profileData.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>
                        
                        )}

                        <TouchableOpacity 
                            style={styles.changePhotoButton}
                            onPress={pickImage}
                        >
                            <MaterialIcons name="photo-camera" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Error Message */}
                    {(error || authError) && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error || authError}</Text>
                        </View>
                    )}

                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Full name</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Your full name"
                                value={profileData.displayName}
                                onChangeText={(text) => setProfileData({...profileData, displayName: text})}
                            />    
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>E-mail</Text>
                            <Text style={styles.emailText}>{user?.email}</Text>
                            <Text style={styles.emailNote}>Your email cannot be changed</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Full name</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Your Phone Number"
                                value={profileData.phoneNumber}
                                onChangeText={(text) => setProfileData({...profileData, phoneNumber: text})}
                                keyboardType="phone-pad"
                            />    
                        </View>

                        <Text style={styles.sectionTitle}>Address</Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Street</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Your Address"
                                value={profileData.address.street}
                                onChangeText={(text) => setProfileData({...profileData, address: {...profileData.address, street: text}
                                })}
                            />    
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>City</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Your City"
                                value={profileData.address.city}
                                onChangeText={(text) => setProfileData({...profileData, address: {...profileData.address, city: text}
                                })}
                            />    
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Postcode</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Your postcode"
                                value={profileData.address.postcode}
                                onChangeText={(text) => setProfileData({...profileData, address: {...profileData.address, postcode: text}
                                })}
                                keyboardType="default"
                            />    
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Country</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="United Kingdom"
                                value={profileData.address.country}
                                onChangeText={(text) => setProfileData({...profileData, address: {...profileData.address, country: text}
                                })}
                            />    
                        </View>
                    </View>

                    {/* Action Buttons*/}
                    <View style={styles.actionButtons}>
                        <Button 
                            title="Cancel"
                            onPress={() => router.back()}
                            variant="secondary"
                            style={styles.actionButton}
                        />
                        <Button 
                            title="Save changes"
                            onPress={handleSaveProfile}
                            loading={saving}
                            style={styles.actionButton}
                        />


                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#4338CA',
    },
    placeholder: {
        width: 24,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4338CA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    changePhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: '50%',
        marginRight: -60,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4338CA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        backgroundColor: '#FFEAEA',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        backgroundColor: '#C0C0C0', 
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        elevation: 2,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#4A5568',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        color: '#2D3748',
        backgroundColor: '#F7FAFC',
    },
    emailText: {
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        color: '#4A5568',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#EDF2F7',
        borderRadius: 8,
    },
    emailNote: {
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        color: '#718096',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
        color: '#4338CA',
        marginBottom: 12,
        marginTop: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 16,
        marginTop: 8,
        
    },
    actionButton: {
        flex: 1,
        maxWidth: 160,
        marginHorizontal: 6,
    },
});
  
