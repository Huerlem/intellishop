import { useContext } from 'react';
import { ShoppingListContext } from '@/context/ShoppingListContext';


/**
 * Hook personalized to context access shopping list
 * Simplify access to states and fnction to management of shopping list
 * Management shopping list state and functions.
 */
export const useShoppingList = () => {
    const context = useContext(ShoppingListContext);

    if (context === undefined) {
        throw new Error('useShoppingList must be used within a ShoppingListProvider');
    }

    //Destructures context values to make them easier to use
    const {
        lists,
        currentList,
        loading,
        error,
        fetchShoppingLists,
        createShoppingList,
        selectList,
        addItem,
        removeItem,
        updateItem,
        updateList,
        toggleItemChecked,
        toggleAddToStock,
        deleteList,
        sortItems,
    } = context;

    //Additional assistant function
    const getActiveItems = () => {
        if (!currentList || !currentList.items || !Array.isArray(currentList.items)) return [];
        return currentList.items.filter(item => !item.checked);
    };

    const getCheckedItems = () => {
        if (!currentList || !currentList.items || !Array.isArray(currentList.items)) return [];
        return currentList.items.filter(item => item.checked);
    };

    const getItemsCount = () => {
        if (!currentList || !currentList.items) return 0;
        return Array.isArray(currentList.items) ? currentList.items.length : 0;
    };

    const getCompletionPercentage = () => {
        if (!currentList || !currentList.items || !Array.isArray(currentList.items) || currentList.items.length === 0) return 0;

        const checkedCount = getCheckedItems().length;
        return Math.round((checkedCount / currentList.items.length) * 100);
    };

    const getTotalEstimatedCost = () => {
        if(!currentList || !currentList.items || !Array.isArray(currentList.items)) return 0;

        return currentList.items.reduce((total, item) => {
            return total + (item.estimatedPrice || 0);
        }, 0);
    };

    const getItemsByCategory = () => {
        if (!currentList || !currentList.items || !Array.isArray(currentList.items)) return {};
    
        return currentList.items.reduce((categories, item) => {
            // Normalizar categoria
            const category = 
                typeof item.category === 'string' 
                    ? item.category 
                    : item.category?.label || item.category?.id || 'Uncategorized';
    
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(item);
            return categories;
        }, {});
    };

    const clearCheckedItems = async () => {
        if (!currentList) return { success: false, error: 'No list selected' };
        if (!currentList.items || !Array.isArray(currentList.items)) return { success: false, error: 'No items in list' };

        const checkedItems = getCheckedItems();

        //Every item marked, remove from the list
        for (const item of checkedItems) {
            await removeItem(item.id);
        } 

        return { success: true, removedCount: checkedItems.length };
    };

    const clearCompleted = async () => {
        const checkedItems = getCheckedItems();
        if (!Array.isArray(checkedItems) || checkedItems.length === 0) return;
        
        for (const item of checkedItems) {
            await removeItem(item.id);
        }
    };

    //return context values and assitant function
    return {
        lists,
        currentList,
        loading,
        error,
        fetchShoppingLists,
        createShoppingList,
        selectList,
        addItem,
        removeItem,
        updateItem,
        updateList,
        toggleItemChecked,
        toggleAddToStock,
        deleteList,
        sortItems,
        getActiveItems,
        getCheckedItems,
        getItemsCount,
        getCompletionPercentage,
        getTotalEstimatedCost,
        getItemsByCategory,
        clearCheckedItems,
        clearCompleted,
        items: currentList?.items || [],
        totalItems: getItemsCount(),
        completedItems: getCheckedItems().length
    };
};

export default useShoppingList;

export const debugShoppingList = (currentList, addItem) => {
  console.log('🔍 DEBUG Shopping List State:');
  console.log('Current List:', currentList);
  console.log('Current List ID:', currentList?.id);
  console.log('Current List Items:', currentList?.items);
  console.log('addItem function exists:', typeof addItem === 'function');
  
  if (currentList) {
    console.log('List details:', {
      id: currentList.id,
      name: currentList.name,
      itemCount: currentList.items?.length || 0,
      items: currentList.items?.map(i => ({ 
        id: i.id, 
        name: i.name, 
        checked: i.checked 
      }))
    });
  }
};