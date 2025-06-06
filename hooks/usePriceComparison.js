import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { priceComparisonService } from '../services/priceComparison';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook para gerenciar funcionalidades de comparação de preços
 * @returns {Object} Funções e estados relacionados à comparação de preços
 */
export default function usePriceComparison() {
    const [postalCode, setPostalCode] = useState('');
    const [searchHistory, setSearchHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentSearch, setCurrentSearch] = useState({
        type: null, // 'item' ou 'list'
        results: null,
        summary: []
    });

    // Carrega o código postal e histórico de pesquisas
    useEffect(() => {
        const loadSavedData = async () => {
        try {
            // Carrega código postal
            const savedPostalCode = await priceComparisonService.getPreferredPostalCode();
            if (savedPostalCode) {
            setPostalCode(savedPostalCode);
            }
            
            // Carrega histórico de pesquisas recentes
            const savedHistory = await AsyncStorage.getItem('price_search_history');
            if (savedHistory) {
            setSearchHistory(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
        };
        
        loadSavedData();
    }, []);

    /**
     * Atualiza o código postal
     * @param {string} newPostalCode - Novo código postal
     */
    const updatePostalCode = useCallback(async (newPostalCode) => {
        try {
        setError(null);
        
        if (!newPostalCode || newPostalCode.trim() === '') {
            setError('Código postal não pode estar vazio.');
            return false;
        }
        
        await priceComparisonService.setPreferredPostalCode(newPostalCode.trim());
        setPostalCode(newPostalCode.trim());
        return true;
        } catch (error) {
        setError(error.message);
        return false;
        }
    }, []);

    /**
     * Adiciona um item ao histórico de pesquisas
     * @param {string} itemName - Nome do item pesquisado
     * @param {Object} result - Resultado da pesquisa
     */
    const addToSearchHistory = useCallback(async (itemName, result) => {
        try {
        const historyItem = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            query: itemName,
            type: 'item',
            bestPrice: result?.length > 0 ? 
            Math.min(...result.map(r => r.price.current)) : 
            null,
            bestStore: result?.length > 0 ? 
            result.reduce((a, b) => a.price.current < b.price.current ? a : b).store.name : 
            null
        };
        
        // Limita o histórico a 20 itens
        const updatedHistory = [historyItem, ...searchHistory]
            .slice(0, 20);
        
        setSearchHistory(updatedHistory);
        await AsyncStorage.setItem('price_search_history', JSON.stringify(updatedHistory));
        } catch (error) {
        console.error('Error adding to search history:', error);
        }
    }, [searchHistory]);

    /**
     * Busca preços para um item específico
     * @param {string} itemName - Nome do item
     * @param {string} itemPostalCode - Código postal (opcional)
     * @returns {Promise<Object>} Resultados da busca
     */
    const searchItemPrices = useCallback(async (itemName, itemPostalCode = null) => {
        try {
        setIsLoading(true);
        setError(null);
        
        // Usa o código postal fornecido ou o salvo
        const postalCodeToUse = itemPostalCode || postalCode;
        
        if (!postalCodeToUse) {
            throw new Error('Código postal não definido. Por favor, defina seu código postal.');
        }
        
        // Atualiza o código postal se um novo for fornecido
        if (itemPostalCode && itemPostalCode !== postalCode) {
            await updatePostalCode(itemPostalCode);
        }
        
        // Busca os preços
        const results = await priceComparisonService.searchItemPrices(
            itemName.trim(),
            postalCodeToUse
        );
        
        // Guarda os resultados no estado
        setCurrentSearch({
            type: 'item',
            results: {
            itemResults: {
                [itemName.trim()]: results
            }
            },
            summary: results.map(result => ({
            id: result.store.id,
            name: result.store.name,
            logo: result.store.logo,
            price: result.price.current,
            distance: result.store.distance
            }))
        });
        
        // Adiciona ao histórico
        await addToSearchHistory(itemName.trim(), results);
        
        return results;
        } catch (error) {
        setError(error.message);
        throw error;
        } finally {
        setIsLoading(false);
        }
    }, [postalCode, updatePostalCode, addToSearchHistory]);

    /**
     * Busca preços para uma lista de itens
     * @param {Array} items - Lista de itens
     * @param {string} listPostalCode - Código postal (opcional)
     * @returns {Promise<Object>} Resultados da busca
     */
    const searchListPrices = useCallback(async (items, listPostalCode = null) => {
        try {
        setIsLoading(true);
        setError(null);
        
        // Usa o código postal fornecido ou o salvo
        const postalCodeToUse = listPostalCode || postalCode;
        
        if (!postalCodeToUse) {
            throw new Error('Código postal não definido. Por favor, defina seu código postal.');
        }
        
        // Atualiza o código postal se um novo for fornecido
        if (listPostalCode && listPostalCode !== postalCode) {
            await updatePostalCode(listPostalCode);
        }
        
        // Busca os preços
        const results = await priceComparisonService.searchShoppingListPrices(
            items,
            postalCodeToUse
        );
        
        // Guarda os resultados no estado
        setCurrentSearch({
            type: 'list',
            results,
            summary: results.storeSummary
        });
        
        return results;
        } catch (error) {
        setError(error.message);
        throw error;
        } finally {
        setIsLoading(false);
        }
    }, [postalCode, updatePostalCode]);

    /**
     * Limpa os resultados da pesquisa atual
     */
    const clearSearch = useCallback(() => {
        setCurrentSearch({
        type: null,
        results: null,
        summary: []
        });
    }, []);

    /**
     * Limpa o histórico de pesquisas
     */
    const clearSearchHistory = useCallback(async () => {
        try {
        setSearchHistory([]);
        await AsyncStorage.removeItem('price_search_history');
        } catch (error) {
        console.error('Error clearing search history:', error);
        }
    }, []);

    /**
     * Busca as lojas suportadas pelo serviço
     * @returns {Array} Lista de lojas suportadas
     */
    const getSupportedStores = useCallback(() => {
        return priceComparisonService.getSupportedStores();
    }, []);

    return {
        postalCode,
        updatePostalCode,
        searchItemPrices,
        searchListPrices,
        isLoading,
        error,
        setError,
        currentSearch,
        clearSearch,
        searchHistory,
        clearSearchHistory,
        getSupportedStores
    };
}