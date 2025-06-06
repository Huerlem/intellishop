import {
    collection,
    doc, setDoc,
    addDoc, getDoc, getDocs,
    updateDoc, deleteDoc,
    query, where, orderBy,
    limit, startAfter,
    serverTimestamp,
    writeBatch, increment
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/firebase/config';
import { handleError } from '@/errors/errorHandler';

const id = uuidv4();

/**
 * generic function to handle documentation
 */

/**
 * add a new docuumen with ID auto-generated
 * @param {string} collectionName - name of the collection
 * @param {object} data - data to be added  
 * @returns {Promise} - Promise object represents the document reference
 */
export const addDocument = async (collectionName, data) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        const handled = handleError(error, { title: `Error adding document to ${collectionName}` });
        return { success: false, error: handled.message };
    }
};

/**
 * create a new document with a custom ID
 * @param {string} collectionName - name of the collection
 * @param {string} docId - custom document ID
 * @param {object} data - data to be added
 * @param {boolean} merge - merge the data with existing document
 * @returns {Promise} - Promise object represents the document reference
 */
export const setDocument = async (collectionName, docId, data, merge = true) => {
    try {
        await setDoc(doc(db, collectionName, docId), {
            ...data,
            updatedAt: serverTimestamp()
        }, {merge});
        return { success: true, id: docId};
    } catch (error) {
        const handled = handleError(error, { title: `Error setting document ${docId} in ${collectionName}` });
        return { success: false, error: handled.message };
    }
};

/**
 * get a single document by ID
 * @param {string} collectionName - name of the collection
 * @param {string} docId - document ID
 * @returns {Promise} - Promise object represents the document reference
 */
export const getDocument = async (collectionName, docId) => {
    try {
        const docSnap = await getDoc(doc(db, collectionName, docId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            return { success: true, data: { id: docSnap.id, ...data,
            
                //convert the timestamp to date
            createdAt: docSnap.data().createdAt.toDate(),
            updatedAt: docSnap.data().updatedAt.toDate()
            }
        };
            
        } else {
            return { success: false, error: 'Document not found'};
        }
    } catch ( error ) {
        const handled = handleError(error, { title: `Error getting document ${docId} from ${collectionName}` });
        return { success: false, error: handled.message };
    }
};

/**
 * update a existing document
 * @param {string} collectionName - name of the collection
 * @param {string} docId - document ID
 * @param {object} data - data to be updated
 * @returns {Promise} - Promise object represents the document reference
 */
export const updateDocument = async (collectionName, docId, data) => {
    try {
        await updateDoc(doc(db, collectionName, docId), {
            ...data,
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docId };
    } catch (error) {
        const handled = handleError(error, { title: `Error updating document ${docId} from ${collectionName}` });
        return { success: false, error: handled.message };
    }
};

/**
 * delete a existing document
 * @param {string} collectionName - name of the collection
 * @param {string} docId - document ID
 * @returns {Promise} - Promise object represents the document reference
 */
export const deleteDocument = async (collectionName, docId) => {
    try {
        await deleteDoc(doc(db, collectionName, docId));
        return {success: true, id: docId };
    } catch ( error ) {
        const handled = handleError(error, { title: `Error deleting document ${docId} from ${collectionName}` });
        return { success: false, error: handled.message };
    }
};

/**
 * get documents by filter, order and pagination
 * @param {string} collectionName - name of the collection
 * @param {array} filters - array of filter objects
 * @param {array} sortBy - array of order objects
 * @param {number} limitCount - number of documents to be returned
 * @param {object} startAfterDoc - document ID to start after
 * @returns {Promise} - Promise object represents the document reference
 */
export const queryDocuments = async (collectionName, filters = [], sortBy = [], limitCount = 20, startAfterDoc = null) => {
    try {
        let q = collection(db, collectionName);

        //add filters
        if ( filters && filters.length > 0) {
            const queryConstraints = filters.map(filter => {
                const [field, operator, value] = filter;
                return where(field, operator, value);
            });
            q = query(q, ...queryConstraints);
        }

        //add order by
        if(sortBy && sortBy.length > 0) {
            for (const sort of sortBy) {
                const [field, direction] = sortBy;
                q = query(q, orderBy(field, direction));
            }
        }

        //add pagination
        if (startAfterDoc) {
            q = query(q, limit(startAfterDoc));
        }

        //add limit
        if (limitCount) {
            q = query(q, limit(limitCount));
        }

        const querySnapshot = await getDocs(q);
        const docs = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            docs.push({id: doc.id, ...data,
                //convert the timestamp to date
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            });
        });

        return {
            success: true,
            data: docs,
            lastDoc: docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null
        };
    } catch (error) {
        const handled = handleError(error, { title: `Error querying document from ${collectionName}` });
        return { success: false, error: handled.message };
    }
};

/**
 * get all documents from a collection
 * @param {string} collectionName - name of the collection
 * @returns {Promise} - Promise object represents the document reference
 */
export const getAllDocuments = async (collectionName) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const docs = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            docs.push({id: docSnap.id, ...data,
                //convert the timestamp to date
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            });
        });
        return {success: true, data: docs };
    } catch (error) {
        const handled = handleError(error, { title: `Error getting all document from ${collectionName}` });
        return { success: false, error: handled.message };
    }
};

/**
 * execute multiple operations in a batch
 * @param {array} operations - array of operations
 * @returns {Promise} - Promise object represents the document reference
 */
export const batchOperations = async (operations) => {
    try {
        const batch = writeBatch(db);

        for (const operation of operations) {
            const { type, collectionName, docId, data } = operation;
            const docRef = doc(db, collectionName, docId);

            if (type === 'set') {
                batch.set(docRef, {
                    ...data,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } else if  (type === 'update') {
                batch.update(docRef, {
                    ...data,
                    updatedAt: serverTimestamp()
                });
            } else if (type === 'delete') {
                batch.delete(docRef);
            } else if (type === 'increment') {
                const { field, value } = data;
                batch.update(docRef, {
                    [field]: increment(value),
                    updatedAt: serverTimestamp()
                });
            }
        }

        await batch.commit();
        return { success: true };
    } catch (error) {
        const handled = handleError(error, { title: 'Error batching documents' });
        return { success: false, error: handled.message };
    }
};

/**
 * Specialized function to increment a field in a document
 */

/**
 * SHOPPING LIST
 */

/**
 * create a new shopping list
 * @param {string} userId - user ID
 * @param {string} name - name of the list
 * @param {boolean} isAIGenerated - if the list is generated by AI
 * @param {number} budget - budget of the list
 * @returns {Promise} - Promise object represents the document reference
 */
export const createShoppingList = async (userId, name, isAIGenerated = false, budget = null) => {
    try {
        const listData = {
            userId,
            name,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isActive: true,
            isAIGenerated,
            totalBudget: budget,
            items: []
        };

        const result = await addDocument('shoppingLists', listData);

        if (result.success) {
            //Action User resgistered
            await addDocument ('userActions', {
                userId,
                action: 'create_shopping_list',
                details: {
                    listId: result.id,
                    name,
                    isAIGenerated
                }
            });

            //return timestamp converted to date
            return {
                success: true,
                list: {
                    id: result.id,
                    ...listData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            };
        } else {
            return result;
        }
    } catch (error) {
        const handled = handleError(error, { title: 'Error creating shopping list' });
        return { success: false, error: handled.message };
    }
};

/**
 * get all shopping lists of a user
 * @param {string} userId - user ID
 * @param {boolean} activeOnly - get only active lists
 * @returns {Promise} - Promise object represents the document reference
 */
export const getUserShoppingLists = async (userId, activeOnly = true) => {
    try {
        let filters = [['userId', '==', userId]];

        if (activeOnly) {
            filters.push(['isActive', '==', true]);
        }

        return await queryDocuments('shoppingLists', filters, [['updatedAt', 'desc']], 50);
    } catch (error) {
        const handled = handleError(error, { title: 'Error getting user shopping list' });
        return { success: false, error: handled.message };    
    }
};

/**
 * add a new item to a shopping list
 * @param {string} listId - shopping list ID
 * @param {object} item - item data
 * @returns {Promise} - Promise object represents the document reference
 */
export const addItemToShoppingList = async (listId, item) => {
    try {
        //get the list, first
        const listResult = await getDocument('shoppingLists', listId);

        if (!listResult.success) {
            return listResult;
        }

        const list = listResult.data;
        const items = [...(list.items || [])];

        //add new item
        items.push(item);

        //update the list
        return await updateDocument('shoppingLists', listId, { items });
    } catch (error) {
        const handled = handleError(error, { title: 'Error adding item to shopping list' });
        return { success: false, error: handled.message };
    }
};

/**
 * update an item in a shopping list
 * @param {string} listId - shopping list ID
 * @param {string} itemId - item ID
 * @param {object} updatedData - updated item data
 * @returns {Promise} - Promise object represents the document reference
 */
export const updateShoppingListItem = async (listId, itemId, updatedData) => {
    try {
        //get the list, first
        const listResult = await getDocument('shoppingLists', listId);

        if (!listResult.success) {
            return listResult;
        }

        const list = listResult.data;
        const items = [...(list.items || [])];

        //find the item and update
        const itemIndex = items.findIndex(item => item.id === itemId);

        if (itemIndex === -1) {
            return { success: false, error: 'Item not found in list' };
        }

        items[itemIndex] = { ...items[itemIndex], ...updatedData };

        //update the list
        return await updateDocument('shoppingLists', listId, { items });
    } catch (error) {
        const handled = handleError(error, { title: 'Error updating item to shopping list' });
        return { success: false, error: handled.message };
    }
};

/**
 * delete an item from a shopping list
 * @param {string} listId - shopping list ID
 * @param {string} itemId - item ID
 * @returns {Promise} - Promise object represents the document reference
 */
export const removeItemFromShoppingList = async (listId, itemId) => {
    try {
        //get the list, first
        const listResult = await getDocument('shoppingLists', listId);

        if(!listResult.success) {
            return listResult;
        }

        const list = listResult.data;

        //filter out the item to be removed
        const items = (list.items || []).filter(item => item.id !== itemId);

        //update the list
        return await updateDocument('shoppingLists', listId, { items });
    } catch (error) {
        const handled = handleError(error, { title: 'Error removing item from shopping list' });
        return { success: false, error: handled.message }; 
    }
};

/**
 * INVENTORY MANAGEMENT
 */

/**
 * add a new item to inventory
 * @param {object} item - item data
 * @returns {Promise} - Promise object represents the document reference
 */
export const addStockItem = async (item) => {
    try {
        return await addDocument('stockItems', item);
    } catch (error) {
        const handled = handleError(error, { title: 'Error adding item to stock' });
        return { success: false, error: handled.message };
    }
};

/**
 * get all stock items of a user
 * @param {string} userId - user ID
 * @returns {Promise} - Promise object represents the document reference
 */
export const getUserStockItems = async (userId) => {
    try {
        return await queryDocuments('stockItems', [['userId', '==', userId]],
            [['category', 'asc'], ['name', 'asc']], 100
        );
    } catch (error) {
        const handled = handleError(error, { title: 'Error getting all user items from stock' });
        return { success: false, error: handled.message };
    }
};

/**
 * get item of stock with low-level quantity
 * @param {string} userId - user ID
 * @returns {Promise} - Promise object represents the document reference
 */
export const getLowStockItems = async (userId) => {
    try {
        const result = await getUserStockItems(userId);

        if (!result.success) {
            return result;
        }

        // filter items with quantity less than 5
        const lowStockItems = result.data.filter(item => item.quantity <= item.minQuantity);

        return { sucess: true, data: lowStockItems };
    } catch (error) {
        const handled = handleError(error, { title: 'Error getting low stock item' });
        return { success: false, error: handled.message };
    }
};

/**
 * update an quantity of stock item
 * @param {string} itemId - item ID
 * @param {number} quantity - updated quantity
 * @returns {Promise} - Promise object represents the document reference
 */
export const updateStockItemQuantity = async (itemId, newQuantity) => {
    try {
        return await updateDocument('stockItems', itemId, {
            quantity: newQuantity,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        const handled = handleError(error, { title: 'Error updating quantity item from stock' });
        return { success: false, error: handled.message };
    }
};

/**
 * add item from a shopping list to inventory
 * @param {string} userId - user ID
 * @param {Array} items - items from shopping list
 * @returns {Promise} - Promise object represents the document reference
 */
export const addListItemsToStock = async (userId, items) => {
    try {
        //get all stock items of the user, first
        const stockResult = await queryDocuments('stockItems', [['userId', '==', userId]]

        );

        if (!stockResult.success) {
            return stockResult;
        }

        const stockItems = stockResult.data;
        const operations = [];
        const results =[];

        //loop through the items
        for (const item of items) {
            //check if the item already exists in stock
            const existingItem = stockItems.find(stockItem =>
                stockItem.name.toLowerCase() === item.name.toLowerCase() &&
                stockItem.unit === item.unit
            );

            if (existingItem) {
                //update item existing
                const newQuantity = existingItem.quantity + item.quantity;
                operations.push({
                    type: 'update',
                    collectionName: 'stockItems',
                    docId: existingItem.id,
                    data: {
                        quantity: newQuantity,
                        lastPurchaseDate: new Date(),
                        lastPurchasePrice: item.estimatedPrice,
                        updatedAt: serverTimestamp()
                    }
                });

                results.push({
                    item: item.name,
                    action: 'updated',
                    quantity: newQuantity
                });
            } else {
                //create a new item in inventory
                const minQuantity = Math.max(1, Math.floor(item.quantity *0.2)); //20% quantity or 1

                const newItem = {
                    userId,
                    name: item.name,
                    category: item.category ||'',
                    quantity: item.quantity,
                    unit: item.unit,
                    minQuantity,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastPurchaseDate: serverTimestamp(),
                    lastPurchasePrice: item.estimatedPrice,
                    expiryDate: null,
                    image: '',
                    barcode: '',
                    notes: `Added from the shopping list`
                };

                //add item to inventory
                const addResult = await addDocument('stockItems', newItem);

                if (addResult.success) {
                    results.push({
                        item: item.name,
                        action: 'added',
                        id: addResult.id
                    });
                } else {
                    results.push ({
                        item: item.name,
                        action: 'failed',
                        error: addResult.error
                    });
                }
            }
        }

        //execute operation if there is update
        if (operations.length > 0) {
            await batchOperations(operations);
        }

        return {
            success: true,
            results,
            added: results.filter(r => r.action === 'added').length,
            updated: results.filter(r => r.action === 'updated').length,
            failed: results.filter(r => r.action === 'failed').length
        };
    } catch (error) {
        const handled = handleError(error, { title: 'Error adding shopping list item to stock' });
        return { success: false, error: handled.message };
    }
};

/**
 * AI SUGGESTIONS
 */

/**
 * save AI suggestion shopping list
 * @param {string} userId - user ID
 * @param {string} name - name of the list
 * @param {Array} items - items in the list
 * @param {number} budget - budget of the list
 * @param {number} totalEstimatedCost - total estimated cost
 * @returns {Promise} - Promise object represents the document reference
 */
export const saveAISuggestion = async (userId, budget, items, totalEstimatedCost) => {
    try {
        const suggestionData = {
            userId,
            createdAt: serverTimestamp(),
            budget,
            items,
            totalEstimatedCost,
            status: 'pending',
            convertedToShoppingList: false,
            shoppingListId: null
        };

        return await addDocument('aiSuggestions', suggestionData);
    } catch (error) {
        const handled = handleError(error, { title: 'Error saving AI Suggestion' });
        return { success: false, error: handled.message };
    }
};

/**
 * get all AI suggestions of a user
 * @param {string} userId - user ID
 * @param {number} count - number of suggestions to be returned
 * @returns {Promise} - Promise object represents the document reference
 */
export const getUserAISuggestions = async (userId, count = 10) => {
    try {
        return await queryDocuments('aiSuggestions', [['userId', '==', userId]],
            [['createdAt', 'desc']], count
        );
    } catch (error) {
        const handled = handleError(error, { title: 'Error getting user AI Suggestions' });
        return { success: false, error: handled.message };
    }
};

/**
 * update status of AI suggestion
 * @param {string} suggestionId - suggestion ID
 * @param {string} status - updated status
 * @param {string} shoppingListId - shopping list ID (if converted)
 * @returns {Promise} - Promise object represents the document reference
 */
export const updateAISuggestionsStatus = async (suggestionId, status, shoppingListId = null) => {
    try {
        const updateData = {
            status,
            updatedAt: serverTimestamp()
        };

        if (status === 'accepted' && shoppingListId) {
            updateData.convertedToShoppingList = true;
            updateData.shoppingListId = shoppingListId;
        }

        return await updateDocument('aiSuggestions', suggestionId, updateData);
    } catch (error) {
        const handled = handleError(error, { title: 'Error updating AI Suggestions Status' });
        return { success: false, error: handled.message };
    }
};

/**
 * RECIPES
 */


/**
 * save a new recipe
 * @param {object} recipeData - recipe data
 * @returns {Promise} - Promise object represents the document reference
 */
export const saveRecipe = async (recipeData) => {
    try {
        return await addDocument('recipes', {
            ...recipeData,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        const handled = handleError(error, { title: 'Error saving Recipes' });
        return { success: false, error: handled.message };
    }
};

/**
 * get all recipes of a user
 * @param {string} userId - user ID
 * @param {number} count - number of recipes to be returned
 * @returns {Promise} - Promise object represents the document reference
 */
export const getUserRecipes = async (userId, count = 10) => {
    try {
        return await queryDocuments('recipes', [['userId', '==', userId]],
            [['createdAt', 'desc']], count
        );
    } catch (error) {
        const handled = handleError(error, { title: 'Error getting User Recipes' });
        return { success: false, error: handled.message };
    }
};

/**
 * add ingredients missing to a shopping list from a recipe
 * @param {string} listId - shopping list ID
 * @param {Array} ingredients - ingredients from the recipe
 * @returns {Promise} - Promise object represents the document reference
 */
export const addRecipeIngredientsToList = async (listId, ingredients) => {
    try {
        //get the list, first
        const listResult = await getDocument('shoppinglists', listId);

        if (!listResult.success) {
            return listResult;
        }

        const list = listResult.data;
        const currentItems = list.items || [];
        const newItems = [];
        const updatedItems = [];

        //loop through the ingredients
        for (const ingredient of ingredients) {
            //check if the ingredient already exists in the list
            const existingItemIndex = currentItems.findIndex(item =>
                item.name.toLowerCase() === ingredient.name.toLowerCase() &&
                item.unit === ingredient.unit
            );

            if (existingItemIndex >= 0) {
                //update the quantity of the existing item
                const updatedItem ={
                    ...currentItems[existingItemIndex],
                    quantity: currentItems[existingItemIndex].quantity + ingredient.quantity
                }
                currentItems[existingItemIndex] = updatedItem;
                updatedItems.push(updatedItem);
            } else {
                //create a new item in the list
                const newItem = {
                    id: uuidv4(),
                    name: ingredient.name,
                    quantity: ingredient.quantity,
                    unit: ingredient.unit,
                    estimatedPrice: null,
                    checked: false,
                    addedToStock: false,
                    category: '',
                    notes: `Added from recipe`
                };

                currentItems.push(newItem);
                newItems.push(newItem);
            }
        }

        //update the list
        const updateResult = await updateDocument('shoppingLists', listId, {
            items: currentItems,
            updatedAt: serverTimestamp()
        });

        if (updateResult.success) {
            return {
                succes: true,
                added: newItems,
                updated: updatedItems
            };
        } else {
            return updateResult;
        }
    } catch (error) {
        const handled = handleError(error, { title: 'Error Adding Recipe ingredients to shopping list' });
        return { success: false, error: handled.message };
    }
};

/**
 * COMPARE PRICES
 */

/**
 * save a new price comparison
 * @param {string} userId - user ID
 * @param {string} itemName - name of the item
 * @param {Array} results - price comparison results
 * @returns {Promise} - Promise object represents the document reference
 */
export const savePriceComparison = async (userId, itemName, results) => {
    try {
        const comparisonData = {
            userId,
            itemName: itemName.toLowerCase().trim(),
            createdAt: serverTimestamp(),
            results: results.map(result => ({
                ...result,
                lastUpdated: serverTimestamp()
            }))
        };

        return await addDocument('priceComparisons', comparisonData);
    } catch (error) {
        const handled = handleError(error, { title: 'Error saving Price comparison' });
        return { success: false, error: handled.message };
    }
};

/**
 * get history of price comparison of an item
 * @param {string} userId - user ID
 * @param {number} count - number of comparisons to be returned
 * @returns {Promise} - Promise object represents the document reference
 */
export const getUserPriceComparisons = async (userId, count = 20) => {
    try {
        return await queryDocuments('priceComparisons',
            [['userId', '==', userId]],
            [['createdAt', 'desc']],
            count
        );
    } catch (error) {
        const handled = handleError(error, { title: 'Error getting user price comparison' });
        return { success: false, error: handled.message };
    }
};

/**
 * 🔧 FUNÇÃO CORRIGIDA: fetching comparison prices of a specific item
 * @param {string} userId - user ID
 * @param {string} itemName - name of the item
 * @returns {Promise} - Promise object represents the document reference
 */
export const getItemPriceComparison = async (userId, itemName) => {
    try {
        // ✅ VALIDAÇÕES INICIAIS
        if (!userId || !itemName) {
            return { 
                success: false, 
                error: 'Missing userId or itemName',
                data: []
            };
        }

        const normalizedItemName = itemName.toLowerCase().trim();
        
        console.log('🔍 Firebase: searching price comparison for:', normalizedItemName);
        
        const result = await queryDocuments('priceComparisons',
            [
                ['userId', '==', userId], 
                ['itemName', '==', normalizedItemName]
            ], 
            [['createdAt', 'desc']], // Ordenar por mais recente
            1 // Apenas o mais recente
        );

        if (!result.success) {
            console.warn('⚠️ Firebase query failed:', result.error);
            return { 
                success: false, 
                error: result.error,
                data: []
            };
        }

        if (!result.data || result.data.length === 0) {
            console.log('📭 No price comparison found in Firebase');
            return { 
                success: true, 
                data: [] 
            };
        }

        // ✅ PROCESSAR DADOS COM TIMESTAMP CONVERSION SEGURA
        const processedData = result.data.map(item => {
            const processed = { ...item };
            
            // Converter timestamps de forma segura
            try {
                if (item.createdAt) {
                    if (item.createdAt instanceof Date) {
                        processed.createdAt = item.createdAt;
                    } else if (item.createdAt.toDate && typeof item.createdAt.toDate === 'function') {
                        processed.createdAt = item.createdAt.toDate();
                    } else {
                        processed.createdAt = new Date(item.createdAt);
                    }
                } else {
                    processed.createdAt = new Date();
                }

                if (item.updatedAt) {
                    if (item.updatedAt instanceof Date) {
                        processed.updatedAt = item.updatedAt;
                    } else if (item.updatedAt.toDate && typeof item.updatedAt.toDate === 'function') {
                        processed.updatedAt = item.updatedAt.toDate();
                    } else {
                        processed.updatedAt = new Date(item.updatedAt);
                    }
                } else {
                    processed.updatedAt = new Date();
                }
            } catch (timestampError) {
                console.warn('⚠️ Timestamp conversion error:', timestampError);
                processed.createdAt = new Date();
                processed.updatedAt = new Date();
            }
            
            return processed;
        });

        console.log(`✅ Firebase: found ${processedData.length} price comparison(s)`);
        
        return { 
            success: true, 
            data: processedData 
        };

    } catch (error) {
        console.error('❌ Firebase getItemPriceComparison error:', error);
        const handled = handleError(error, { title: 'Error getting Item price comparisons' });
        return { 
            success: false, 
            error: handled.message,
            data: []
        };
    }
};

/**
 * USER ACTIONS
 */

/**
 * save a user action
 * @param {string} userId - user ID
 * @param {string} action - action name
 * @param {object} details - action details
 * @returns {Promise} - Promise object represents the document reference
 */
export const logUserAction = async (userId, action, details = {}) => {
    try {
        const actionData = {
            userId,
            action,
            timestamp: serverTimestamp(),
            details
        };

        return await addDocument('userActions', actionData);
    } catch (error) {
        const handled = handleError(error, { title: 'Error logging User Action' });
        return { success: false, error: handled.message };
    }
};

/**
 * get all user actions
 * @param {string} userId - user ID
 * @param {string} actionType - action type
 * @param {number} count - number of actions to be returned
 * @returns {Promise} - Promise object represents the document reference
 */
export const getuserActions = async (userId, actionType = null, count = 50) => {
    try {
        let filters = [['userId', '==', userId]];

        if (actionType) {
            filters.push(['action', '==', actionType]);
        }

        return await queryDocuments(
            'userActions', filters,
            [['timestamp', 'desc']],
            count
        );
    } catch (error) {
        const handled = handleError(error, { title: 'Error getting User Actions' });
        return { success: false, error: handled.message };
    }
};