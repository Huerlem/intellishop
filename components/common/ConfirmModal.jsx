import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';

const ConfirmModal = ({ 
  visible, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmStyle = "destructive" // "destructive" ou "default"
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {title && <Text style={styles.modalTitle}>{title}</Text>}
          
          <Text style={styles.modalText}>{message}</Text>
          
          <View style={styles.buttonsContainer}>
            <Pressable
              style={[styles.button, styles.buttonCancel]}
              onPress={onCancel}
            >
              <Text style={styles.buttonCancelText}>{cancelText}</Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.button, 
                confirmStyle === "destructive" ? styles.buttonDestructive : styles.buttonDefault
              ]}
              onPress={onConfirm}
            >
              <Text style={
                confirmStyle === "destructive" ? styles.buttonDestructiveText : styles.buttonDefaultText
              }>
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#E2E8F0',
  },
  buttonCancelText: {
    color: '#4A5568',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDestructive: {
    backgroundColor: '#E53E3E',
  },
  buttonDestructiveText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDefault: {
    backgroundColor: '#4338CA',
  },
  buttonDefaultText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ConfirmModal;