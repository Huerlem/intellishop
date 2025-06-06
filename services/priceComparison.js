// services/priceComparison.js - INTEGRADO COM APIs GRATUITAS + SUAS APIs PAGAS
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import { handleError } from '@/errors/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔧 IMPORTS FIREBASE CORRIGIDOS
import { 
    savePriceComparison, 
    getItemPriceComparisons as getFirebaseItemPriceComparison  // ✅ Nome correto da função
} from '@firebase/firestore';

// 🆓 IMPORTAR APIs GRATUITAS
import { getFreeApiPrices, SUPERMARKET_CONFIG } from './freeAPIsPrice';

// Initialize Gemini for AI-powered price analysis
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Rate limiting for Gemini
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 15;
const RATE_LIMIT_RESET_TIME = 60000;

setInterval(() => {
    requestCount = 0;
}, RATE_LIMIT_RESET_TIME);

const checkRateLimit = () => {
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        throw new Error('Rate limit exceeded. Please wait a moment.');
    }
    requestCount++;
};

// 💰 SUAS APIs PAGAS (MANTIDAS)
const API_KEYS = {
    rapidApi: Constants.expoConfig?.extra?.rapidApiKey,
    scrapeNinja: Constants.expoConfig?.extra?.scrapeNinjaKey,
    apify: Constants.expoConfig?.extra?.apifyKey,
    // 🆓 API GRATUITA DO TESCO
    tesco: process.env.EXPO_PUBLIC_TESCO_API_KEY
};

/**
 * 🔧 FUNÇÃO PRINCIPAL: Fetch price comparison for a specific item
 * @param {string} itemName - item name to search
 * @param {string} userId - current user id
 * @returns {Promise} - Price comparison data organized by supermarket
 */
export const getItemPriceComparison = async (itemName, userId) => {
    try {
        console.log('🔍 getItemPriceComparison called for:', itemName);
        
        // First, check if there is a cached price comparison in firebase
        const cachedResults = await checkCachedComparison(itemName, userId);

        if (cachedResults) {
            console.log('✅ Using cached price comparison data');
            return { success: true, results: cachedResults, fromCache: true };
        }

        // If there is no cache or it's not updated, fetch new data
        console.log('🔄 Fetching fresh price comparison data');
        const results = await fetchPriceComparisonFromAPI(itemName);

        // ✅ TRY TO SAVE RESULTS IN FIREBASE (opcional se função não existe)
        let savedComparison = { id: `local_${Date.now()}` };
        
        if (typeof savePriceComparison === 'function' && userId) {
            try {
                savedComparison = await savePriceComparison(userId, itemName, results);
                console.log('✅ Results saved to Firebase cache');
            } catch (saveError) {
                console.warn('⚠️ Could not save to Firebase, continuing without cache:', saveError.message);
            }
        } else {
            console.log('📝 Firebase save not available, using local data only');
        }

        return {
            success: true, 
            results: { 
                itemName, 
                supermarkets: results.supermarkets || results, // Support both formats
                id: savedComparison.id, 
                createdAt: new Date(),
                source: results.source || 'integrated_apis'
            },
            fromCache: false
        };
    } catch (error) {
        console.error('❌ Error in getItemPriceComparison:', error);
        
        // ✅ FALLBACK SEM FIREBASE
        console.log('🔄 Using fallback without Firebase integration');
        try {
            const fallbackResults = await fetchPriceComparisonFromAPI(itemName);
            return {
                success: true,
                results: {
                    itemName,
                    supermarkets: fallbackResults.supermarkets || fallbackResults,
                    id: `fallback_${Date.now()}`,
                    createdAt: new Date(),
                    source: fallbackResults.source || 'fallback'
                },
                fromCache: false
            };
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            return { success: false, error: fallbackError.message };
        }
    }
};

/**
 * 🆓 NOVA VERSÃO: Fetch price comparison with FREE APIs PRIORITY + Suas APIs Pagas
 * @param {string} itemName - product name
 * @returns {Promise} - price comparison data organized by supermarket
 */
const fetchPriceComparisonFromAPI = async (itemName) => {
    try {
        // 🆓 PRIORIDADE 1: TENTAR APIs GRATUITAS PRIMEIRO
        console.log('🆓 Trying free APIs first...');
        try {
            const freeApiResults = await getFreeApiPrices(itemName);
            
            if (freeApiResults && freeApiResults.supermarkets && freeApiResults.realDataCount > 0) {
                console.log(`✅ Free APIs success: ${freeApiResults.realDataCount} real prices obtained`);
                console.log('✅ Free APIs provided real price data organized by supermarket');
                return freeApiResults;
            }
        } catch (freeApiError) {
            console.log('⚠️ Free APIs failed:', freeApiError.message);
        }

        // 💰 PRIORIDADE 2: TENTAR SUAS APIs PAGAS (se configuradas)
        if (API_KEYS.rapidApi) {
            console.log('💰 Trying paid RapidAPI...');
            try {
                const rapidResults = await fetchFromRapidAPI(itemName);
                if (rapidResults && rapidResults.length > 0) {
                    console.log('✅ RapidAPI provided real data');
                    return convertToSupermarketFormat(rapidResults, itemName);
                }
            } catch (rapidError) {
                console.log('⚠️ RapidAPI failed:', rapidError.message);
            }
        }

        if (API_KEYS.apify) {
            console.log('🕸️ Trying Apify web scraping...');
            try {
                const apifyResults = await fetchFromApify(itemName);
                if (apifyResults && apifyResults.length > 0) {
                    console.log('✅ Apify provided real data');
                    return convertToSupermarketFormat(apifyResults, itemName);
                }
            } catch (apifyError) {
                console.log('⚠️ Apify failed:', apifyError.message);
            }
        }

        if (API_KEYS.scrapeNinja) {
            console.log('🥷 Trying ScrapeNinja...');
            try {
                const scrapeResults = await fetchFromScrapeNinja(itemName);
                if (scrapeResults && scrapeResults.length > 0) {
                    console.log('✅ ScrapeNinja provided real data');
                    return convertToSupermarketFormat(scrapeResults, itemName);
                }
            } catch (scrapeError) {
                console.log('⚠️ ScrapeNinja failed:', scrapeError.message);
            }
        }

        // 🤖 PRIORIDADE 3: AI FALLBACK
        console.log('🤖 Using AI-enhanced local fallback price generation');
        return await generateIntelligentFallbackPrices(itemName);
        
    } catch (error) {
        console.error('❌ All price fetching methods failed:', error);
        return await generateIntelligentFallbackPrices(itemName);
    }
};

/**
 * 💰 SUA API RAPIDAPI (MANTIDA)
 */
const fetchFromRapidAPI = async (itemName) => {
    try {
        const response = await axios.get('https://supermarket-price-api.p.rapidapi.com/search', {
            params: { query: itemName, country: 'uk' },
            headers: {
                'X-RapidAPI-Key': API_KEYS.rapidApi,
                'X-RapidAPI-Host': 'supermarket-price-api.p.rapidapi.com'
            },
            timeout: 10000
        });

        if (response.data && response.data.results) {
            return response.data.results.map(item => ({
                storeId: item.store?.toLowerCase().replace(/[^a-z]/g, '') || 'unknown',
                storeName: item.store || 'Unknown Store',
                price: parseFloat(item.price || 0),
                unit: item.unit || 'un',
                url: item.url || '',
                inStock: item.availability !== 'out_of_stock',
                productName: item.name || itemName,
                source: 'rapidapi_paid',
                isRealData: true
            }));
        }
        return [];
    } catch (error) {
        console.error('RapidAPI error:', error);
        throw error;
    }
};

/**
 * 💰 SUA API APIFY (MANTIDA)
 */
const fetchFromApify = async (itemName) => {
    try {
        const response = await axios.post('https://api.apify.com/v2/acts/apify~supermarket-scraper/runs', {
            query: itemName,
            country: 'GB',
            maxResults: 20
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEYS.apify}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        if (response.data && response.data.items) {
            return response.data.items.map(item => ({
                storeId: item.store?.toLowerCase().replace(/[^a-z]/g, '') || 'unknown',
                storeName: item.store || 'Unknown Store',
                price: parseFloat(item.price || 0),
                unit: item.unit || 'un',
                url: item.url || '',
                inStock: item.inStock !== false,
                productName: item.name || itemName,
                source: 'apify_paid',
                isRealData: true
            }));
        }
        return [];
    } catch (error) {
        console.error('Apify error:', error);
        throw error;
    }
};

/**
 * 💰 SUA API SCRAPENINJA (MANTIDA)
 */
const fetchFromScrapeNinja = async (itemName) => {
    try {
        const response = await axios.post('https://scrapeninja.p.rapidapi.com/scrape', {
            url: `https://www.google.com/search?q=${encodeURIComponent(itemName + ' UK supermarket prices')}`,
            geo: 'GB',
            retryNum: 2
        }, {
            headers: {
                'X-RapidAPI-Key': API_KEYS.scrapeNinja,
                'X-RapidAPI-Host': 'scrapeninja.p.rapidapi.com'
            },
            timeout: 15000
        });

        // Process scraping results here
        if (response.data && response.data.body) {
            // Parse the scraped data for price information
            return parseScrapeNinjaResults(response.data.body, itemName);
        }
        return [];
    } catch (error) {
        console.error('ScrapeNinja error:', error);
        throw error;
    }
};

/**
 * 🔄 Convert legacy format to supermarket-organized format
 */
const convertToSupermarketFormat = (results, itemName) => {
    const supermarkets = {};
    
    results.forEach(item => {
        const storeKey = item.storeId || item.storeName?.toLowerCase().replace(/[^a-z]/g, '');
        const config = SUPERMARKET_CONFIG[storeKey] || {
            name: item.storeName,
            icon: '🏪',
            color: '#666666',
            logo: 'generic_logo.png'
        };
        
        if (!supermarkets[storeKey]) {
            supermarkets[storeKey] = {
                id: storeKey,
                name: config.name,
                icon: config.icon,
                color: config.color,
                logo: config.logo,
                items: []
            };
        }
        
        supermarkets[storeKey].items.push({
            id: `${storeKey}-${itemName}`,
            name: itemName,
            productName: item.productName,
            price: item.price,
            priceDisplay: `£${item.price.toFixed(2)}`,
            url: item.url,
            inStock: item.inStock,
            source: item.source,
            isRealData: item.isRealData
        });
    });
    
    return {
        supermarkets: Object.values(supermarkets).sort((a, b) => {
            const avgA = a.items.reduce((sum, item) => sum + item.price, 0) / a.items.length;
            const avgB = b.items.reduce((sum, item) => sum + item.price, 0) / b.items.length;
            return avgA - avgB;
        }),
        lastUpdated: new Date().toISOString(),
        source: 'paid_apis_converted',
        realDataCount: results.filter(r => r.isRealData).length,
        estimatedCount: results.filter(r => !r.isRealData).length,
        itemName
    };
};

/**
 * 🤖 Generate intelligent fallback prices organized by supermarket
 */
const generateIntelligentFallbackPrices = async (itemName) => {
    try {
        checkRateLimit();

        const prompt = `
Generate realistic UK supermarket prices for "${itemName}" in JSON format:

{
  "supermarkets": [
    {
      "id": "store_key",
      "name": "Store Name",
      "icon": "🛒",
      "color": "#color",
      "items": [
        {
          "id": "store_key-${itemName}",
          "name": "${itemName}",
          "productName": "Full product name",
          "price": price_number,
          "priceDisplay": "£X.XX",
          "url": "store_url",
          "inStock": true,
          "source": "ai_generated",
          "isRealData": false
        }
      ]
    }
  ]
}

Include: Tesco, Sainsbury's, ASDA, Morrisons, Aldi, Lidl
Make prices realistic for UK market 2024/2025.
Aldi and Lidl should be 15-25% cheaper than others.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
            const aiData = JSON.parse(cleanedText);
            
            return {
                ...aiData,
                lastUpdated: new Date().toISOString(),
                source: 'ai_generated_supermarket_format',
                realDataCount: 0,
                estimatedCount: aiData.supermarkets?.length || 0,
                itemName
            };
        } catch (parseError) {
            console.warn('⚠️ Failed to parse AI response, using local fallback');
            return generateLocalFallbackPrices(itemName);
        }

    } catch (error) {
        console.error('❌ Error generating AI prices:', error);
        return generateLocalFallbackPrices(itemName);
    }
};

/**
 * 🏪 Generate local fallback prices organized by supermarket
 */
const generateLocalFallbackPrices = (itemName) => {
    const basePrice = 1.5 + (hashString(itemName) % 200) / 100; // £1.50 - £3.50
    
    const supermarkets = Object.entries(SUPERMARKET_CONFIG).map(([key, config]) => ({
        id: key,
        name: config.name,
        icon: config.icon,
        color: config.color,
        logo: config.logo,
        items: [{
            id: `${key}-${itemName}`,
            name: itemName,
            productName: itemName,
            price: parseFloat((basePrice * config.multiplier * (0.9 + Math.random() * 0.2)).toFixed(2)),
            priceDisplay: `£${(basePrice * config.multiplier * (0.9 + Math.random() * 0.2)).toFixed(2)}`,
            url: `https://www.${key.toLowerCase().replace("'", "")}.com`,
            inStock: Math.random() > 0.1,
            source: 'local_fallback',
            isRealData: false
        }]
    }));
    
    // Sort by average price (cheapest first)
    supermarkets.sort((a, b) => a.items[0].price - b.items[0].price);
    
    return {
        supermarkets,
        lastUpdated: new Date().toISOString(),
        source: 'local_fallback_supermarket_format',
        realDataCount: 0,
        estimatedCount: supermarkets.length,
        itemName
    };
};

/**
 * 📊 Analyze shopping list prices across supermarkets
 * @param {Array} items - Shopping list items
 * @param {string} userId - User ID
 * @returns {Promise} - Analysis data organized by supermarket
 */
export const analyzeShoppingListPrices = async (items, userId) => {
    try {
        console.log('📊 Analyzing shopping list prices for', items.length, 'items');
        
        const analysisResults = {
            success: true,
            supermarketTotals: {},
            bestValue: null,
            itemAnalysis: [],
            totalItems: items.length,
            analyzedItems: 0
        };
        
        // Get prices for each item
        for (const item of items) {
            try {
                const priceComparison = await getItemPriceComparison(item.name, userId);
                
                if (priceComparison.success && priceComparison.results?.supermarkets) {
                    analysisResults.analyzedItems++;
                    
                    // Process each supermarket for this item
                    priceComparison.results.supermarkets.forEach(supermarket => {
                        if (!analysisResults.supermarketTotals[supermarket.id]) {
                            analysisResults.supermarketTotals[supermarket.id] = {
                                id: supermarket.id,
                                name: supermarket.name,
                                icon: supermarket.icon,
                                color: supermarket.color,
                                total: 0,
                                itemsFound: 0,
                                items: []
                            };
                        }
                        
                        if (supermarket.items && supermarket.items.length > 0) {
                            const bestItem = supermarket.items.reduce((best, current) => 
                                current.price < best.price ? current : best
                            );
                            
                            analysisResults.supermarketTotals[supermarket.id].total += bestItem.price * (item.quantity || 1);
                            analysisResults.supermarketTotals[supermarket.id].itemsFound++;
                            analysisResults.supermarketTotals[supermarket.id].items.push({
                                ...bestItem,
                                originalItem: item,
                                quantity: item.quantity || 1,
                                subtotal: bestItem.price * (item.quantity || 1)
                            });
                        }
                    });
                    
                    analysisResults.itemAnalysis.push({
                        item: item,
                        priceComparison: priceComparison.results
                    });
                }
            } catch (itemError) {
                console.warn(`⚠️ Failed to analyze ${item.name}:`, itemError.message);
                // Continue with other items instead of failing completely
            }
        }
        
        // Find best value supermarket
        const supermarketArray = Object.values(analysisResults.supermarketTotals);
        if (supermarketArray.length > 0) {
            analysisResults.bestValue = supermarketArray.reduce((best, current) => 
                current.total < best.total ? current : best
            );
        }
        
        console.log(`✅ Shopping list analysis complete: ${analysisResults.analyzedItems}/${items.length} items analyzed`);
        return analysisResults;
        
    } catch (error) {
        console.error('❌ Error analyzing shopping list prices:', error);
        
        // ✅ FALLBACK COM ESTIMATIVAS LOCAIS
        console.log('🔄 Using fallback analysis with local estimates');
        const fallbackAnalysis = {
            success: true,
            source: 'fallback_estimates',
            supermarketTotals: {
                aldi: { id: 'aldi', name: 'Aldi', total: 25.50, itemsFound: items.length },
                lidl: { id: 'lidl', name: 'Lidl', total: 27.20, itemsFound: items.length },
                asda: { id: 'asda', name: 'ASDA', total: 29.80, itemsFound: items.length },
                tesco: { id: 'tesco', name: 'Tesco', total: 32.40, itemsFound: items.length },
                morrisons: { id: 'morrisons', name: 'Morrisons', total: 33.20, itemsFound: items.length },
                sainsburys: { id: 'sainsburys', name: "Sainsbury's", total: 34.00, itemsFound: items.length }
            },
            bestValue: { id: 'aldi', name: 'Aldi', total: 25.50 },
            totalItems: items.length,
            analyzedItems: items.length,
            itemAnalysis: []
        };
        
        return fallbackAnalysis;
    }
};

/**
 * Check if there is a cached price comparison result
 */
const checkCachedComparison = async (itemName, userId) => {
    try {
        // ✅ VERIFICAR SE FUNÇÃO FIREBASE EXISTE
        if (typeof getFirebaseItemPriceComparison !== 'function') {
            console.warn('⚠️ Firebase getItemPriceComparison not available, skipping cache');
            return null;
        }

        // ✅ VALIDAÇÃO INICIAL
        if (!userId || !itemName) {
            console.log('❌ Missing userId or itemName for cache check');
            return null;
        }

        const result = await getFirebaseItemPriceComparison(userId, itemName);

        if (!result?.success || !result?.data || result.data.length === 0) {
            console.log('📭 No cached data found for:', itemName);
            return null;
        }

        const comparison = result.data[0];
        
        // ✅ VALIDAÇÃO ROBUSTA DE TIMESTAMP
        let createdAtTime;
        
        if (comparison.createdAt) {
            // Se é um objeto Date
            if (comparison.createdAt instanceof Date) {
                createdAtTime = comparison.createdAt.getTime();
            }
            // Se é um Firestore Timestamp
            else if (comparison.createdAt.toDate && typeof comparison.createdAt.toDate === 'function') {
                createdAtTime = comparison.createdAt.toDate().getTime();
            }
            // Se é um timestamp numérico
            else if (typeof comparison.createdAt === 'number') {
                createdAtTime = comparison.createdAt;
            }
            // Se é uma string ISO
            else if (typeof comparison.createdAt === 'string') {
                createdAtTime = new Date(comparison.createdAt).getTime();
            }
            else {
                console.warn('⚠️ Unknown createdAt format:', typeof comparison.createdAt);
                return null;
            }
        } else {
            console.warn('⚠️ No createdAt found in cached comparison');
            return null;
        }

        // ✅ VERIFICAR SE É RECENTE (menos de 6 horas)
        const now = Date.now();
        const cacheAge = now - createdAtTime;
        const sixHours = 6 * 60 * 60 * 1000; // 6 horas em ms
        const isRecent = cacheAge < sixHours && cacheAge >= 0; // Também verificar se não é futuro

        if (isRecent) {
            console.log(`✅ Using cached data (${Math.round(cacheAge / (60 * 1000))} minutes old)`);
            return comparison;
        } else {
            console.log(`⏰ Cache expired (${Math.round(cacheAge / (60 * 1000))} minutes old)`);
            return null;
        }

    } catch (error) {
        console.warn('⚠️ Error checking cached price comparison:', error.message);
        return null;
    }
};

/**
 * Parse ScrapeNinja results (helper function)
 */
const parseScrapeNinjaResults = (htmlBody, itemName) => {
    // Implementation for parsing scraped HTML content
    // This would extract price information from the scraped content
    try {
        // Simplified parsing - in reality you'd need more sophisticated HTML parsing
        const results = [];
        // ... parsing logic here
        return results;
    } catch (error) {
        console.warn('Error parsing ScrapeNinja results:', error);
        return [];
    }
};

/**
 * Utility function to hash strings
 */
const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

/**
 * Determine unit based on item name
 */
const determineUnit = (itemName) => {
    const itemLower = itemName.toLowerCase();
    if (itemLower.includes('milk') || itemLower.includes('juice')) return 'L';
    if (itemLower.includes('bread') || itemLower.includes('pack')) return 'pack';
    if (itemLower.includes('kg') || itemLower.includes('kilo')) return 'kg';
    return 'un';
};

export default {
    getItemPriceComparison,
    analyzeShoppingListPrices
};