import React, { useState, useEffect, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/utils/WebCompatibleIcons';
import { CATEGORIES_ICONS, UNITS } from '@/constants/stockConstants';


import { useShoppingList } from '@/hooks/useShoppingList';
import { ROUTES } from '@/src/navigation/routes';
import { StockContext } from '@/context/StockContext';
import ShoppingListCard from '@/components/shopping/ShoppingListCard';
import ShoppingListItem from '@/components/shopping/ShoppingListItem';
import AddItemForm from '@/components/shopping/AddItemForm';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ConfirmModal from '@/components/common/ConfirmModal';
import Button from '@/components/ui/Button';

const SORT_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'category', label: 'Category' },
  { id: 'date', label: 'Edit Date' },
  { id: 'completion', label: 'Completion' },
];

export default function ShoppingListScreen() {
  const router = useRouter();
  const {
      lists,
      currentList,
      items = [],
      loading,
      fetchShoppingLists,
      selectList,
      createShoppingList,
      updateList,
      deleteList,
      addItem,
      updateItem,
      toggleItemChecked,
      removeItem,
      clearCompleted,
      sortItems,
      totalItems = 0,
      completedItems = 0,
  } = useShoppingList();

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [currentSort, setCurrentSort] = useState('date');
  const [filterCompleted, setFilterCompleted] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [editingListName, setEditingListName] = useState('');
  const [editingListId, setEditingListId] = useState(null);
  const [viewMode, setViewMode] = useState('lists');
  const { addListItemsToStock } = useContext(StockContext);
  
  // Status for delete confirmation modal
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [listToDelete, setListToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Load shopping lists when component is assembled
    fetchShoppingLists().catch(error => {
      console.error("Error fetching shopping lists:", error);
      setErrorMessage("Failed to load shopping lists");
    });
  }, []);

  // Logging for debugging
  useEffect(() => {
    
    console.log("ShoppingListScreen loaded with items:", items);
    console.log("removeItem function:", typeof removeItem === 'function' ? 'Available' : 'Not available');
    console.log("Current view mode:", viewMode);
    console.log("Current list:", currentList?.name);
  }, [items, removeItem, lists, viewMode, currentList]);

  // List management functions
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setErrorMessage('Please enter a list name');
      return;
    }

    const result = await createShoppingList(newListName);
    if (result.success) {
      setNewListName('');
      setShowAddListModal(false);
      setSuccessMessage('New shopping list created');
      setViewMode('items'); // Switch to item view
    } else {
      setErrorMessage(result.error || 'Failed to create list');
    }
  };

  const handleOpenList = (list) => {
    selectList(list.id);
    setViewMode('items');
  };

  const handleEditList = () => {
    if (!editingListId || !editingListName.trim()) {
      setErrorMessage('Please enter a list name');
      return;
    }

    updateList(editingListId, { name: editingListName.trim() })
      .then((result) => {
        if (result.success) {
          setShowEditListModal(false);
          setSuccessMessage('List name updated');
        } else {
          setErrorMessage(result.error || 'Failed to update list');
        }
      });
  };

  const prepareEditList = (list) => {
    setEditingListId(list.id);
    setEditingListName(list.name);
    setShowEditListModal(true);
  };

  const prepareDeleteList = (list) => {
    setListToDelete(list);
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteList = async () => {
    if (!listToDelete) return;
    
    try {
      const result = await deleteList(listToDelete.id);
      if (result.success) {
        setSuccessMessage('Shopping list deleted');
        if (viewMode === 'items' && currentList?.id === listToDelete.id) {
          // If the deleted list is the current one, return to the list view
          setViewMode('lists');
        }
      } else {
        setErrorMessage(result.error || 'Failed to delete list');
      }
    } catch (error) {
      console.error("Error deleting list:", error);
      setErrorMessage('Failed to delete list');
    } finally {
      setDeleteConfirmVisible(false);
      setListToDelete(null);
    }
  };

  const handleAddItem = async (name, quantity, unit, estimatedPrice, category, note) => {
    const result = await addItem(
        name, 
        quantity, 
        unit, 
        estimatedPrice, 
        category, // It will already be a normalized string
        note
    );
    
    if (result?.success) {
        setShowAddItemModal(false);
        setSuccessMessage('Item added to your shopping list');
    } else {
        setErrorMessage(result?.error || 'Unknown error');
    }
  };

  const handleEditItem = (name, quantity, unit, estimatedPrice, category, note) => {
      if (!editingItem) return;

      updateItem(editingItem.id, {
          ...editingItem,
          name,
          quantity,
          unit,
          estimatedPrice,
          category, 
          notes: note,
      }).then((result) => {
          if (result.success) {
              setEditingItem(null);
              setSuccessMessage('Item updated successfully');
          } else {
              setErrorMessage(result.error || 'Failed to update item');
          }
      });
  };
  

  // Preparing to open the confirmation modal
  const prepareDeleteItem = (item) => {
    console.log("Preparing to delete item:", item.id, item.name);
    setItemToDelete(item);
    setDeleteConfirmVisible(true);
  };

  // Executing deletion after confirmation
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    
    console.log("Confirming deletion of item:", itemToDelete.id);
    
    try {
      const result = await removeItem(itemToDelete.id);
      if (result.success) {
        setSuccessMessage('Item removed from list');
      } else {
        setErrorMessage(result.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      setErrorMessage('Failed to delete item');
    } finally {
      setDeleteConfirmVisible(false);
      setItemToDelete(null);
    }
  };

  // Cancel deletion
  const cancelDeleteItem = () => {
    console.log("Deletion canceled");
    setDeleteConfirmVisible(false);
    setItemToDelete(null);
  };

  const handleClearCompleted = () => {
    if (completedItems === 0) {
      return setErrorMessage('No completed items to remove.');
    }
    
    // Configure confirmation modal to clear completed
    setItemToDelete({ id: 'completed', name: `${completedItems} completed items` });
    setDeleteConfirmVisible(true);
  };

  const confirmClearCompleted = async () => {
    if (itemToDelete?.id === 'completed') {
      const result = await clearCompleted();
      if (result.success) {
        setSuccessMessage('Completed items cleared');
      } else {
        setErrorMessage(result.error || 'Failed to clear completed items');
      }
      setDeleteConfirmVisible(false);
      setItemToDelete(null);
    }
  };

  const handleSort = (sortOption) => {
    setCurrentSort(sortOption);
    sortItems(sortOption);
    setShowSortModal(false);
  };

  const handleExportToStock = async (list) => {
    const targetListId = list ? list.id : currentList?.id;
    if (!targetListId) {
      setErrorMessage('No list selected');
      return;
    }
    
    const result = await exportToStock(targetListId);
    if (result.success) {
      setSuccessMessage(result.message || 'Items exported to stock');
    } else {
      setErrorMessage(result.error || 'Failed to export to stock');
    }
  };

  // Filter items based on filter state
  const filteredItems = filterCompleted
    ? items.filter((item) => !item.checked)
    : items;

  // Function to cancel deletion
  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
    setItemToDelete(null);
    setListToDelete(null);
  };

  // Return to the list page
  const handleBackToLists = () => {
    setViewMode('lists');
    fetchShoppingLists();
  };

  const handleAddToStock = async (item) => {
    // First, mark the item as added to stock in the shopping list.
    await updateItem(item.id, { addedToStock: true });
    
    // Then effectively add to stock
    const { success, message } = await addListItemsToStock([item]);
    
    if (success) {
      setSuccessMessage(`${item.name} added to stock`);
    } else {
      setErrorMessage('Failed to add item to stock');
    }
  };

  const exportToStock = async (listId) => {
    if (!listId) {
      return { success: false, error: 'No list specified' };
    }
  
    try {
      // Get the right list
      const targetList = lists.find(list => list.id === listId) || currentList;
      if (!targetList || !targetList.items || targetList.items.length === 0) {
        return { success: false, error: 'No items found in list' };
      }
  
      // Get items not marked as "added to inventory"
      const itemsToExport = targetList.items.filter(item => !item.addedToStock);
      
      if (itemsToExport.length === 0) {
        return { success: false, error: 'All items already added to stock' };
      }
  
      // Use the inventory context to add items
      const { success, added, updated } = await addListItemsToStock(itemsToExport);
      
      if (success) {
        // Mark all exported items as added to inventory
        for (const item of itemsToExport) {
          await updateItem(item.id, { addedToStock: true });
        }
        
        return { 
          success: true, 
          message: `${added} items added and ${updated} items updated in stock` 
        };
      } else {
        return { success: false, error: 'Failed to export items to stock' };
      }
    } catch (error) {
      console.error("Error exporting to stock:", error);
      return { success: false, error: 'An error occurred while exporting to stock' };
    }
  };

  // Render Header
  const renderHeader = () => (
    <View style={styles.header}>
      {viewMode === 'items' && currentList ? (
        // Header for viewing items
        <Pressable style={styles.backButton} onPress={handleBackToLists}>
          
          <Icon name="arrow-back" size={24} color="#4338CA" />
        </Pressable>
      ) : (
        // List view header
        <Pressable
          style={styles.backButton}
          onPress={() => router.navigate(ROUTES.home)}
          accessibilityRole="button"
          accessibilityLabel="Back to Home">
          <Icon name="arrow-back" size={24} color="#4338CA" />
        </Pressable>
      )}
      
      <Text style={styles.title}>
        {viewMode === 'items' && currentList 
          ? currentList.name 
          : 'Shopping Lists'}
      </Text>
      
      <View style={styles.headerRight}>
        {viewMode === 'items' && (
          <>
            <Pressable style={styles.iconButton} onPress={() => setShowSortModal(true)}>
              
              <Icon name="funnel-outline" size={24} color="#4338CA" />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setFilterCompleted(!filterCompleted)}>
              <Icon
                name={filterCompleted ? "filter-alt" : "filter-list"}
                size={24}
                color={filterCompleted ? "#4338CA" : "#A0AEC0"}
              />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );

  // Render statistics 
  const renderStats = () => {
    if (viewMode !== 'items' || !currentList) return null;
    
    return (
      <View style={styles.statsContainer}>
        <StatBox label="Total" value={totalItems} />
        <StatBox label="Completed" value={completedItems} />
        <StatBox label="Pending" value={totalItems - completedItems} />
      </View>
    );
  };

  // Render main content
  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (viewMode === 'lists') {
      // Show list view
      return lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="list-outline" size={48} color="#A0AEC0" />
          <Text style={styles.emptyText}>No shopping lists yet</Text>
          <Text style={styles.emptySubtext}>Create a new list to get started</Text>
          <Button 
            title="Create New List" 
            onPress={() => setShowAddListModal(true)}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ShoppingListCard
              list={item}
              onPress={handleOpenList}
              onEdit={prepareEditList}
              onDelete={prepareDeleteList}
              onExportToStock={() => handleExportToStock(item)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      );
    } else {
      // Show item preview
      return !currentList ? (
        <View style={styles.emptyContainer}>
          <Icon name="alert-circle-outline" size={48} color="#A0AEC0" />
          <Text style={styles.emptyText}>No list selected</Text>
          <Button 
            title="Back to Lists" 
            onPress={handleBackToLists}
            style={styles.emptyButton}
          />
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="cart-outline" size={48} color="#A0AEC0" />
          <Text style={styles.emptyText}>
            {filterCompleted 
              ? "All items are completed" 
              : "Your shopping list is empty"}
          </Text>
          <Text style={styles.emptySubtext}>
            {filterCompleted 
              ? "Remove filter to see completed items" 
              : "Add items to get started"}
          </Text>
          {!filterCompleted && (
            <Button 
              title="Add First Item" 
              onPress={() => setShowAddItemModal(true)}
              style={styles.emptyButton}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ShoppingListItem
              item={item}
              onToggleCheck={(id, checked) => toggleItemChecked(id, checked)}
              onDelete={() => prepareDeleteItem(item)}
              onEdit={() => setEditingItem(item)}
              onAddToStock={() => handleAddToStock(item)}
            />
          )}
          contentContainerStyle={styles.itemsContainer}
          showsVerticalScrollIndicator={false}
        />
      );
    }
  };

  // Render floating buttons
  const renderFloatingButtons = () => {
    if (viewMode === 'lists') {
      // Add List Button
      return (
        <Pressable style={styles.fab} onPress={() => setShowAddListModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      );
    } else if (currentList) {
      // Buttons for item list
      return (
        <View style={styles.fabContainer}>
          {completedItems > 0 && (
            <Pressable style={styles.clearButton} onPress={handleClearCompleted}>
              <Icon name="trash-outline" size={24} color="#FFF" />
            </Pressable>
          )}
          <Pressable style={styles.fab} onPress={() => setShowAddItemModal(true)}>
            <Text style={styles.fabText}>+</Text>
          </Pressable>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderStats()}
      {renderContent()}
      {renderFloatingButtons()}

      {/* MODALS */}
      
      {/* Modal to add item */}
      <Modal 
        visible={showAddItemModal} 
        title="Add Item" 
        onClose={() => setShowAddItemModal(false)}
      >
        <AddItemForm 
          onSubmit={handleAddItem}
          initialValues={null}  // Explicitly null instead of undefined
          isEditMode={false}    // Explicitly false
          categories={CATEGORIES_ICONS}
          units={UNITS}
        />
      </Modal>

      {/* Modal to edit item */}
      <Modal 
        visible={!!editingItem} 
        title="Edit Item" 
        onClose={() => setEditingItem(null)}
      >
        {editingItem && (
          <AddItemForm 
            key={editingItem.id} // Keeping the key to force reassembly
            initialValues={{
              name: editingItem.name || '',
              quantity: editingItem.quantity || 1,
              unit: editingItem.unit || 'un',
              estimatedPrice: editingItem.estimatedPrice || '',
              category: editingItem.category || 'others',
              notes: editingItem.notes || ''
            }} 
            onSubmit={handleEditItem}
            isEditMode={true} // Adicionando esta flag
            categories={CATEGORIES_ICONS}
            units={UNITS}
          />
        )}
      </Modal>

      {/* Modal to add a list */}
      <Modal 
        visible={showAddListModal} 
        title="Create New List" 
        onClose={() => setShowAddListModal(false)}
      >
        <View style={styles.formContainer}>
          <Text style={styles.label}>List Name</Text>
          <TextInput
            style={styles.input}
            value={newListName}
            onChangeText={setNewListName}
            placeholder="E.g., Weekly Groceries, Party Supplies..."
          />
          <Button 
            title="Create List" 
            onPress={handleCreateList} 
            style={styles.submitButton}
          />
        </View>
      </Modal>

      {/* Modal to edit a list */}
      <Modal 
        visible={showEditListModal} 
        title="Edit List Name" 
        onClose={() => setShowEditListModal(false)}
      >
        <View style={styles.formContainer}>
          <Text style={styles.label}>List Name</Text>
          <TextInput
            style={styles.input}
            value={editingListName}
            onChangeText={setEditingListName}
            placeholder="Enter new list name"
          />
          <Button 
            title="Save Changes" 
            onPress={handleEditList} 
            style={styles.submitButton}
          />
        </View>
      </Modal>

      {/* Confirmation modal for deletion */}
      <ConfirmModal
        visible={deleteConfirmVisible}
        title={listToDelete ? "Delete List" : "Delete Item"}
        message={
          listToDelete 
            ? `Are you sure you want to delete the list "${listToDelete.name}" and all its items?`
            : itemToDelete?.id === 'completed'
            ? `Remove ${completedItems} completed items from your list?`
            : itemToDelete
            ? `Are you sure you want to remove "${itemToDelete.name}" from your list?`
            : 'Are you sure you want to delete this item?'
        }
        onConfirm={
          listToDelete 
            ? confirmDeleteList 
            : itemToDelete?.id === 'completed'
            ? confirmClearCompleted
            : confirmDeleteItem
        }
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="destructive"
      />

      {/* Modal for sorting options */}
      <Modal 
        visible={showSortModal} 
        title="Sort by" 
        onClose={() => setShowSortModal(false)}
      >
        {SORT_OPTIONS.map((option) => (
          <Pressable 
            key={option.id} 
            style={styles.sortOption} 
            onPress={() => handleSort(option.id)}
          >
            <Text style={currentSort === option.id ? styles.sortActive : styles.sortText}>
              {option.label}
            </Text>
            {currentSort === option.id && <Icon name="checkmark" size={20} color="#4338CA" />}
          </Pressable>
        ))}
      </Modal>

    </SafeAreaView>
  );
}

// Stat box component
function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    paddingHorizontal: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4338CA',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4338CA',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#A0AEC0',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 24,
    width: 200,
  },
  listContainer: {
    paddingVertical: 16,
  },
  itemsContainer: {
    padding: 16,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',

    elevation: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',

    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '600',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
  },
  sortText: {
    fontSize: 16,
    color: '#4A5568',
  },
  sortActive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4338CA',
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});