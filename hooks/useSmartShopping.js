// hooks/useSmartShopping.js - VERSÃO CORRIGIDA
import { useState } from 'react';
import { 
  generateSmartShoppingList, 
  getSmartShoppingHistory, 
  addSmartListToShoppingList 
} from '../services/smartShoppingService';

export const useSmartShopping = () => {
  const [loading, setLoading] = useState(false);
  const [smartList, setSmartList] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  /**
   * Gera uma lista de compras inteligente
   * @param {number} budget - Orçamento disponível
   * @param {Array} stockItems - Itens no estoque
   * @param {Array} history - Histórico de compras (opcional)
   * @param {Object} preferences - Preferências do usuário (opcional)
   */
  const generateList = async (budget, stockItems, history = [], preferences = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Iniciando geração da smart list...');
      console.log('Budget:', budget);
      console.log('Stock items:', stockItems?.length || 0);
      
      // Validar orçamento
      if (!budget || budget <= 0) {
        throw new Error('O orçamento deve ser um valor positivo');
      }
      
      // Validar estoque - PERMITIR LISTA VAZIA
      if (!stockItems || !Array.isArray(stockItems)) {
        console.warn('⚠️ Nenhum item de estoque fornecido, usando lista vazia');
        stockItems = [];
      }
      
      console.log('📋 Chamando generateSmartShoppingList...');
      const result = await generateSmartShoppingList(budget, stockItems, history, preferences);
      
      console.log('✅ Lista gerada com sucesso:', result);
      setSmartList(result);
      
      // Atualizar o histórico
      loadHistory();
      
      return result;
    } catch (err) {
      console.error('❌ Erro na geração da lista:', err);
      setError(err.message || 'Erro ao gerar lista de compras inteligente');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega o histórico de listas inteligentes
   */
  const loadHistory = async () => {
    try {
      const historyData = await getSmartShoppingHistory();
      setHistory(historyData);
      return historyData;
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      return [];
    }
  };

  /**
   * Adiciona a lista inteligente à lista de compras
   * @param {Function} addToList - Função de callback para adicionar à lista
   * @param {Array} items - Itens específicos para adicionar (opcional, usa smartList se não fornecido)
   */
  const addToShoppingList = async (addToList, items = null) => {
    setLoading(true);
    
    try {
      const itemsToAdd = items || (smartList ? smartList.items : []);
      
      if (!itemsToAdd || itemsToAdd.length === 0) {
        throw new Error('Nenhum item disponível para adicionar à lista');
      }
      
      console.log('📝 Adicionando', itemsToAdd.length, 'itens à lista de compras...');
      const result = await addSmartListToShoppingList(itemsToAdd, addToList);
      
      if (!result) {
        throw new Error('Falha ao adicionar itens à lista de compras');
      }
      
      console.log('✅ Itens adicionados com sucesso à lista');
      return true;
    } catch (err) {
      console.error('❌ Erro ao adicionar à lista:', err);
      setError(err.message || 'Erro ao adicionar itens à lista de compras');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Limpa erros
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Limpa a smart list atual
   */
  const clearSmartList = () => {
    setSmartList(null);
    setError(null);
  };

  return {
    loading,
    smartList,
    history,
    error,
    generateList,
    loadHistory,
    addToShoppingList,
    clearError,
    clearSmartList
  };
};