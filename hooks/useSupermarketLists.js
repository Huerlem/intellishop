// hooks/useSupermarketLists.js - GERENCIAR LISTAS POR SUPERMERCADO
import { useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/context/AuthContext';
import { SUPERMARKET_CONFIG } from '@/services/freeAPIsPrice';

const STORAGE_KEY = 'supermarket_shopping_lists';

/**
 * 🏪 Hook para gerenciar listas de compras organizadas por supermercado
 * Permite criar listas específicas para cada supermercado com itens aceitos do price comparison
 */
export const useSupermarketLists = () => {
  const { user } = useContext(AuthContext);
  const [supermarketLists, setSupermarketLists] = useState({});
  const [loading, setLoading] = useState(true);

  // 🔧 CARREGAR LISTAS SALVAS
  useEffect(() => {
    if (user?.uid) {
      loadSupermarketLists();
    }
  }, [user]);

  /**
   * 📱 Carregar listas do AsyncStorage
   */
  const loadSupermarketLists = async () => {
    try {
      setLoading(true);
      const storageKey = `${STORAGE_KEY}_${user.uid}`;
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (stored) {
        const lists = JSON.parse(stored);
        setSupermarketLists(lists);
        console.log('✅ Supermarket lists loaded:', Object.keys(lists).length);
      } else {
        // Inicializar listas vazias para cada supermercado
        const emptyLists = {};
        Object.keys(SUPERMARKET_CONFIG).forEach(supermarketId => {
          emptyLists[supermarketId] = {
            id: supermarketId,
            name: SUPERMARKET_CONFIG[supermarketId].name,
            icon: SUPERMARKET_CONFIG[supermarketId].icon,
            color: SUPERMARKET_CONFIG[supermarketId].color,
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalEstimated: 0
          };
        });
        setSupermarketLists(emptyLists);
        await saveSupermarketLists(emptyLists);
      }
    } catch (error) {
      console.error('❌ Error loading supermarket lists:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 💾 Salvar listas no AsyncStorage
   */
  const saveSupermarketLists = async (lists) => {
    try {
      const storageKey = `${STORAGE_KEY}_${user.uid}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(lists));
      console.log('✅ Supermarket lists saved');
    } catch (error) {
      console.error('❌ Error saving supermarket lists:', error);
    }
  };

  /**
   * ➕ Adicionar item a uma lista de supermercado específica
   */
  const addItemToSupermarketList = async (supermarketId, item) => {
    try {
      const newLists = { ...supermarketLists };
      
      if (!newLists[supermarketId]) {
        // Criar lista se não existir
        const config = SUPERMARKET_CONFIG[supermarketId];
        newLists[supermarketId] = {
          id: supermarketId,
          name: config?.name || supermarketId,
          icon: config?.icon || '🏪',
          color: config?.color || '#666666',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalEstimated: 0
        };
      }

      // Verificar se item já existe
      const existingItemIndex = newLists[supermarketId].items.findIndex(
        existingItem => existingItem.name.toLowerCase() === item.name.toLowerCase()
      );

      if (existingItemIndex >= 0) {
        // Atualizar item existente
        newLists[supermarketId].items[existingItemIndex] = {
          ...newLists[supermarketId].items[existingItemIndex],
          ...item,
          quantity: (newLists[supermarketId].items[existingItemIndex].quantity || 1) + (item.quantity || 1),
          updatedAt: new Date().toISOString()
        };
      } else {
        // Adicionar novo item
        const newItem = {
          id: `${supermarketId}_${Date.now()}`,
          ...item,
          addedAt: new Date().toISOString(),
          checked: false,
          quantity: item.quantity || 1
        };
        newLists[supermarketId].items.push(newItem);
      }

      // Atualizar totais
      newLists[supermarketId].updatedAt = new Date().toISOString();
      newLists[supermarketId].totalEstimated = newLists[supermarketId].items.reduce(
        (total, listItem) => total + (listItem.price * listItem.quantity), 0
      );

      setSupermarketLists(newLists);
      await saveSupermarketLists(newLists);

      console.log(`✅ Item added to ${supermarketId} list:`, item.name);
      return { success: true, item: newLists[supermarketId].items.slice(-1)[0] };

    } catch (error) {
      console.error('❌ Error adding item to supermarket list:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * ❌ Remover item de uma lista de supermercado
   */
  const removeItemFromSupermarketList = async (supermarketId, itemId) => {
    try {
      const newLists = { ...supermarketLists };
      
      if (newLists[supermarketId]) {
        newLists[supermarketId].items = newLists[supermarketId].items.filter(
          item => item.id !== itemId
        );
        
        // Atualizar totais
        newLists[supermarketId].updatedAt = new Date().toISOString();
        newLists[supermarketId].totalEstimated = newLists[supermarketId].items.reduce(
          (total, item) => total + (item.price * item.quantity), 0
        );

        setSupermarketLists(newLists);
        await saveSupermarketLists(newLists);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error removing item from supermarket list:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * ✅ Alternar status de checked de um item
   */
  const toggleItemChecked = async (supermarketId, itemId, checked) => {
    try {
      const newLists = { ...supermarketLists };
      
      if (newLists[supermarketId]) {
        const itemIndex = newLists[supermarketId].items.findIndex(item => item.id === itemId);
        if (itemIndex >= 0) {
          newLists[supermarketId].items[itemIndex].checked = checked;
          newLists[supermarketId].items[itemIndex].checkedAt = checked ? new Date().toISOString() : null;
          newLists[supermarketId].updatedAt = new Date().toISOString();
          
          setSupermarketLists(newLists);
          await saveSupermarketLists(newLists);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error toggling item checked:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * 🔄 Atualizar quantidade de um item
   */
  const updateItemQuantity = async (supermarketId, itemId, quantity) => {
    try {
      const newLists = { ...supermarketLists };
      
      if (newLists[supermarketId]) {
        const itemIndex = newLists[supermarketId].items.findIndex(item => item.id === itemId);
        if (itemIndex >= 0) {
          newLists[supermarketId].items[itemIndex].quantity = Math.max(1, quantity);
          newLists[supermarketId].updatedAt = new Date().toISOString();
          
          // Recalcular total
          newLists[supermarketId].totalEstimated = newLists[supermarketId].items.reduce(
            (total, item) => total + (item.price * item.quantity), 0
          );

          setSupermarketLists(newLists);
          await saveSupermarketLists(newLists);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error updating item quantity:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * 🗑️ Limpar itens marcados de uma lista
   */
  const clearCheckedItems = async (supermarketId) => {
    try {
      const newLists = { ...supermarketLists };
      
      if (newLists[supermarketId]) {
        const checkedCount = newLists[supermarketId].items.filter(item => item.checked).length;
        newLists[supermarketId].items = newLists[supermarketId].items.filter(item => !item.checked);
        newLists[supermarketId].updatedAt = new Date().toISOString();
        
        // Recalcular total
        newLists[supermarketId].totalEstimated = newLists[supermarketId].items.reduce(
          (total, item) => total + (item.price * item.quantity), 0
        );

        setSupermarketLists(newLists);
        await saveSupermarketLists(newLists);

        return { success: true, clearedCount: checkedCount };
      }

      return { success: false, error: 'Supermarket list not found' };
    } catch (error) {
      console.error('❌ Error clearing checked items:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * 🗑️ Limpar lista completa de um supermercado
   */
  const clearSupermarketList = async (supermarketId) => {
    try {
      const newLists = { ...supermarketLists };
      
      if (newLists[supermarketId]) {
        const itemCount = newLists[supermarketId].items.length;
        newLists[supermarketId].items = [];
        newLists[supermarketId].totalEstimated = 0;
        newLists[supermarketId].updatedAt = new Date().toISOString();

        setSupermarketLists(newLists);
        await saveSupermarketLists(newLists);

        return { success: true, clearedCount: itemCount };
      }

      return { success: false, error: 'Supermarket list not found' };
    } catch (error) {
      console.error('❌ Error clearing supermarket list:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * 📊 Obter estatísticas de uma lista de supermercado
   */
  const getSupermarketListStats = (supermarketId) => {
    const list = supermarketLists[supermarketId];
    if (!list) return null;

    const totalItems = list.items.length;
    const checkedItems = list.items.filter(item => item.checked).length;
    const uncheckedItems = totalItems - checkedItems;
    const totalEstimated = list.totalEstimated || 0;
    const checkedValue = list.items
      .filter(item => item.checked)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
    const remainingValue = totalEstimated - checkedValue;

    return {
      totalItems,
      checkedItems,
      uncheckedItems,
      totalEstimated,
      checkedValue,
      remainingValue,
      completionPercentage: totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0
    };
  };

  /**
   * 📋 Obter todas as listas com estatísticas
   */
  const getAllListsWithStats = () => {
    return Object.values(supermarketLists).map(list => ({
      ...list,
      stats: getSupermarketListStats(list.id)
    })).filter(list => list.stats); // Remove listas sem estatísticas válidas
  };

  /**
   * 🔍 Buscar itens em todas as listas
   */
  const searchItemsAcrossLists = (query) => {
    const results = [];
    const searchQuery = query.toLowerCase();

    Object.values(supermarketLists).forEach(list => {
      const matchingItems = list.items.filter(item =>
        item.name.toLowerCase().includes(searchQuery) ||
        item.productName?.toLowerCase().includes(searchQuery)
      );

      if (matchingItems.length > 0) {
        results.push({
          supermarket: list,
          items: matchingItems
        });
      }
    });

    return results;
  };

  /**
   * 📤 Exportar lista de supermercado para lista de compras principal
   */
  const exportToMainShoppingList = async (supermarketId, addItemFunction) => {
  try {
    console.log('📤 Exporting supermarket list to main list:', supermarketId);
    console.log('📤 addItemFunction type:', typeof addItemFunction);
    
    const list = supermarketLists[supermarketId];
    if (!list || !list.items.length) {
      return { success: false, error: 'No items to export' };
    }

    // ✅ CORREÇÃO: Verificar se a função foi passada corretamente
    if (!addItemFunction || typeof addItemFunction !== 'function') {
      console.error('❌ addItemFunction is not a valid function:', typeof addItemFunction);
      return { 
        success: false, 
        error: 'Main list add function is not available. Please ensure useShoppingList hook is properly imported.' 
      };
    }

    let successCount = 0;
    let errorCount = 0;

    for (const item of list.items) {
      try {
        // ✅ CORREÇÃO: Formato correto esperado pelo useShoppingList
        const mainListItem = {
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit || 'un',
          estimatedPrice: item.price,
          category: 'others', // ✅ String simples, não objeto
          note: `From ${list.name} - ${item.priceDisplay || '£' + item.price.toFixed(2)}`,
          checked: false,
          fromSupermarketList: true,
          originalSupermarket: list.name,
          url: item.url
        };

        console.log('📦 Exporting item:', mainListItem.name, 'to main list');

        // ✅ CORREÇÃO: Usar a função passada como parâmetro
        const result = await addItemFunction(mainListItem);
        console.log('✅ Export result for', item.name, ':', result);
        
        // ✅ CORREÇÃO: Verificar resultado corretamente
        if (result && result.success !== false) {
          successCount++;
        } else {
          console.warn('⚠️ Failed to export item:', item.name, result);
          errorCount++;
        }
      } catch (itemError) {
        console.error(`❌ Failed to export item ${item.name}:`, itemError);
        errorCount++;
      }
    }

    const message = `Exported ${successCount} items to main shopping list${errorCount > 0 ? ` (${errorCount} failed)` : ''}`;
    
    return {
      success: successCount > 0,
      successCount,
      errorCount,
      message
    };

  } catch (error) {
    console.error('❌ Error exporting to main shopping list:', error);
    return { success: false, error: error.message };
  }
};

  /**
   * 🔄 Merge items from price comparison results
   */
  const mergeFromPriceComparison = async (priceComparisonData) => {
    try {
      let addedCount = 0;
      let updatedCount = 0;

      if (priceComparisonData.supermarkets) {
        for (const supermarket of priceComparisonData.supermarkets) {
          if (supermarket.items && supermarket.items.length > 0) {
            for (const item of supermarket.items) {
              const result = await addItemToSupermarketList(supermarket.id, {
                name: item.name,
                productName: item.productName,
                price: item.price,
                priceDisplay: item.priceDisplay,
                url: item.url,
                inStock: item.inStock,
                source: item.source,
                isRealData: item.isRealData,
                quantity: 1,
                unit: 'un',
                category: 'others'
              });

              if (result.success) {
                if (result.item) {
                  addedCount++;
                } else {
                  updatedCount++;
                }
              }
            }
          }
        }
      }

      return {
        success: true,
        addedCount,
        updatedCount,
        message: `Added ${addedCount} new items, updated ${updatedCount} existing items`
      };

    } catch (error) {
      console.error('❌ Error merging from price comparison:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * 📊 Obter resumo geral de todas as listas
   */
  const getOverallStats = () => {
    const allLists = Object.values(supermarketLists);
    
    const totalLists = allLists.length;
    const activeListsCount = allLists.filter(list => list.items.length > 0).length;
    const totalItemsCount = allLists.reduce((sum, list) => sum + list.items.length, 0);
    const totalEstimatedValue = allLists.reduce((sum, list) => sum + (list.totalEstimated || 0), 0);
    const totalCheckedItems = allLists.reduce(
      (sum, list) => sum + list.items.filter(item => item.checked).length, 0
    );

    const cheapestList = allLists
      .filter(list => list.items.length > 0)
      .sort((a, b) => (a.totalEstimated || 0) - (b.totalEstimated || 0))[0];

    const mostItemsList = allLists
      .sort((a, b) => b.items.length - a.items.length)[0];

    return {
      totalLists,
      activeListsCount,
      totalItemsCount,
      totalEstimatedValue,
      totalCheckedItems,
      cheapestList,
      mostItemsList,
      averageItemsPerList: activeListsCount > 0 ? Math.round(totalItemsCount / activeListsCount) : 0,
      overallCompletionPercentage: totalItemsCount > 0 ? 
        Math.round((totalCheckedItems / totalItemsCount) * 100) : 0
    };
  };

  return {
    // Estado
    supermarketLists,
    loading,

    // Funções principais
    addItemToSupermarketList,
    removeItemFromSupermarketList,
    toggleItemChecked,
    updateItemQuantity,
    clearCheckedItems,
    clearSupermarketList,

    // Estatísticas e busca
    getSupermarketListStats,
    getAllListsWithStats,
    searchItemsAcrossLists,
    getOverallStats,

    // Integração
    exportToMainShoppingList,
    mergeFromPriceComparison,

    // Utilitários
    loadSupermarketLists
  };
};

export default useSupermarketLists;