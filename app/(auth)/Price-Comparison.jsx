// Price-Comparison.jsx - FIXED VERSION OF totalBudget.toFixed ERROR
import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  Alert,
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useSupermarketLists } from '@/hooks/useSupermarketLists';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// 🔧 IMPORT YOUR PRICE COMPARISON SERVICE
import { 
  getItemPriceComparison,
  analyzeShoppingListPrices
} from '@/services/priceComparison';

// 🔧 CONTEXT FOR USER ID
import { AuthContext } from '@/context/AuthContext';

// 🏪 INDIVIDUAL SUPERMARKET COMPONENT
const SupermarketCard = ({ supermarket, onAcceptItem, fromSmartShopping = false }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!supermarket.items || supermarket.items.length === 0) {
    return null;
  }

  const totalPrice = supermarket.items.reduce((sum, item) => sum + item.price, 0);
  const averagePrice = totalPrice / supermarket.items.length;
  const bestItem = supermarket.items.reduce((best, current) => 
    current.price < best.price ? current : best
  );

  return (
    <Card style={[styles.supermarketCard, { borderLeftColor: supermarket.color }]}>
      {/* SUPERMARKET HEADER */}
      <TouchableOpacity
        style={styles.supermarketHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.supermarketInfo}>
          <View style={styles.supermarketTitleRow}>
            <Text style={styles.supermarketIcon}>{supermarket.icon}</Text>
            <Text style={styles.supermarketName}>{supermarket.name}</Text>
            {bestItem.isRealData ? (
              <View style={styles.realDataBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
                <Text style={styles.realDataText}>Real</Text>
              </View>
            ) : (
              <View style={styles.estimatedBadge}>
                <Text style={styles.estimatedText}>Est</Text>
              </View>
            )}
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.bestPrice}>
              Best: <Text style={styles.priceValue}>{bestItem.priceDisplay}</Text>
            </Text>
            {supermarket.items.length > 1 && (
              <Text style={styles.itemCount}>
                {supermarket.items.length} options
              </Text>
            )}
          </View>
          
          {fromSmartShopping && (
            <Text style={styles.smartShoppingHint}>
              💡 From Smart Shopping List
            </Text>
          )}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: supermarket.color }]}
            onPress={() => onAcceptItem(bestItem, supermarket)}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.acceptButtonText}>Add</Text>
          </TouchableOpacity>
          
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
            style={styles.expandIcon}
          />
        </View>
      </TouchableOpacity>

      {/* EXPANDED ITEMS */}
      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.itemsTitle}>Available options:</Text>
          {supermarket.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.productName || item.name}
                </Text>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemSource}>
                    Source: {item.source?.replace(/_/g, ' ') || 'Unknown'}
                  </Text>
                  {item.inStock === false && (
                    <Text style={styles.outOfStock}>Out of Stock</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.itemActions}>
                <Text style={[
                  styles.itemPrice,
                  item === bestItem && styles.bestItemPrice
                ]}>
                  {item.priceDisplay}
                </Text>
                {item === bestItem && (
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>Best</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.addItemButton, { opacity: item.inStock !== false ? 1 : 0.5 }]}
                  onPress={() => onAcceptItem(item, supermarket)}
                  disabled={item.inStock === false}
                >
                  <Ionicons name="add-circle" size={20} color={supermarket.color} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {supermarket.items.length > 1 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                {`Average: £${averagePrice.toFixed(2)} • Range: £${Math.min(...supermarket.items.map(i => i.price)).toFixed(2)} - £${Math.max(...supermarket.items.map(i => i.price)).toFixed(2)}`}
              </Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

// 🔧 MAIN COMPONENT
const PriceComparison = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useContext(AuthContext);
    const { aiEnabled, loading: aiLoading } = useAIFeatures();
    
    // ✅ USE CORRECT FUNCTION NAMES FROM HOOKS
    const { items: shoppingItems } = useShoppingList();
    const { addItemToSupermarketList } = useSupermarketLists();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [priceData, setPriceData] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [acceptedItems, setAcceptedItems] = useState([]);

    // 🔧 BACK BUTTON FIX
    const handleBackPress = () => {
      console.log('🔙 Back button pressed');
      try {
        if (router.canGoBack()) {
          console.log('✅ Can go back - using router.back()');
          router.back();
        } else {
          console.log('⚠️ Cannot go back - navigating to HomeScreen');
          router.replace('/(auth)/HomeScreen');
        }
      } catch (error) {
        console.error('❌ Error in navigation:', error);
        // Fallback - try different routes
        try {
          router.push('/(auth)/HomeScreen');
        } catch (fallbackError) {
          console.error('❌ Fallback navigation failed:', fallbackError);
          Alert.alert('Navigation Error', 'Unable to navigate back. Please restart the app.');
        }
      }
    };

    // 🔧 PROCESS SMART SHOPPING LIST PARAMETERS
    useEffect(() => {
      console.log('🔧 PriceComparison mounted with params:', params);
      console.log('🔧 Available hooks:', {
        addItemToSupermarketList: typeof addItemToSupermarketList,
        aiEnabled,
        userUid: user?.uid
      });

      if (!aiEnabled) {
        console.log('⚠️ AI not enabled, stopping data load');
        setLoading(false);
        return;
      }

      if (!user?.uid) {
        console.log('⚠️ No user UID, stopping data load');
        setLoading(false);
        return;
      }

      let isCancelled = false;

      const loadPriceData = async () => {
        if (isCancelled) return;
        
        setLoading(true);
        
        try {
          if (params.items) {
            // Smart Shopping List - multiple items
            const items = typeof params.items === 'string' 
              ? JSON.parse(params.items) 
              : params.items;
            
            console.log('📦 Loading price data for Smart Shopping List:', items.length, 'items');
            
            if (params.analysisData) {
              const analysis = typeof params.analysisData === 'string'
                ? JSON.parse(params.analysisData)
                : params.analysisData;
              setAnalysisData(analysis);
            }
            
            // Load comparison data for each item
            const itemsWithPrices = [];
            for (const item of items) {
              if (isCancelled) break;
              
              try {
                const comparison = await getItemPriceComparison(item.name, user.uid);
                if (comparison && comparison.results && comparison.results.supermarkets) {
                  itemsWithPrices.push({
                    ...item,
                    priceComparison: { supermarkets: comparison.results.supermarkets }
                  });
                }
              } catch (error) {
                console.warn(`Failed to get price for ${item.name}:`, error);
                itemsWithPrices.push(item);
              }
            }
            
            if (!isCancelled) {
              setPriceData({ items: itemsWithPrices, type: 'smart_list' });
            }
            
          } else if (params.itemName) {
            // Individual item
            console.log('🔍 Loading price data for single item:', params.itemName);
            const comparison = await getItemPriceComparison(params.itemName, user.uid);
            
            if (comparison && comparison.results && comparison.results.supermarkets && !isCancelled) {
              setPriceData({ 
                singleItem: {
                  name: params.itemName,
                  priceComparison: { supermarkets: comparison.results.supermarkets }
                },
                type: 'single_item'
              });
            }
          } else {
            // Regular shopping list
            console.log('📝 Loading price data for regular shopping list');
            const itemsWithPrices = [];
            const itemsToProcess = shoppingItems.slice(0, 10);
            
            for (const item of itemsToProcess) {
              if (isCancelled) break;
              
              try {
                const comparison = await getItemPriceComparison(item.name, user.uid);
                if (comparison && comparison.results && comparison.results.supermarkets) {
                  itemsWithPrices.push({
                    ...item,
                    priceComparison: { supermarkets: comparison.results.supermarkets }
                  });
                }
              } catch (error) {
                console.warn(`Failed to get price for ${item.name}:`, error);
              }
            }
            
            if (!isCancelled) {
              setPriceData({ items: itemsWithPrices, type: 'regular_list' });
            }
          }
          
        } catch (error) {
          console.error('❌ Error loading price data:', error);
          if (!isCancelled) {
            Alert.alert('Error', 'Failed to load price comparison data');
          }
        } finally {
          if (!isCancelled) {
            setLoading(false);
          }
        }
      };

      loadPriceData();

      return () => {
        isCancelled = true;
      };

    }, [params.items, params.itemName, params.analysisData, user?.uid, aiEnabled]);

    // 🔧 FUNCTION FIXED TO ACCEPT ITEM - SUPERMARKET ONLY
    const handleAcceptItem = async (item, supermarket) => {
      try {
        console.log('🎯 Accept item called:', item.name, 'from', supermarket.name);
        
        // ✅ CHECK IF SUPERMARKET FUNCTION EXISTS
        const hasSupermarketLists = typeof addItemToSupermarketList === 'function';
        
        console.log('📋 Supermarket function available:', hasSupermarketLists);
        
        if (!hasSupermarketLists) {
          Alert.alert(
            'Error',
            'Supermarket list function is not available. Please check your app configuration.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // ✅ ADD DIRECTLY TO SUPERMARKET LIST
        await addToSupermarketSpecificList(item, supermarket);
        
      } catch (error) {
        console.error('❌ Error in handleAcceptItem:', error);
        Alert.alert('Error', 'Could not process item addition');
      }
    };

    // 🏪 ADD TO SPECIFIC SUPERMARKET LIST - FIXED
    const addToSupermarketSpecificList = async (item, supermarket) => {
      try {
        console.log('🏪 Adding to supermarket list:', item.name, 'to', supermarket.name);
        
        const supermarketId = supermarket.id || supermarket.name.toLowerCase().replace(/\s+/g, '_');
        
        const supermarketItem = {
          name: item.name || item.productName,
          productName: item.productName || item.name,
          price: item.price,
          priceDisplay: item.priceDisplay,
          url: item.url,
          inStock: item.inStock !== false,
          source: item.source,
          isRealData: item.isRealData || false,
          quantity: 1,
          unit: 'un',
          category: 'others',
        };

        console.log('🏪 Supermarket item to add:', supermarketItem);
        console.log('🏪 Supermarket ID:', supermarketId);

        const result = await addItemToSupermarketList(supermarketId, supermarketItem);
        console.log('✅ Supermarket add result:', result);
        
        if (result && result.success !== false) {
          setAcceptedItems(prev => [...prev, item.id || Date.now()]);
          Alert.alert(
            'Added to Supermarket List!',
            `${supermarketItem.name} (${item.priceDisplay}) added to ${supermarket.name} list.`,
            [
              { text: 'OK' },
              { 
                text: 'View Supermarket Lists', 
                onPress: () => router.push('/(auth)/SupermarketListsScreen')
              }
            ]
          );
        } else {
          throw new Error(result?.error || 'Failed to add item to supermarket list');
        }
        
      } catch (error) {
        console.error('❌ Error adding to supermarket list:', error);
        Alert.alert(
          'Error',
          `Could not add ${item.name} to ${supermarket.name} list. Error: ${error.message}`,
          [
            { text: 'OK' },
            {
              text: 'Try Again',
              onPress: () => addToSupermarketSpecificList(item, supermarket)
            }
          ]
        );
      }
    };

    // 🔧 ORGANIZE DATA BY SUPERMARKET
    const getOrganizedData = () => {
      if (!priceData) return [];
      
      if (priceData.type === 'single_item') {
        return priceData.singleItem.priceComparison?.supermarkets || [];
      }
      
      const supermarketMap = {};
      
      priceData.items.forEach(item => {
        if (item.priceComparison?.supermarkets) {
          item.priceComparison.supermarkets.forEach(supermarket => {
            if (!supermarketMap[supermarket.id]) {
              supermarketMap[supermarket.id] = {
                ...supermarket,
                items: []
              };
            }
            
            if (supermarket.items) {
              supermarket.items.forEach(marketItem => {
                supermarketMap[supermarket.id].items.push({
                  ...marketItem,
                  originalItem: item,
                  isAccepted: acceptedItems.includes(marketItem.id)
                });
              });
            }
          });
        }
      });
      
      return Object.values(supermarketMap).sort((a, b) => {
        const avgA = a.items.reduce((sum, item) => sum + item.price, 0) / a.items.length;
        const avgB = b.items.reduce((sum, item) => sum + item.price, 0) / b.items.length;
        return avgA - avgB;
      });
    };

    // 🔧 SEARCH FILTER
    const filteredSupermarkets = getOrganizedData().filter(supermarket => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        supermarket.name.toLowerCase().includes(query) ||
        supermarket.items.some(item => 
          item.name?.toLowerCase().includes(query) ||
          item.productName?.toLowerCase().includes(query)
        )
      );
    });

    // 🔧 ADAPTED HEADER
    const getHeaderTitle = () => {
      if (params.source === 'smart_shopping_full') {
        return 'Smart List Price Analysis';
      } else if (params.source === 'smart_shopping_item') {
        return `Price Comparison: ${params.focusItem || 'Item'}`;
      } else if (priceData?.type === 'single_item') {
        return `Prices: ${priceData.singleItem.name}`;
      }
      return 'Price Comparison';
    };

    // 🔧 FIX FOR BUG: ANALYSIS SUMMARY
    const renderAnalysisSummary = () => {
      if (!analysisData || priceData?.type === 'single_item') return null;
      
      const bestStore = analysisData.bestValue;
      
      // ✅ FIX: Convert params.budget to number
      const totalBudget = Number(params.budget) || 0;
      
      // ✅ ADD EXTRA VALIDATION
      if (isNaN(totalBudget)) {
        console.warn('⚠️ Budget is not a valid number:', params.budget);
        return null;
      }
      
      return (
        <Card style={styles.analysisSummary}>
          <Text style={styles.analysisSummaryTitle}>💡 Smart Analysis Summary</Text>
          <View style={styles.analysisSummaryContent}>
            <View style={styles.analysisSummaryItem}>
              <Text style={styles.analysisSummaryLabel}>Best Overall Store:</Text>
              <Text style={styles.analysisSummaryValue}>{bestStore?.name || 'N/A'}</Text>
            </View>
            <View style={styles.analysisSummaryItem}>
              <Text style={styles.analysisSummaryLabel}>Total Cost:</Text>
              <Text style={styles.analysisSummaryValue}>
                £{bestStore?.total ? Number(bestStore.total).toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={styles.analysisSummaryItem}>
              <Text style={styles.analysisSummaryLabel}>Budget:</Text>
              <Text style={styles.analysisSummaryValue}>£{totalBudget.toFixed(2)}</Text>
            </View>
            <View style={styles.analysisSummaryItem}>
              <Text style={styles.analysisSummaryLabel}>Items Added:</Text>
              <Text style={[styles.analysisSummaryValue, styles.addedItemsValue]}>
                {acceptedItems.length}
              </Text>
            </View>
          </View>
        </Card>
      );
    };

    // 🔧 DEBUG LOG IN COMPONENT
    console.log('🔧 PriceComparison render - Current state:', {
      loading,
      aiEnabled,
      priceDataType: priceData?.type,
      filteredSupermarketsCount: filteredSupermarkets.length,
      acceptedItemsCount: acceptedItems.length
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBackPress}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color="#4B0082"
                    />
                </TouchableOpacity>
                <Text style={styles.title}>{getHeaderTitle()}</Text>
                <TouchableOpacity
                    style={styles.headerAction}
                    onPress={() => router.push('/(auth)/SupermarketListsScreen')}
                >
                    <Ionicons name="storefront" size={24} color="#4B0082" />
                </TouchableOpacity>
            </View>
        
            {!aiEnabled ? (
                <View style={styles.aiDisabledContainer}>
                    <Ionicons
                        name="bulb-outline"
                        size={100}
                        color="#A0AEC0"
                    />
                    <Text style={styles.aiDisabledTitle}>AI features disabled</Text>
                    <Text style={styles.aiDisabledText}>
                        Price comparison requires AI features to be enabled.
                        Please enable them in your user profile to use this feature.
                    </Text>
                    <TouchableOpacity
                        style={styles.aiEnableButton}
                        onPress={() => router.push('/(auth)/ProfileScreen')}
                    >
                        <Text style={styles.aiEnableButtonText}>Go to Profile</Text>
                    </TouchableOpacity>
                </View>
            ) : loading ? (
                <View style={styles.loadingContainer}>
                    <LoadingSpinner size="large" />
                    <Text style={styles.loadingText}>
                        {priceData?.type === 'smart_list' ? 
                            'Analyzing Smart Shopping List prices...' :
                            'Fetching price comparison data...'
                        }
                    </Text>
                </View>
            ) : filteredSupermarkets.length === 0 ? (
                <View style={styles.noDataContainer}>
                    <Ionicons
                        name="storefront-outline"
                        size={100}
                        color="#A0AEC0"
                    />
                    <Text style={styles.noDataTitle}>No Price Data Available</Text>
                    <Text style={styles.noDataText}>
                        Unable to fetch price information for the selected items.
                        {searchQuery && ` Try adjusting your search term "${searchQuery}".`}
                    </Text>
                    {searchQuery && (
                        <TouchableOpacity
                            style={styles.clearSearchButton}
                            onPress={() => setSearchQuery('')}
                        >
                            <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <>
                    {/* ANALYSIS SUMMARY */}
                    {renderAnalysisSummary()}
                
                    {/* SEARCH BAR */}
                    <View style={styles.searchContainer}>
                        <Ionicons
                            name="search"
                            size={20}
                            color="#A0AEC0"
                            style={styles.searchIcon}
                        />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search supermarkets or items..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                        />
                        {searchQuery !== '' && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={() => setSearchQuery('')}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={20}
                                    color="#A0AEC0"
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* QUICK STATS */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{filteredSupermarkets.length}</Text>
                            <Text style={styles.statLabel}>Stores</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>
                                {filteredSupermarkets.reduce((sum, s) => sum + s.items.length, 0)}
                            </Text>
                            <Text style={styles.statLabel}>Options</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{acceptedItems.length}</Text>
                            <Text style={styles.statLabel}>Added</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>
                                £{filteredSupermarkets.length > 0 ? 
                                  Math.min(...filteredSupermarkets.flatMap(s => s.items.map(i => i.price))).toFixed(2) : 
                                  '0.00'}
                            </Text>
                            <Text style={styles.statLabel}>Cheapest</Text>
                        </View>
                    </View>

                    {/* SUPERMARKET LIST */}
                    <FlatList
                        data={filteredSupermarkets}
                        renderItem={({ item }) => (
                            <SupermarketCard
                                supermarket={item}
                                onAcceptItem={handleAcceptItem}
                                fromSmartShopping={params.source?.includes('smart_shopping')}
                            />
                        )}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={styles.emptySearchContainer}>
                                <Text style={styles.emptySearchText}>
                                    No supermarkets found for "{searchQuery}"
                                </Text>
                            </View>
                        )}
                    />
                    
                    {/* FLOATING BUTTON FOR SUPERMARKET LISTS */}
                    {acceptedItems.length > 0 && (
                        <TouchableOpacity
                            style={styles.floatingButton}
                            onPress={() => router.push('/(auth)/SupermarketListsScreen')}
                        >
                            <View style={styles.floatingButtonContent}>
                                <Ionicons name="storefront" size={20} color="#fff" />
                                <Text style={styles.floatingButtonText}>
                                    View Lists ({acceptedItems.length})
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    
                    <View style={styles.disclaimerContainer}>
                        <Text style={styles.disclaimerText}>
                            {params.isMockData 
                              ? 'Prices are simulated data for demonstration purposes.'
                              : 'Prices may vary and are subject to availability. Always check store websites for current prices.'
                            }
                        </Text>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        padding: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        flex: 1,
        textAlign: 'center',
    },
    headerAction: {
        padding: 10,
    },
    
    // 🏪 SUPERMARKET CARD STYLES
    supermarketCard: {
        marginBottom: 15,
        paddingVertical: 0,
        paddingHorizontal: 0,
        overflow: 'hidden',
        borderLeftWidth: 4,
    },
    supermarketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
    },
    supermarketInfo: {
        flex: 1,
    },
    supermarketTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    supermarketIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    supermarketName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        flex: 1,
    },
    realDataBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#27ae60',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    realDataText: {
        fontSize: 10,
        color: '#fff',
        marginLeft: 2,
        fontWeight: 'bold',
    },
    estimatedBadge: {
        backgroundColor: '#f39c12',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    estimatedText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bestPrice: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    priceValue: {
        color: '#27ae60',
        fontWeight: 'bold',
        fontSize: 18,
    },
    itemCount: {
        fontSize: 12,
        color: '#95a5a6',
    },
    smartShoppingHint: {
        fontSize: 12,
        color: '#9b59b6',
        marginTop: 4,
        fontStyle: 'italic',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginRight: 10,
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    expandIcon: {
        marginLeft: 5,
    },

    // 🔧 EXPANDED CONTENT
    expandedContent: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderTopWidth: 1,
        borderTopColor: '#ecf0f1',
        paddingTop: 15,
        backgroundColor: '#fafbfc',
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 10,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    itemInfo: {
        flex: 1,
        marginRight: 10,
    },
    itemName: {
        fontSize: 14,
        color: '#2C3E50',
        fontWeight: '500',
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    itemSource: {
        fontSize: 11,
        color: '#95a5a6',
        marginRight: 10,
    },
    outOfStock: {
        fontSize: 11,
        color: '#e74c3c',
        fontWeight: 'bold',
    },
    itemActions: {
        alignItems: 'flex-end',
    },
    itemPrice: {
        fontSize: 14,
        color: '#7f8c8d',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    bestItemPrice: {
        color: '#27ae60',
        fontSize: 16,
    },
    bestBadge: {
        backgroundColor: '#27ae60',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 6,
        marginBottom: 2,
    },
    bestBadgeText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: 'bold',
    },
    addItemButton: {
        padding: 2,
    },
    summaryRow: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    summaryText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },

    // 📊 ANALYSIS AND STATISTICS
    analysisSummary: {
        margin: 20,
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderLeftWidth: 4,
        borderLeftColor: '#9b59b6',
    },
    analysisSummaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 12,
    },
    analysisSummaryContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    analysisSummaryItem: {
        width: '48%',
        marginBottom: 8,
    },
    analysisSummaryLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        marginBottom: 2,
    },
    analysisSummaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    addedItemsValue: {
        color: '#9b59b6',
    },
    
    // 🔍 SEARCH AND FILTERS
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginVertical: 15,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#2C3E50',
    },
    clearButton: {
        padding: 5,
    },
    
    // 📈 STATISTICS
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 10,
        paddingVertical: 15,
        borderRadius: 10,
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
        elevation: 2,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    statLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 2,
    },

    // 📱 LIST AND CONTENT
    listContent: {
        padding: 20,
        paddingTop: 5,
        paddingBottom: 100,
    },
    
    // 🔄 LOADING AND ERROR STATES
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
    },
    aiDisabledContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    aiDisabledTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7f8c8d',
        marginBottom: 10,
        textAlign: 'center',
        marginTop: 20,
    },
    aiDisabledText: {
        fontSize: 16,
        color: '#95a5a6',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    aiEnableButton: {
        backgroundColor: '#3498db',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    aiEnableButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    noDataTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7f8c8d',
        marginBottom: 10,
        textAlign: 'center',
        marginTop: 20,
    },
    noDataText: {
        fontSize: 16,
        color: '#95a5a6',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    clearSearchButton: {
        backgroundColor: '#e74c3c',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 15,
    },
    clearSearchButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptySearchContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptySearchText: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
    },

    // 🔄 FLOATING BUTTON
    floatingButton: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        backgroundColor: '#9b59b6',
        borderRadius: 25,
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',

        elevation: 5,
    },
    floatingButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    floatingButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
    },

    // 📝 DISCLAIMER
    disclaimerContainer: {
        padding: 15,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ecf0f1',
        backgroundColor: '#fff',
    },
    disclaimerText: {
        fontSize: 12,
        color: '#95a5a6',
        textAlign: 'center',
        lineHeight: 16,
    },
});

export default PriceComparison;