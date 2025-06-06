import { useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/context/AuthContext';
import { db } from '@/firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

export const useStock = () => {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchStockItems();
    }
  }, [user]);

  const fetchStockItems = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'stockItems'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      setStockItems(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addStockItem = async (name, quantity, category, expiryDate, location, minQuantity = 3, notes = '', unit = 'unid') => {
    setLoading(true);
    try {
      // Verificar campos obrigatórios
      if (!name || !quantity) {
        return { success: false, error: 'Nome e quantidade são obrigatórios' };
      }
      
      // Garantir que categoria e localização tenham valores
      if (!category) {
        return { success: false, error: 'Por favor, selecione uma categoria' };
      }
      
      if (!location) {
        return { success: false, error: 'Por favor, selecione uma localização' };
      }

      console.log('Enviando para Firebase:', { 
        name, quantity, category, expiryDate, location, minQuantity, notes, unit 
      });
      
      const newItem = {
        userId: user.uid,
        name,
        quantity: Number(quantity),
        unit: unit || 'unid', // Campo obrigatório para as regras do Firestore
        category,
        expiryDate: expiryDate || null,
        location: location || 'others',
        createdAt: new Date(),
        updatedAt: new Date(),
        lowStockThreshold: Number(minQuantity || 3),
        criticalStockThreshold: Math.max(1, Math.floor(Number(minQuantity || 3) / 3)),
        notes: notes || ''
      };

      const docRef = await addDoc(collection(db, 'stockItems'), newItem);
      
      newItem.id = docRef.id;
      setStockItems(prev => [newItem, ...prev]);

      return { success: true, item: newItem };
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateStockItem = async (itemId, updates) => {
    setLoading(true);
    try {
      const itemRef = doc(db, 'stockItems', itemId);
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: new Date()
      });

      setStockItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, ...updates, updatedAt: new Date() } 
            : item
        )
      );

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const removeStockItem = async (itemId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'stockItems', itemId));
      
      setStockItems(prev => prev.filter(item => item.id !== itemId));
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getLowStockItems = () => {
    return stockItems.filter(
      item => item.quantity <= item.lowStockThreshold && item.quantity > item.criticalStockThreshold
    );
  };

  const getCriticalStockItems = () => {
    return stockItems.filter(
      item => item.quantity <= item.criticalStockThreshold
    );
  };

  const getExpiringItems = () => {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return stockItems.filter(
      item => item.expiryDate && new Date(item.expiryDate) <= sevenDaysFromNow
    );
  };

  const sortStockItems = (sortOption) => {
    const sortedItems = [...stockItems].sort((a, b) => {
      switch(sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'quantity':
          return a.quantity - b.quantity;
        case 'expiry':
          return new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        default:
          return 0;
      }
    });
    
    setStockItems(sortedItems);
  };

  return {
    stockItems,
    loading,
    error,
    fetchStockItems,
    addStockItem,
    updateStockItem,
    removeStockItem,
    getLowStockItems,
    getCriticalStockItems,
    getExpiringItems,
    sortStockItems
  };
};