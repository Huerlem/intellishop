import { db } from './firebase';
import { writeBatch, doc, serverTimestamp, increment } from 'firebase/firestore';
import { handleError } from '@/errors/errorHandler';

/**
 * utility class for firebase batch operations
 * Allow to perform multiple operations in a single batch
 */
export class FirestoreBatch {
    constructor() {
        this.batch = writeBatch(db);
        this.operationCount = 0;
        this.maxOperations = 500; //limit for batch operations
    }

    /**
     * create or update a document in the batch
     * @param {string} collectionName - collection name
     * @param {string} docId - document id
     * @param {object} data - document data
     * @param {boolean} merge - merge data
     * @returns {FirestoreBatch} - return this
     */
    set(collectionName, docId, data, merge = true) {
        this._checkLimit();

        const docRef = doc(db, collectionName, docId);
        this.batch.set(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        }, { merge });

        this.operationCount++;
        return this;
    }

    /**
     * update an existing document in the batch
     * @param {string} collectionName - collection name
     * @param {string} docId - document id
     * @param {object} data - document data
     * @returns {FirestoreBatch} - return this
     */
    update(collectionName, docId, data) {
        this._checkLimit();

        const docRef = doc(db, collectionName, docId);
        this.batch.update(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });

        this.operationCount++;
        return this;
    }

    /**
     * delete a document in the batch
     * @param {string} collectionName - collection name
     * @param {string} docId - document id
     * @returns {FirestoreBatch} - return this
     */
    delete(collectionName, docId) {
        this._checkLimit();

        const docRef = doc(db, collectionName, docId);
        this.batch.delete(docRef);

        this.operationCount++;
        return this;
    }

    /**
     * increment a field numeric value in a document
     * @param {string} collectionName - collection name
     * @param {string} docId - document id
     * @param {string} field - field name
     * @param {number} value - value to increment
     * @returns {FirestoreBatch} - return this
     */
    increment(collectionName, docId, field, value) {
        this._checkLimit();

        const docRef = doc(db, collectionName, docId);
        this.batch.update(docRef, {
            [field]: increment(value),
            updatedAt: serverTimestamp()
        });

        this.operationCount++;
        return this;
    }

    /**
     * check if the batch operations limit is reached
     * @private
     */
    _checkLimit() {
        if (this.operationCount >= this.maxOperations) {
            throw new Error(`Batch operation limit exceeded. Maximum is ${this.maxOperations}.`);
        }
    }

    /**
     * Execute the batch operations
     * @returns {Promise} - return a promise
     */
    async commit() {
        try {
            if (this.operationCount === 0) {
                return {success: true, message: 'No operations to commit'};
            }

            await this.batch.commit();
            return {success: true, operationsCount: this.operationCount};
        } catch (error) {
            const handled = handleError(error, {
                title: 'Batch Commit Error',
                logToAnalytics: true
              });
              return {
                success: false,
                error: handled.message,
                operationsCount: this.operationCount
              };
        }
    }
}

/**
 * Auxiliary function to create and excute an operation in a batch
 * @param {Function} batchOperations - function to execute the batch operation
 * @returns {Promise} - return a promise
 */
export const executeBatch = async (batchOperations) => {
    try {
        const batch = new FirestoreBatch();
        await batchOperations(batch);
        return await batch.commit();
    } catch (error) {
        const handled = handleError(error, {
            title: 'Erro ao executar operações em lote',
            logToAnalytics: true
          });
      
          return { success: false, error: handled.message };
    }
};

//Example of usage
/*
await executeBatch(batch => {
    batch
        .set('users', 'user1', { name: 'John' })
        .update('stockItems', 'item1', { quantity: 10 })
        .delete('shoppingLists', 'oldList')
        .increment('stats', 'user1', 'itemsAdded', 1);
});
*/