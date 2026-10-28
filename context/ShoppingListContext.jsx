import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { handleError } from '@/errors/errorHandler';
import { randomUUID } from 'expo-crypto';

// create Shopping List Context
export const ShoppingListContext = createContext();

export const ShoppingListProvider = ({ children }) => {
    // get authentication state
    const { user, isAuthenticated } = useContext(AuthContext);

    // Manage Shopping List State
    const [lists, setLists] = useState([]);
    const [currentList, setCurrentList] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ✅ NOVO: Estado para controlar operações de adição
    const [isAddingItems, setIsAddingItems] = useState(false);

    // Fetch Shopping Lists when user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchShoppingLists();
        } else {
            // clean all data when user is logout
            setLists([]);
            setCurrentList(null);
        }
    }, [isAuthenticated]);

    /**
     * Fetch Shopping Lists
     */
    const fetchShoppingLists = async () => {
        setLoading(true);
        setError(null);

        if (!user?.uid) {
            setLoading(false);
            return;
        }
        
        try {
            console.log('📦 Fetching shopping lists for user:', user.uid);
            
            const q = query(
                collection(db, 'shoppingLists'),
                where('userId', '==', user.uid),
                orderBy('updatedAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const listsData = [];

            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                listsData.push({
                    id: doc.id,
                    ...docData,
                    items: docData.items || [],
                    createdAt: docData.createdAt?.toDate(),
                    updatedAt: docData.updatedAt?.toDate()
                });
            });

            console.log('✅ Fetched', listsData.length, 'shopping lists');
            setLists(listsData);

            // define current list
            if(listsData.length > 0 && !currentList) {
                console.log('📋 Auto-selecting first list:', listsData[0].name);
                setCurrentList(listsData[0]);
            }
        } catch (error) {
            console.error('❌ Error fetching shopping lists:', error);
            const handled = handleError(error, { title: 'Failed to fetch shopping lists' });
            setError(handled.message);
        } finally {
            setLoading(false);
        }
    };

    const sortItems = (sortBy) => {
        if (!currentList || !currentList.items || !Array.isArray(currentList.items)) return;

        const sorted = [...currentList.items];

        switch (sortBy) {
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
                case 'category':
                    sorted.sort((a, b) => {
                        const categoryA = typeof a.category === 'string' 
                            ? a.category 
                            : a.category?.label || a.category?.id || '';
                        
                        const categoryB = typeof b.category === 'string' 
                            ? b.category 
                            : b.category?.label || b.category?.id || '';
                        
                        return categoryA.localeCompare(categoryB);
                    });
                    break;
            case 'date':
                // No date per item? Fall back to list sort order.
                break;
            case 'completion':
                sorted.sort((a, b) => a.checked - b.checked);
                break;
            default:
                break;
        }

        const updatedList = {
            ...currentList,
            items: sorted,
        };

        setCurrentList(updatedList);
        setLists((prev) => prev.map((list) => list.id === updatedList.id ? updatedList : list));
    };

    /**
     * Create a new Shopping List
     */
    const createShoppingList = async (name, setAsCurrent = true, isAIGenerated = false, budget = null) => {
        setLoading(true);
        setError(null);
        try {
            console.log('📝 Creating new shopping list:', name);
            
            // create a new shopping list object
            const listData = {
                userId: user.uid,
                name,
                items: [],
                isAIGenerated,
                budget,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // add to firestore
            const docRef = await addDoc(collection(db, 'shoppingLists'), {
                ...listData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // get the newly created list
            const newList = {
                id: docRef.id,
                ...listData,
            };

            console.log('✅ Shopping list created successfully:', newList.name);

            // update the state
            setLists(prev => [newList, ...prev]);

            // set the new list as current list
            if (setAsCurrent) {
                console.log('📋 Setting new list as current');
                setCurrentList(newList);
            }

            return { success: true, list: newList};
        } catch (error) {
            console.error('❌ Error creating shopping list:', error);
            const handled = handleError(error, { title: 'Failed to create shopping list' });
            setError(handled.message);
            return { success: false, error: handled.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * ✅ CORRIGIDO: Define a Shopping List as Current List
     */
    const selectList = async (listId) => {
        try {
            console.log('📋 Selecting list with ID:', listId);
            
            // Primeiro, tenta encontrar a lista no estado local
            const localList = lists.find(list => list.id === listId);
            if (localList) {
                console.log('✅ Found list locally:', localList.name);
                setCurrentList(localList);
                
                // Aguarda um momento para garantir que o estado foi atualizado
                await new Promise(resolve => setTimeout(resolve, 100));
                
                return { success: true, list: localList };
            }
            
            // Se não encontrou localmente, busca no Firebase
            console.log('🔍 List not found locally, fetching from Firebase...');
            setLoading(true);
            
            const listRef = doc(db, 'shoppingLists', listId);
            const listSnap = await getDoc(listRef);

            if (listSnap.exists()) {
                const listData = {
                    id: listSnap.id,
                    ...listSnap.data(),
                    items: listSnap.data().items || [],
                    createdAt: listSnap.data().createdAt?.toDate(),
                    updatedAt: listSnap.data().updatedAt?.toDate()
                };

                console.log('✅ Fetched list from Firebase:', listData.name);
                setCurrentList(listData);
                
                // Atualiza a lista no estado local se ela não existir
                setLists(prev => {
                    const exists = prev.find(list => list.id === listId);
                    if (!exists) {
                        return [listData, ...prev];
                    }
                    return prev.map(list => list.id === listId ? listData : list);
                });
                
                // Aguarda um momento para garantir sincronização
                await new Promise(resolve => setTimeout(resolve, 100));
                
                return { success: true, list: listData };
            } else {
                throw new Error('Shopping List not found');
            }
        } catch (error) {
            console.error('❌ Error selecting list:', error);
            const handled = handleError(error, { title: 'Failed to select shopping list' });
            setError(handled.message);
            return { success: false, error: handled.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * ✅ NOVA: Add item to specific list (não depende do currentList)
     */
    const addItemToSpecificList = async (listId, name, quantity = 1, unit = 'unit', estimatedPrice, category, note) => {
        try {
            console.log('➕ Adding item to specific list:', {
                listId,
                itemName: name,
                quantity,
                unit
            });

            // Busca a lista específica
            let targetList = lists.find(list => list.id === listId);
            
            if (!targetList) {
                // Se não encontrou localmente, busca no Firebase
                console.log('🔍 List not found locally, fetching from Firebase...');
                const listRef = doc(db, 'shoppingLists', listId);
                const listSnap = await getDoc(listRef);
                
                if (!listSnap.exists()) {
                    throw new Error('Target list not found');
                }
                
                targetList = {
                    id: listSnap.id,
                    ...listSnap.data(),
                    items: listSnap.data().items || [],
                    createdAt: listSnap.data().createdAt?.toDate(),
                    updatedAt: listSnap.data().updatedAt?.toDate()
                };
            }

            // Normalize category
            const normalizedCategory = 
                typeof category === 'string' 
                    ? category 
                    : category?.id 
                    ? category.id 
                    : category?.label 
                    ? category.label 
                    : 'others';

            const newItem = {
                id: randomUUID(),
                name: name.trim(),
                quantity: quantity || 1,
                unit: typeof unit === 'object' ? unit.id : unit || 'unit',
                estimatedPrice: estimatedPrice || null,
                category: normalizedCategory,
                notes: note || '',
                checked: false,
                addedToStock: false,
                addedAt: new Date().toISOString()
            };

            console.log('📝 New item object for list', targetList.name, ':', newItem);

            // Ensure targetList.items is always an array
            const currentItems = Array.isArray(targetList.items) ? targetList.items : [];
            
            // Verifica se o item já existe
            const existingItemIndex = currentItems.findIndex(
                item => item.name.toLowerCase().trim() === name.toLowerCase().trim()
            );

            let updatedItems;
            if (existingItemIndex !== -1) {
                console.log('📝 Item already exists in target list, updating quantity');
                updatedItems = [...currentItems];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: quantity || updatedItems[existingItemIndex].quantity,
                    unit: typeof unit === 'object' ? unit.id : unit || updatedItems[existingItemIndex].unit,
                    notes: note || updatedItems[existingItemIndex].notes,
                    updatedAt: new Date().toISOString()
                };
            } else {
                console.log('🆕 Adding new item to target list');
                updatedItems = [...currentItems, newItem];
            }

            console.log('🔄 Updating Firebase document for list:', targetList.name);
            
            // Atualiza no Firebase
            const docRef = doc(db, 'shoppingLists', listId);
            await updateDoc(docRef, {
                items: updatedItems,
                updatedAt: serverTimestamp()
            });

            console.log('✅ Firebase document updated successfully for:', targetList.name);

            // Update local state - both lists array and currentList if needed
            const updatedTargetList = {
                ...targetList,
                items: updatedItems,
                updatedAt: new Date()
            };

            setLists(prevLists =>
                prevLists.map(list =>
                    list.id === listId
                    ? updatedTargetList
                    : list
                )
            );

            // Update currentList if it's the same as target
            if (currentList?.id === listId) {
                setCurrentList(updatedTargetList);
            }

            console.log('✅ Local state updated successfully for:', targetList.name);
            console.log('📊 Total items in target list:', updatedItems.length);

            return { 
                success: true, 
                item: newItem,
                updatedItems: updatedItems,
                targetList: updatedTargetList
            };
        } catch (error) {
            console.error('❌ Failed to add item to specific list:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * ✅ CORRIGIDO: Add a new item to the current Shopping List
     */
    const addItem = async (name, quantity, unit, estimatedPrice, category, note) => {
        try {
            console.log('➕ Adding item to current list:', {
                itemName: name,
                quantity,
                unit,
                currentListName: currentList?.name,
                currentListId: currentList?.id
            });

            if (!currentList) {
                console.error('❌ No list selected');
                return { success: false, error: 'No list selected' };
            }

            // Normalize category with more checks
            const normalizedCategory = 
                typeof category === 'string' 
                    ? category 
                    : category?.id 
                    ? category.id 
                    : category?.label 
                    ? category.label 
                    : 'others';

            const newItem = {
                id: randomUUID(),
                name: name.trim(),
                quantity: quantity || 1,
                unit: typeof unit === 'object' ? unit.id : unit || 'unit',
                estimatedPrice: estimatedPrice || null,
                category: normalizedCategory,
                notes: note || '',
                checked: false,
                addedToStock: false,
                addedAt: new Date().toISOString()
            };

            console.log('📝 New item object:', newItem);

            // Ensure currentList.items is always an array
            const currentItems = Array.isArray(currentList.items) ? currentList.items : [];
            
            // Verifica se o item já existe (evita duplicatas)
            const existingItemIndex = currentItems.findIndex(
                item => item.name.toLowerCase().trim() === name.toLowerCase().trim()
            );

            let updatedItems;
            if (existingItemIndex !== -1) {
                // Item já existe, atualiza quantidade
                console.log('📝 Item already exists, updating quantity');
                updatedItems = [...currentItems];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: quantity || updatedItems[existingItemIndex].quantity,
                    unit: typeof unit === 'object' ? unit.id : unit || updatedItems[existingItemIndex].unit,
                    notes: note || updatedItems[existingItemIndex].notes,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // Novo item
                console.log('🆕 Adding new item');
                updatedItems = [...currentItems, newItem];
            }

            console.log('🔄 Updating Firebase document...');
            
            // Atualiza no Firebase
            const docRef = doc(db, 'shoppingLists', currentList.id);
            await updateDoc(docRef, {
                items: updatedItems,
                updatedAt: serverTimestamp()
            });

            console.log('✅ Firebase document updated successfully');

            // Update local state
            const updatedList = {
                ...currentList,
                items: updatedItems,
                updatedAt: new Date()
            };

            setCurrentList(updatedList);
            setLists(prevLists =>
                prevLists.map(list =>
                    list.id === currentList.id
                    ? updatedList
                    : list
                )
            );

            console.log('✅ Local state updated successfully');
            console.log('📊 Total items in list:', updatedItems.length);

            return { success: true, item: newItem };
        } catch (error) {
            console.error('❌ Failed to add item:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * ✅ CORRIGIDO: Função otimizada para adicionar múltiplos ingredientes
     */
    const addMultipleItems = async (ingredients, targetListId = null) => {
        try {
            setIsAddingItems(true);
            console.log('🛒 Starting to add multiple items:', ingredients.length);
            console.log('🎯 Target list ID:', targetListId);
            console.log('📋 Current list ID before switch:', currentList?.id);
            
            let workingList = currentList;
            
            // Se foi especificado um ID de lista, seleciona ela primeiro
            if (targetListId && targetListId !== currentList?.id) {
                console.log('📋 Switching to target list:', targetListId);
                const selectResult = await selectList(targetListId);
                console.log('🔄 Select result:', selectResult);
                
                if (!selectResult.success) {
                    throw new Error('Failed to select target list: ' + selectResult.error);
                }
                
                // ✅ CRÍTICO: Aguarda mais tempo e força o uso da lista retornada
                await new Promise(resolve => setTimeout(resolve, 500));
                workingList = selectResult.list;
                
                // ✅ VERIFICAÇÃO: Garante que a lista foi realmente selecionada
                let attempts = 0;
                while ((!currentList || currentList.id !== targetListId) && attempts < 5) {
                    console.log(`⏳ Waiting for list selection... attempt ${attempts + 1}`);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    attempts++;
                }
                
                if (currentList?.id !== targetListId) {
                    console.error('❌ Failed to switch to target list after multiple attempts');
                    console.log('📋 Current list ID:', currentList?.id);
                    console.log('🎯 Target list ID:', targetListId);
                    // Força o uso da lista de trabalho
                    workingList = selectResult.list;
                }
            }

            if (!workingList) {
                throw new Error('No working list available');
            }

            console.log('📝 Working list confirmed:', workingList.name, '(ID:', workingList.id, ')');
            console.log('📦 Working list items count:', workingList.items?.length || 0);

            const addedItems = [];
            const failedItems = [];

            // ✅ CRÍTICO: Atualiza o currentList para a working list antes de adicionar
            if (workingList.id !== currentList?.id) {
                console.log('🔄 Forcing current list update to working list');
                setCurrentList(workingList);
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Adiciona ingredientes sequencialmente diretamente à working list
            for (let i = 0; i < ingredients.length; i++) {
                const ingredient = ingredients[i];
                console.log(`➕ Adding ingredient ${i + 1}/${ingredients.length}:`, ingredient.name);
                console.log(`📋 Using list: ${workingList.name} (ID: ${workingList.id})`);

                try {
                    // ✅ USAR: addItemToSpecificList em vez de addItem genérico
                    const result = await addItemToSpecificList(
                        workingList.id,
                        ingredient.name,
                        ingredient.quantity || 1,
                        ingredient.unit || 'unit',
                        null, // estimatedPrice
                        'food', // category
                        ingredient.notes || `From recipe` // note
                    );

                    if (result.success) {
                        addedItems.push(ingredient.name);
                        console.log(`✅ Successfully added: ${ingredient.name}`);
                        // Atualiza a working list localmente
                        workingList.items = result.updatedItems || workingList.items;
                    } else {
                        failedItems.push({ name: ingredient.name, error: result.error });
                        console.error(`❌ Failed to add: ${ingredient.name}`, result.error);
                    }

                    // Pequena pausa entre adições para evitar conflitos
                    if (i < ingredients.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 150));
                    }
                } catch (itemError) {
                    console.error(`❌ Error adding ${ingredient.name}:`, itemError);
                    failedItems.push({ name: ingredient.name, error: itemError.message });
                }
            }

            console.log(`📊 Addition complete: ${addedItems.length} success, ${failedItems.length} failed`);

            return {
                success: addedItems.length > 0,
                addedCount: addedItems.length,
                totalCount: ingredients.length,
                addedItems,
                failedItems
            };

        } catch (error) {
            console.error('❌ Error in addMultipleItems:', error);
            return {
                success: false,
                error: error.message,
                addedCount: 0,
                totalCount: ingredients.length,
                addedItems: [],
                failedItems: ingredients.map(ing => ({ name: ing.name, error: error.message }))
            };
        } finally {
            setIsAddingItems(false);
        }
    };

    /**
     * Remove an item from the current Shopping List
     */
    const removeItem = async (itemId) => {
        console.log("removeItem called with itemId:", itemId);
        
        if (!currentList) {
            console.log("No shopping list selected");
            return { success: false, error: 'No shopping list selected' };
        }

        setLoading(true);
        setError(null);
        try {
            // Make sure we have an array to work with
            const currentItems = Array.isArray(currentList.items) ? currentList.items : [];
            console.log("Current items count before removal:", currentItems.length);
            
            // Find the item to ensure it exists
            const itemToRemove = currentItems.find(item => item.id === itemId);
            if (!itemToRemove) {
                console.log(`Item with id ${itemId} not found`);
                setLoading(false);
                return { success: false, error: 'Item not found' };
            }
            
            // Remove item from current list
            const updatedItems = currentItems.filter(item => item.id !== itemId);
            console.log("Items count after removal:", updatedItems.length);

            // Update document in Firestore
            const listRef = doc(db, 'shoppingLists', currentList.id);
            await updateDoc(listRef, {
                items: updatedItems,
                updatedAt: serverTimestamp()
            });
            console.log("Firestore document updated");

            // Update the local state
            const updatedList = {
                ...currentList,
                items: updatedItems,
                updatedAt: new Date()
            };

            console.log("Updating current list");
            setCurrentList(updatedList);

            console.log("Updating lists array");
            setLists(prev => prev.map(list => 
                list.id === currentList.id ? updatedList : list
            ));

            console.log("Item removal completed successfully");
            return { success: true };
        } catch (error) {
            console.error("Error in removeItem:", error);
            const handled = handleError(error, { title: 'Failed to remove item' });
            setError(handled.message);
            return { success: false, error: handled.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update an item from the current Shopping List
     */
    const updateItem = async (itemId, itemData) => {
        if (!currentList) {
            return { success: false, error: 'No shopping list selected' };
        }
    
        setLoading(true);
        setError(null);
        try {
            // Normalize category if present
            if (itemData.category) {
                itemData.category = 
                    typeof itemData.category === 'string' 
                        ? itemData.category 
                        : itemData.category?.id 
                        ? itemData.category.id 
                        : itemData.category?.label 
                        ? itemData.category.label 
                        : 'others';
            }
            // If you are updating unit
            if (itemData.unit && typeof itemData.unit === 'object') {
                itemData.unit = itemData.unit.id;
            }
    
            // Ensure items is always an array
            const currentItems = Array.isArray(currentList.items) ? currentList.items : [];
            
            // Update item in current list
            const updatedItems = currentItems.map(item =>
                item.id === itemId ? { ...item, ...itemData } : item
            );
    
            // Update document in firestore
            const listRef = doc(db, 'shoppingLists', currentList.id);
            await updateDoc(listRef, {
                items: updatedItems,
                updatedAt: serverTimestamp()
            });
    
            // Update the local state
            const updatedList = {
                ...currentList,
                items: updatedItems,
                updatedAt: new Date()
            };
    
            setCurrentList(updatedList);
    
            // Update the list in the lists array
            setLists(prev => prev.map(list =>
                list.id === currentList.id ? updatedList : list
            ));
    
            return { success: true };
        } catch (error) {
            const handled = handleError(error, { title: 'Failed to update item' });
            setError(handled.message);
            return { success: false, error: handled.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Mark or unmark an item as completed
     */
    const toggleItemChecked = async (itemId, checked) => {
        console.log("toggleItemChecked called with:", itemId, checked);
        return updateItem(itemId, { checked });
    };

    /**
     * Mark or unmark an item as added to stock
     */
    const toggleAddToStock = async (itemId, addedToStock) => {
        return updateItem(itemId, { addedToStock });
    };

    /**
     * Delete a shopping list
     */
    const deleteList = async (listId) => {
        setLoading(true);
        setError(null);
        try {
            // Delete list from Firestore
            await deleteDoc(doc(db, 'shoppingLists', listId));

            // Remove the list from local state
            const updatedLists = lists.filter(list => list.id !== listId);
            setLists(updatedLists);

            // Update the current list if needed
            if (currentList && currentList.id === listId) {
                if (updatedLists.length > 0) {
                    setCurrentList(updatedLists[0]);
                } else {
                    setCurrentList(null);
                }
            }

            return { success: true };
        } catch (error) {
            const handled = handleError(error, { title: 'Failed to delete list' });
            setError(handled.message);
            return { success: false, error: handled.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update the name or properties of a shopping list
     */
    const updateList = async (listId, updatedFields) => {
        setLoading(true);
        setError(null);
    
        try {
        const listRef = doc(db, 'shoppingLists', listId);
        await updateDoc(listRef, {
            ...updatedFields,
            updatedAt: serverTimestamp(),
        });
    
        const updatedLists = lists.map((list) =>
            list.id === listId
            ? {
                ...list,
                ...updatedFields,
                updatedAt: new Date(), // Update local timestamp
                }
            : list
        );
    
        setLists(updatedLists);
    
        // Update currentList if it's the one being edited
        if (currentList?.id === listId) {
            setCurrentList({
            ...currentList,
            ...updatedFields,
            updatedAt: new Date(),
            });
        }
    
        return { success: true };
        } catch (error) {
        const handled = handleError(error, { title: 'Failed to update list' });
        setError(handled.message);
        return { success: false, error: handled.message };
        } finally {
        setLoading(false);
        }
    };

    // ✅ NOVO: Função de debug para verificar estado
    const debugState = () => {
        console.log('🔍 ShoppingList Context Debug:');
        console.log('Lists count:', lists.length);
        console.log('Lists:', lists.map(l => ({ id: l.id, name: l.name, itemCount: l.items?.length || 0 })));
        console.log('Current list:', currentList ? { id: currentList.id, name: currentList.name, itemCount: currentList.items?.length || 0 } : 'None');
        console.log('Loading:', loading);
        console.log('Adding items:', isAddingItems);
        console.log('Error:', error);
    };

    // Value to be available in the context
    const value = {
        // State
        lists,
        currentList,
        loading,
        error,
        isAddingItems, // ✅ NOVO

        // Original functions
        sortItems,
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

        // ✅ NOVAS funções
        addMultipleItems,
        addItemToSpecificList, // ✅ NOVA função específica
        debugState
    };

    return (
        <ShoppingListContext.Provider value={value}>
            {children}
        </ShoppingListContext.Provider>
    );
};