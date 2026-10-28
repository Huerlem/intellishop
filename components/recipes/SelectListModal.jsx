// components/recipes/SelectListModal.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const SelectListModal = ({ 
  visible, 
  onClose, 
  lists, 
  onSelectList, 
  onCreateNewList,
  loading = false 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    setCreating(true);
    try {
      const result = await onCreateNewList(newListName.trim());
      if (result.success) {
        setNewListName('');
        setShowCreateForm(false);
        // Automatically select the new list
        onSelectList(result.list);
      } else {
        Alert.alert('Error', result.error || 'Failed to create list');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  const renderListItem = ({ item }) => {
    const itemCount = item.items?.length || 0;
    const completedCount = item.items?.filter(i => i.checked).length || 0;
    
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => onSelectList(item)}
      >
        <View style={styles.listIcon}>
          <Ionicons name="list-outline" size={24} color="#4338CA" />
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{item.name}</Text>
          <Text style={styles.listMeta}>
            {itemCount} items • {completedCount} completed
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  return (
    <Modal 
      visible={visible} 
      title="Select Shopping List" 
      onClose={onClose}
      closeOnBackdropPress={true}
      showCloseButton={true}
    >
      <View style={styles.container}>
        {!showCreateForm ? (
          <>
            {/* Create New List Button */}
            <TouchableOpacity
              style={styles.createNewButton}
              onPress={() => setShowCreateForm(true)}
            >
              <View style={styles.createNewIcon}>
                <Ionicons name="add-circle" size={24} color="#4338CA" />
              </View>
              <Text style={styles.createNewText}>Create New List</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SELECT EXISTING</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Existing Lists */}
            {lists.length > 0 ? (
              <FlatList
                data={lists}
                keyExtractor={(item) => item.id}
                renderItem={renderListItem}
                style={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No shopping lists yet</Text>
                <Text style={styles.emptySubtext}>Create your first list above</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Create New List Form */}
            <View style={styles.createForm}>
              <Text style={styles.formLabel}>List Name</Text>
              <TextInput
                style={styles.input}
                value={newListName}
                onChangeText={setNewListName}
                placeholder="E.g., Weekly Groceries"
                autoFocus
              />
              <View style={styles.formButtons}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowCreateForm(false);
                    setNewListName('');
                  }}
                  style={[styles.formButton, styles.cancelButton]}
                />
                <Button
                  title={creating ? "Creating..." : "Create"}
                  onPress={handleCreateList}
                  disabled={creating || !newListName.trim()}
                  style={[styles.formButton, styles.createButton]}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
    minHeight: 200,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4338CA',
    borderStyle: 'dashed',
  },
  createNewIcon: {
    marginRight: 12,
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4338CA',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  listMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  createForm: {
    padding: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  formButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  createButton: {
    backgroundColor: '#4338CA',
  },
});

export default SelectListModal;