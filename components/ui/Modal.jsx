import React from 'react';
import { View, Text, Modal as RNModal,
    StyleSheet, TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions, KeyboardAvoidingView,
    Platform, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { handleError } from '@/errors/errorHandler';

const { width, height } = Dimensions.get('window');

/**
* Reusable modal component
* @param {boolean} visible - Indicates whether the modal is visible
* @param {function} onClose - Function to close the modal
* @param {node} children - Content of the modal
* @param {string} title - Title of the modal
* @param {boolean} closeOnBackdropPress - Indicates whether the modal should close on tap
* @param {object} style - Additional styles for the modal
* @param {string} position - Position of the modal (center, bottom)
* @param {boolean} showCloseButton - Indicates whether the close button should be displayed
* @param {function} onSubmit - Function for the submit button (if provided)
* @param {string} submitText - Text of the submit button
* @param {boolean} disableSubmit - Indicates whether the submit button is disabled
* @param {boolean} fullScreen - Indicates whether the modal should occupy the entire screen
*/
const Modal = ({
    visible,
    onClose = () => {},
    children,
    title,
    closeOnBackdropPress = true,
    style,
    position = 'center',
    onSubmit,
    submitText = 'Submit',
    disableSubmit = false,
    fullScreen = false,
    showCloseButton = true,
}) => {
    //Handles touch on the bottom of the modal
    const handleBackdropPress = () => {
        try {
            if (closeOnBackdropPress) {
              onClose();
            }
        } catch (error) {
            handleError(error, { title: 'Error closing modal' });
        }
    };

    // Prevents touch propagation within the modal
    const handleModalPress = (e) => {
        e.stopPropagation();
    };

    const handleSubmit = () => {
        try {
            if (onSubmit) onSubmit();
        } catch (error) {
            handleError(error, { title: 'Error submitting modal action' });
        }
    };

    //Render the modal header
    const renderHeader = () => {
      if (!title && !showCloseButton) return null;

      return (
          <View style={styles.header}>
              <View style={styles.titleContainer}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
              </View>

              {showCloseButton ? (
                <TouchableOpacity style={styles.closeButton} onPress={handleBackdropPress}>
                    <Ionicons name="close-outline" size={24} color="#4A5568" />
                </TouchableOpacity>
              ) : null}
          </View>
      );
  };

  //Renders the modal footer with the submit button if provided.
  const renderFooter = () => {
      if (!onSubmit) return null;

      return (
          <View style={styles.footer}>
              <TouchableOpacity
                  style={[styles.submitButton, disableSubmit ? styles.disabledButton : null]}
                  onPress={handleSubmit}
                  disabled={disableSubmit}
              >
                  <Text style={[styles.submitButtonText, disableSubmit ? styles.disabledButtonText : null]}>
                      {submitText}
                  </Text>
              </TouchableOpacity>
          </View>
      );
  };

  //Get container styles based on position
  const getContainerStyle = () => {
      switch (position) {
          case 'bottom':
              return styles.bottomContainer;
          default:
              return styles.centerContainer;
      }
  };

  return (
      <RNModal
          transparent
          visible={visible}
          animationType={position === 'bottom' ? 'slide' : 'fade'}
          onRequestClose={handleBackdropPress}
      >
          <StatusBar backgroundColor="rgba(0, 0, 0, 0.5)" barStyle="light-content" />

          <TouchableWithoutFeedback onPress={handleBackdropPress}>
              <View style={styles.backdrop}>
                  <KeyboardAvoidingView
                      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                      style={[
                          styles.keyboardView,
                          fullScreen ? styles.fullScreenKeyboardView : null,
                      ]} 
                  >
                      <TouchableWithoutFeedback onPress={handleModalPress}>
                          <SafeAreaView 
                              style={[
                                  styles.modalContainer,
                                  getContainerStyle(),
                                  fullScreen ? styles.fullScreenContainer : null,
                                  style,
                              ]}
                              edges={
                                  fullScreen 
                                      ? ['top', 'bottom'] 
                                      : position === 'bottom' ? ['bottom'] : []
                              }
                          >
                              {renderHeader()}
                              <View style={styles.content}>{children}</View>
                              {renderFooter()}
                          </SafeAreaView>
                      </TouchableWithoutFeedback>
                  </KeyboardAvoidingView>
              </View>
          </TouchableWithoutFeedback>
      </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  keyboardView: {
      width: '100%',
      justifyContent: 'center',
  },
  fullScreenKeyboardView: {
      flex: 1,
  },
  modalContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
      elevation: 5,
      // Use boxShadow instead of shadow* props for web
      ...Platform.select({
          web: {
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.25)',
          },
          default: {
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.25)',

          }
      }),
  },
  centerContainer: {
      width: width * 0.9,
      maxWidth: 500,
      maxHeight: height * 0.8,
      marginHorizontal: 20,
  },
  bottomContainer: {
      width: '100%',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      marginTop: 'auto',
  },
  fullScreenContainer: {
      flex: 1,
      width: '100%',
      borderRadius: 0,
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
  },
  titleContainer: {
      flex: 1,
  },
  title: {
      fontSize: 18,
      fontWeight: '600',
      color: '#4338CA',
  },
  closeButton: {
      padding: 4,
  },
  content: {
      padding: 16,
      maxHeight: height * 0.7,
  },
  footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
  },
  submitButton: {
      backgroundColor: '#4338CA',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
  },
  submitButtonText: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '600',
  },
  disabledButton: {
      backgroundColor: '#E2E8F0',
  },
  disabledButtonText: {
      color: '#A0AEC0',
  },
});

export default Modal;