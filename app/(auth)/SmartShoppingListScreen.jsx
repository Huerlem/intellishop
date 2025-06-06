// SmartShoppingScreen.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Hooks
import { useSmartShopping } from '@/hooks/useSmartShopping';
import { useStock } from '@/hooks/useStock';
import { useShoppingList } from '@/hooks/useShoppingList';

// Components
import SmartShoppingItem from '@/components/shopping/SmartShoppingItem';
import SmartShoppingSummary from '@/components/shopping/SmartShoppingSummary';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// 🔧 IMPORTAR SEU PRICE COMPARISON SERVICE
import { 
  analyzeShoppingListPrices,
  getItemPriceComparison 
} from '@/services/priceComparison';

// 🔧 IMPORT DO CONTEXTO DE AUTENTICAÇÃO PARA USER ID
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

const SmartShoppingScreen = () => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext); // 🔧 OBTER USER ID
  const { stockItems, fetchStockItems } = useStock();
  const { items: shoppingHistory, addItemToList } = useShoppingList();
  const { 
    loading, 
    smartList, 
    error, 
    generateList, 
    addToShoppingList 
  } = useSmartShopping();

  const [budget, setBudget] = useState('30');
  const [showForm, setShowForm] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [priceLoading, setPriceLoading] = useState(false); // 🔧 LOADING PARA PRICE COMPARISON
  const [userPreferences, setUserPreferences] = useState({
    dietaryRestrictions: ''
  });

  const handleGenerateList = async () => {
    const budgetValue = parseFloat(budget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      Alert.alert('Error', 'Please enter a valid budget value.');
      return;
    }

    try {
      console.log('🚀 Iniciando geração da smart list...');
      console.log('AI Enabled:', aiEnabled);
      
      await fetchStockItems();
      const currentStock = stockItems || [];
      
      if (currentStock.length === 0) {
        console.log('⚠️ Nenhum item no estoque, gerando lista básica...');
      }

      await proceedWithGeneration(budgetValue, currentStock);

    } catch (err) {
      console.error('❌ Error generating list:', err);
      Alert.alert('Error', `Could not generate smart shopping list: ${err.message}`);
    }
  };

  const proceedWithGeneration = async (budgetValue, currentStock) => {
    try {
      console.log('📋 Generating list with:');
      console.log('- Budget:', budgetValue);
      console.log('- Stock items:', currentStock.length);
      console.log('- History:', shoppingHistory?.length || 0);

      const result = await generateList(budgetValue, currentStock, shoppingHistory, userPreferences);

      if (result) {
        console.log('✅ Smart list generated successfully');
        setShowForm(false);
      } else {
        throw new Error('No result returned from generateList');
      }

    } catch (err) {
      console.error('❌ Error in proceedWithGeneration:', err);
      Alert.alert('Error', `Could not generate smart shopping list: ${err.message}`);
    }
  };

  const handleAddItemToList = async (item) => {
    try {
      await addItemToList({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category || '',
        checked: false,
        note: item.reason || 'Added from smart list',
        estimatedPrice: item.estimatedPrice
      });

      Alert.alert('Success', `${item.name} added to your shopping list.`);
    } catch (err) {
      console.error('Error adding item:', err);
      Alert.alert('Error', 'Could not add item to shopping list.');
    }
  };

  const handleAddAllToList = async () => {
    try {
      const result = await addToShoppingList(addItemToList);

      if (result) {
        Alert.alert(
          'Success', 
          'All items have been added to your shopping list.',
          [
            { text: 'OK' },
            { 
              text: 'View List', 
              onPress: () => navigation.navigate('Shopping_list')
            }
          ]
        );
      } else {
        throw new Error('Failed to add items');
      }
    } catch (err) {
      console.error('Error adding all items:', err);
      Alert.alert('Error', 'Could not add items to shopping list.');
    }
  };

  // 🔧 NOVA FUNÇÃO: Comparar Preços da Lista Completa (CORRIGIDA)
  const handleCompareAllPrices = async () => {
    if (!smartList || !smartList.items || smartList.items.length === 0) {
      Alert.alert('No Items', 'Generate a smart list first before comparing prices.');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'Please log in to compare prices.');
      return;
    }

    try {
      setPriceLoading(true);
      console.log('🔍 Iniciando análise de preços para', smartList.items.length, 'itens...');

      // 🔧 USAR SEU analyzeShoppingListPrices
      const analysis = await analyzeShoppingListPrices(smartList.items, user.uid);

      if (analysis && analysis.success) {
        console.log('✅ Análise de preços concluída');
        
        // ✅ CORREÇÃO: Converter objeto para string JSON
        navigation.navigate('Price-Comparison', {
          analysisData: JSON.stringify(analysis), // ✅ CONVERTIDO PARA STRING
          items: JSON.stringify(smartList.items), // ✅ CONVERTIDO PARA STRING
          budget: budget.toString(),
          source: 'smart_shopping_full',
          totalEstimatedCost: smartList.totalEstimatedCost?.toString() || '0',
          smartListId: smartList.id?.toString() || ''
        });
      } else {
        throw new Error(analysis?.error || 'Failed to analyze prices');
      }
      
    } catch (error) {
      console.error('❌ Erro na análise de preços:', error);
      Alert.alert(
        'Error', 
        `Could not analyze prices: ${error.message}\n\nWould you like to try with mock data?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Use Mock Data', 
            onPress: () => navigateWithMockData()
          }
        ]
      );
    } finally {
      setPriceLoading(false);
    }
  };

  // 🔧 NOVA FUNÇÃO: Comparar Item Individual (CORRIGIDA)
  const handleCompareItem = async (item) => {
    if (!user?.uid) {
      Alert.alert('Error', 'Please log in to compare prices.');
      return;
    }

    try {
      console.log('🔍 Comparando preço para:', item.name);
      setPriceLoading(true);

      // 🔧 USAR SEU getItemPriceComparison
      const comparison = await getItemPriceComparison(item.name, user.uid);

      if (comparison && comparison.success) {
        console.log('✅ Comparação de item concluída');
        
        // ✅ CORREÇÃO: Converter objeto para string JSON
        navigation.navigate('Price-Comparison', {
          itemComparison: JSON.stringify(comparison), // ✅ CONVERTIDO PARA STRING
          items: JSON.stringify([item]), // ✅ CONVERTIDO PARA STRING
          budget: smartList?.budget?.toString() || '0',
          source: 'smart_shopping_item',
          focusItem: item.name
        });
      } else {
        throw new Error(comparison?.error || 'Failed to compare item prices');
      }

    } catch (error) {
      console.error('❌ Erro na comparação do item:', error);
      Alert.alert('Error', `Could not compare prices for ${item.name}: ${error.message}`);
    } finally {
      setPriceLoading(false);
    }
  };

  // 🔧 FUNÇÃO FALLBACK: Dados Mock caso APIs falhem (CORRIGIDA)
  const navigateWithMockData = () => {
    const mockAnalysis = {
      success: true,
      storeAnalysis: smartList.items.map(item => ({
        storeId: 'tesco',
        storeName: 'Tesco',
        total: item.estimatedPrice || 2.50,
        itemsAvailable: 1,
        savings: 0
      })),
      bestValue: {
        storeName: 'Aldi',
        total: smartList.totalEstimatedCost * 0.85
      }
    };

    // ✅ CORREÇÃO: Converter objetos para strings JSON
    navigation.navigate('Price-Comparison', {
      analysisData: JSON.stringify(mockAnalysis), // ✅ CONVERTIDO PARA STRING
      items: JSON.stringify(smartList.items), // ✅ CONVERTIDO PARA STRING
      budget: smartList.budget?.toString() || '0',
      source: 'smart_shopping_mock',
      isMockData: 'true' // ✅ CONVERTIDO PARA STRING
    });
  };

  const renderSmartItem = ({ item }) => (
    <SmartShoppingItem
      item={item}
      onAddToList={handleAddItemToList}
      onComparePrice={() => handleCompareItem(item)} // 🔧 PASSAR FUNÇÃO DE COMPARAÇÃO
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Smart Shopping List</Text>

        <View style={styles.headerRight}>
          {/* 🔧 BOTÃO PARA COMPARAR PREÇOS (USANDO SEU SERVICE) */}
          {!showForm && smartList && (
            <TouchableOpacity
              style={[styles.compareButton, priceLoading && styles.buttonDisabled]}
              onPress={handleCompareAllPrices}
              disabled={priceLoading}
            >
              {priceLoading ? (
                <LoadingSpinner size="small" color="#fff" />
              ) : (
                <Ionicons name="analytics" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.aiToggle, { backgroundColor: aiEnabled ? '#2ecc71' : '#e74c3c' }]}
            onPress={() => setAiEnabled(!aiEnabled)}
          >
            <Ionicons 
              name={aiEnabled ? "flash" : "flash-off"} 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="refresh" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="large" />
            <Text style={styles.loadingText}>
              Analyzing your stock and generating an optimized shopping list...
            </Text>
          </View>
        ) : showForm ? (
          <ScrollView contentContainerStyle={styles.formContainer}>
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>Configure Your Smart List</Text>
              <Text style={styles.formSubtitle}>
                Our AI will create an optimized shopping list based on your budget and stock needs.
              </Text>

              <View style={[styles.aiStatus, { backgroundColor: aiEnabled ? '#d5f4e6' : '#ffeaa7' }]}>
                <Ionicons 
                  name={aiEnabled ? "checkmark-circle" : "warning"} 
                  size={16} 
                  color={aiEnabled ? '#00b894' : '#fdcb6e'} 
                />
                <Text style={[styles.aiStatusText, { color: aiEnabled ? '#00b894' : '#fdcb6e' }]}>
                  AI {aiEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>

              <View style={styles.budgetField}>
                <Text style={styles.inputLabel}>Available Budget (£):</Text>
                <View style={styles.budgetInputContainer}>
                  <Text style={styles.currencySymbol}>£</Text>
                  <TextInput
                    style={styles.budgetInput}
                    value={budget}
                    onChangeText={setBudget}
                    keyboardType="numeric"
                    placeholder="30.00"
                  />
                </View>
              </View>

              <View style={styles.preferencesField}>
                <Text style={styles.inputLabel}>Dietary restrictions (optional):</Text>
                <TextInput
                  style={styles.preferencesInput}
                  value={userPreferences.dietaryRestrictions}
                  onChangeText={(text) => setUserPreferences(prev => ({ ...prev, dietaryRestrictions: text }))}
                  placeholder="E.g., vegetarian, gluten-free, lactose-free..."
                  multiline
                />
              </View>

              <View style={styles.infoContainer}>
                <Ionicons name="information-circle" size={20} color="#3498db" style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  The list will consider critical and low stock items, based on your budget of £{budget || '0'}.
                </Text>
              </View>

              <Button
                title="Generate Smart List"
                onPress={handleGenerateList}
                style={styles.generateButton}
              />
            </Card>
          </ScrollView>
        ) : (
          <FlatList
            data={smartList?.items || []}
            renderItem={renderSmartItem}
            keyExtractor={(item, index) => `smart-item-${index}`}
            ListHeaderComponent={() => (
              <>
                {/* 🔧 LOADING PARA PRICE COMPARISON */}
                {priceLoading && (
                  <Card style={styles.priceLoadingCard}>
                    <View style={styles.priceLoadingContent}>
                      <LoadingSpinner size="small" />
                      <Text style={styles.priceLoadingText}>
                        Analyzing prices across UK supermarkets...
                      </Text>
                    </View>
                  </Card>
                )}

                {error ? (
                  <Card style={styles.errorCard}>
                    <Ionicons name="warning" size={24} color="#e74c3c" style={styles.errorIcon} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => setShowForm(true)}
                    >
                      <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                  </Card>
                ) : smartList ? (
                  <SmartShoppingSummary
                    smartList={smartList}
                    onAddAllToList={handleAddAllToList}
                    onCompareAllPrices={handleCompareAllPrices} // 🔧 PASSAR FUNÇÃO DE COMPARAÇÃO
                    priceLoading={priceLoading} // 🔧 PASSAR LOADING STATE
                  />
                ) : null}

                {smartList?.items?.length > 0 && (
                  <Text style={styles.listTitle}>Suggested Items</Text>
                )}
              </>
            )}
            ListEmptyComponent={() => (
              <Card style={styles.emptyCard}>
                <Ionicons name="cart" size={48} color="#bdc3c7" />
                <Text style={styles.emptyTitle}>No Suggested Items</Text>
                <Text style={styles.emptyText}>
                  Unable to generate shopping suggestions. Try adjusting your budget or updating your stock.
                </Text>
                <Button
                  title="Try Again"
                  onPress={() => setShowForm(true)}
                  style={styles.emptyButton}
                />
              </Card>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compareButton: {
    backgroundColor: '#9b59b6',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  aiToggle: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
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
  priceLoadingCard: {
    marginBottom: 16,
    padding: 12,
  },
  priceLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLoadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  formContainer: {
    padding: 16,
  },
  formCard: {
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 16,
  },
  aiStatusText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  budgetField: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#2c3e50',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    height: 48,
    fontSize: 18,
  },
  preferencesField: {
    marginBottom: 16,
  },
  preferencesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#ebf5fb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#3498db',
  },
  generateButton: {
    marginTop: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  errorCard: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyCard: {
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  }
});

export default SmartShoppingScreen;