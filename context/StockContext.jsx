import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config';
import { createStockItemObject } from '@/firebase/models';
import { handleError } from '@/errors/errorHandler';

//create stock context
export const StockContext = createContext();

export const StockProvider = ({ children }) => {
    //get authentication state
    const { user, isAuthenticated } = useContext(AuthContext);

    //stock state
    const [stockItems, setStockItems] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    //load stock items when the user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchStockItems();
        } else {
            //clean data when the user is logout
            setStockItems([]);
            setLowStockItems([]);
        }
    }, [isAuthenticated]);

    //update items with low stock always the stock changed
    useEffect (() => {
        //filter items with minimum quantity
        const lowItems = stockItems.filter(item => item.quantity <= item.minQuantity);
        setLowStockItems(lowItems);
    }, [stockItems]);

    /**
     * fetch all items from user's stock
     */
    const fetchStockItems = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!user) return;
            
            // Modification: Use two separate queries instead of trying to sort by multiple columns
            // without the composite index
            const q = query(
                collection(db, 'stockItems'),
                where('userId', '==', user.uid)
            );

            const querySnapshot = await getDocs(q);
            const items = [];

            querySnapshot.forEach((doc) => {
                items.push({
                    id: doc.id,
                    ...doc.data(),
                    //convert timestamp to date
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate(),
                    expiryDate: doc.data().expiryDate?.toDate(),
                });
            });

            // Sort on the client instead of the server
            items.sort((a, b) => {
                // First by category
                const categoryComparison = (a.category || '').localeCompare(b.category || '');
                if (categoryComparison !== 0) return categoryComparison;
                
                // Then by name
                return a.name.localeCompare(b.name);
            });

            setStockItems(items);
        } catch (error) {
            const handled = handleError(error, { title: 'Failed to fetch items from the stock' });
            setError(handled.message);
            return { success: false, error: handled.message };
            
        } finally {
            setLoading(false);
        }
    };

    /**
     * add new item to stock
     * @param {string} name - item name
     * @param {number} quantity - item quantity
     * @param {string} unit - unit
     * @param {number} minQuantity - minimum quantity
     * @param {string} category - item category
     * @param {object} additionalData - additional data
     * @return {Promise} - Promise operation result
     */
    const addStockItem = async (name, quantity, unit, minQuantity, category = '', additionalData = {}) => {
        setLoading(true);
        setError(null);
        try {
            //create item
            const itemData = createStockItemObject(
                user.uid,
                name,
                quantity,
                unit,
                Number(minQuantity || Math.max(1, Math.floor(quantity * 0.2)))
              );

            //add category and other data
            const finalItemData = {
                ...itemData,
                category,
                ...additionalData
            };

            //add to firestore
            const docRef = await addDoc(collection(db, 'stockItems'), {
                ...finalItemData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastPurchaseDate: serverTimestamp()
            });

            //get doc create current
            const newItem = {
                id: docRef.id,
                ...finalItemData,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastPurchaseDate: new Date()
            };

            //update state
            setStockItems(prev => [...prev, newItem]);

            return { success: true, item: newItem};
        } catch (error) {
            const handled = handleError(error, { title: 'Failed to add item to stock' });
            setError(handled.message);
            return { success: false, error: handled.message };
            
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update item in stock
     * @param {string} itemId - item id
     * @param {object} itemData - new item data
     * @returns {Promise} - Promise operation result
     */
    const updateStockItem = async (itemId, itemData) => {
        setLoading(true);
        setError(null);
        try {
            //remove fields do not need update directly
            const { createdAt, userId, ...updatableData } = itemData;

            //update document in firestore
            const itemRef = doc(db, 'stockItems', itemId);
            await updateDoc(itemRef, {
                ...updatableData,
                updatedAt: serverTimestamp()
            });

            //update local state
            setStockItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, ...updatableData, updatedAt: new Date() } : item
            ));

            return { success: true };
        } catch (error) {
            const handled = handleError(error, { title: 'Failed to update item to the stock' });
            setError(handled.message);
            return { success: false, error: handled.message };
            
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update item quantity in stock
     * @param {string} itemId - item id
     * @param {number} newQuantity - new quantity
     * @returns {Promise} - Promise operation results
     */
    const updateItemQuantity = async (itemId, newQuantity) => {
        return updateStockItem(itemId, {quantity: newQuantity });
    };

    /**
     * add shopping list items to stock
     * @param {Array} items - shopping list items
     * @return {Promise} - Promise operation results
     */
    const addListItemsToStock = async (items) => {
        setLoading(true);
        setError(null);
        try {
            const results = [];

            //process every shopping list item
            for (const item of items) {
                //check the item exist in stock
                const existingItem = stockItems.find(stockItem =>
                    stockItem.name.toLowerCase() === item.name.toLowerCase() && stockItem.unit === item.unit
                );

                if (existingItem) {
                    //update existing item
                    const newQuantity = existingItem.quantity + item.quantity;
                    const result = await updateStockItem(existingItem.id, {
                        quantity: newQuantity,
                        lastPurchaseDate: new Date(),
                        lastPurchasePrice: item.estimatedPrice
                    });
                    results.push({ ...result, item: existingItem.name, action: 'updated' });
                } else {
                    //create a new item
                    const result = await addStockItem(
                        item.name,
                        item.quantity,
                        item.unit,
                        Math.max(1, Math.floor(item.quantity * 0.2)), // define minimun of 20% of quantity or 1
                        item.category || '',
                        {
                            lastPurchasePrice: item.estimatedPrice,
                            notes: `Added to Shopping list`
                        }
                    );
                    results.push({ ...result, item: item.name, action: 'added' });
                }
            }

            return {
                success: true, results,
                added: results.filter(r => r.action === 'added').length,
                updated: results.filter(r => r.action === 'updated').length
            };
        } catch (error) {
            const handled = handleError(error, { title: 'Failed to create additional items to the stock' });
            setError(handled.message);
            return { success: false, error: handled.message };
            
        } finally {
            setLoading(false);
        }
    };

    /**
     * remove an item from stock
     * @param {string} itemId - id of item
     * @returns {Promise} - Promise operation results
     */
    const removeStockItem = async (itemId) => {
        setLoading(true);
        setError(null);
        try {
            //remove item from firestore
            await deleteDoc(doc(db, 'stockItems', itemId));

            //update local state
            setStockItems(prev => prev.filter(item => item.id !== itemId));

            return { success: true };
        } catch (error) {
            const handled = handleError(error, { title: 'Failed to remove item from the stock' });
            setError(handled.message);
            return { success: false, error: handled.message };
            
        } finally {
            setLoading(false);
        }
    };

    /**
     * fetching specific item from stock
     * @param {string} itemId - id of item
     * @returns {Promise} - Promise with item
     */
    const getStockItem = async (itemId) => {
        setLoading(true);
        setError(null);
        try {
            //first, try to find local state
            const localItem = stockItems.find(item => item.id === itemId);
            if (localItem) {
                return { success: true, item: localItem };
            }

            //if not found, fetching in firestore
            const docSnap = await getDoc(doc(db, 'stockItems', itemId));
            if (docSnap.exists()) {
                const itemData = {
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt?.toDate(),
                    updatedAt: docSnap.data().updatedAt?.toDate(),
                    expiryDate: docSnap.data().expiryDate?.toDate(),
                    lastPurchaseDate: docSnap.data().lastPurchaseDate?.toDate()
                };
                return { success: true, item: itemData };
            } else {
                return { success: false, error: 'item not found'};
            }
        } catch (error) {
            const handled = handleError(error, { title: 'Failed to fetch item from the stock' });
            setError(handled.message);
            return { success: false, error: handled.message };
                        
        } finally {
            setLoading(false);
        }
    };

    // Function to get items with low stock
const getLowStockItems = () => {
    return stockItems.filter(item => item.quantity <= item.minQuantity);
};

// Function to get items close to expiration date
const getExpiringItems = () => {
    const today = new Date();
    const warningDays = 7; // Notice period for expiring items
    const warningDate = new Date(today.setDate(today.getDate() + warningDays));
    
    return stockItems.filter(item => 
        item.expiryDate && new Date(item.expiryDate) <= warningDate
    );
};

// Function to sort stock items
const sortStockItems = (sortBy = 'name') => {
    const sortedItems = [...stockItems];
    
    switch (sortBy) {
        case 'name':
            sortedItems.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'quantity':
            sortedItems.sort((a, b) => a.quantity - b.quantity);
            break;
        case 'expiry':
            sortedItems.sort((a, b) => {
                if (!a.expiryDate) return 1;
                if (!b.expiryDate) return -1;
                return new Date(a.expiryDate) - new Date(b.expiryDate);
            });
            break;
        case 'category':
            sortedItems.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
            break;
        case 'location':
            sortedItems.sort((a, b) => (a.location || '').localeCompare(b.location || ''));
            break;
        default:
            break;
    }
    
    setStockItems(sortedItems);
    return sortedItems;
};


    //values to be available by context
    const value ={
        stockItems,
        lowStockItems,
        loading,
        error,
        fetchStockItems,
        addStockItem,
        updateStockItem,
        updateItemQuantity,
        addListItemsToStock,
        removeStockItem,
        getStockItem,
        getLowStockItems,
        getExpiringItems,
        sortStockItems
    };

    return (
        <StockContext.Provider value={value}>
            {children}
        </StockContext.Provider>
    );
}