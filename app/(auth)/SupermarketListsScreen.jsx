// SupermarketListsScreen.jsx - CORRIGIDO PARA EXPORTAR PARA SHOPPING LIST
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Hooks
import { useSupermarketLists } from '@/hooks/useSupermarketLists';
import { useShoppingList } from '@/hooks/useShoppingList';

// Components
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ConfirmModal from '@/components/common/ConfirmModal';

// 🏪 COMPONENTE DE CARTÃO DE SUPERMERCADO
const SupermarketListCard = ({ 
  supermarket, 
  onPress, 
  onClearList, 
  onExportToMain 
}) => {
  const stats = supermarket.stats || {};
  
  return (
    <Card style={[styles.supermarketCard, { borderLeftColor: supermarket.color }]}>
      <TouchableOpacity style={styles.cardContent} onPress={() => onPress(supermarket)}>
        {/* CABEÇALHO */}
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.supermarketIcon}>{supermarket.icon}</Text>
            <Text style={styles.supermarketName}>{supermarket.name}</Text>
            {stats.totalItems > 0 && (
              <View style={[styles.itemCountBadge, { backgroundColor: supermarket.color }]}>
                <Text style={styles.itemCountText}>{stats.totalItems}</Text>
              </View>
            )}
          </View>
          
          {stats.totalItems > 0 && (
            <Text style={styles.lastUpdated}>
              Updated {new Date(supermarket.updatedAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* ESTATÍSTICAS */}
        {stats.totalItems > 0 ? (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>£{stats.totalEstimated.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.uncheckedItems}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completionPercentage}%</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>No items yet</Text>
            <Text style={styles.emptyListSubtext}>Add items from price comparison</Text>
          </View>
        )}

        {/* BARRA DE PROGRESSO */}
        {stats.totalItems > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${stats.completionPercentage}%`,
                    backgroundColor: supermarket.color
                  }
                ]}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* AÇÕES */}
      {stats.totalItems > 0 && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={() => onExportToMain(supermarket)}
          >
            <Ionicons name="arrow-forward" size={16} color="#3498db" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={() => onClearList(supermarket)}
          >
            <Ionicons name="trash-outline" size={16} color="#e74c3c" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

// 🔧 COMPONENTE PRINCIPAL - CORRIGIDO
const SupermarketListsScreen = () => {
  const router = useRouter();
  const {
    supermarketLists,
    loading,
    clearSupermarketList,
    getOverallStats,
    getAllListsWithStats
  } = useSupermarketLists();
  
  // ✅ CORREÇÃO: Usar o nome correto da função do hook
  const { addItem: addItemToMainList } = useShoppingList();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSupermarket, setSelectedSupermarket] = useState(null);
  const [actionType, setActionType] = useState(''); // 'clear' or 'export'

  // 📊 ESTATÍSTICAS GERAIS
  const overallStats = getOverallStats();
  
  // 🔍 FILTRAR LISTAS POR BUSCA
  const allLists = getAllListsWithStats();
  const filteredLists = allLists.filter(supermarket => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      supermarket.name.toLowerCase().includes(query) ||
      supermarket.items.some(item => 
        item.name.toLowerCase().includes(query) ||
        item.productName?.toLowerCase().includes(query)
      )
    );
  });

  // 🏪 NAVEGAR PARA LISTA ESPECÍFICA
  const handleOpenSupermarketList = (supermarket) => {
    router.push({
      pathname: '/(auth)/SupermarketListDetail',
      params: { 
        supermarketId: supermarket.id,
        supermarketName: supermarket.name,
        supermarketIcon: supermarket.icon,
        supermarketColor: supermarket.color
      }
    });
  };

  // 🗑️ PREPARAR LIMPEZA DE LISTA
  const handleClearList = (supermarket) => {
    setSelectedSupermarket(supermarket);
    setActionType('clear');
    setShowConfirmModal(true);
  };

  // 📤 PREPARAR EXPORTAÇÃO PARA LISTA PRINCIPAL
  const handleExportToMain = (supermarket) => {
    setSelectedSupermarket(supermarket);
    setActionType('export');
    setShowConfirmModal(true);
  };

  // ✅ FUNÇÃO CORRIGIDA PARA EXPORTAR PARA LISTA PRINCIPAL
  const exportToMainShoppingList = async (supermarketId) => {
    try {
      console.log('📤 Exporting supermarket list to main list:', supermarketId);
      
      const list = supermarketLists[supermarketId];
      if (!list || !list.items.length) {
        return { success: false, error: 'No items to export' };
      }

      // ✅ VERIFICAR SE A FUNÇÃO EXISTE
      if (!addItemToMainList || typeof addItemToMainList !== 'function') {
        console.error('❌ addItemToMainList is not a valid function:', typeof addItemToMainList);
        return { 
          success: false, 
          error: 'Shopping list function is not available. Please check your app configuration.' 
        };
      }

      let successCount = 0;
      let errorCount = 0;

      for (const item of list.items) {
        try {
          // ✅ CORREÇÃO: addItem espera 6 parâmetros separados, não um objeto
          const name = item.name || 'Unnamed Item';
          const quantity = Number(item.quantity) || 1;
          const unit = item.unit || 'un';
          const estimatedPrice = (item.price && typeof item.price === 'number') ? item.price : null;
          const category = 'others'; // String simples
          const note = item.priceDisplay 
            ? `From ${list.name} - ${item.priceDisplay}`
            : item.price 
            ? `From ${list.name} - £${item.price.toFixed(2)}`
            : `From ${list.name}`;

          console.log('📦 Exporting item with params:', { name, quantity, unit, estimatedPrice, category, note });

          // ✅ CHAMAR COM OS PARÂMETROS CORRETOS
          const result = await addItemToMainList(name, quantity, unit, estimatedPrice, category, note);
          console.log('✅ Export result for', item.name, ':', result);
          
          // ✅ VERIFICAR RESULTADO CORRETAMENTE
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

  // ✅ CONFIRMAR AÇÃO - CORRIGIDO
  const handleConfirmAction = async () => {
    if (!selectedSupermarket) return;

    try {
      if (actionType === 'clear') {
        const result = await clearSupermarketList(selectedSupermarket.id);
        if (result.success) {
          Alert.alert('Success', `Cleared ${result.clearedCount} items from ${selectedSupermarket.name} list`);
        } else {
          throw new Error(result.error);
        }
      } else if (actionType === 'export') {
        // ✅ USAR FUNÇÃO CORRIGIDA
        const result = await exportToMainShoppingList(selectedSupermarket.id);
        if (result.success) {
          Alert.alert(
            'Success', 
            result.message,
            [
              { text: 'OK' },
              { 
                text: 'View Main List', 
                onPress: () => router.push('/(auth)/Shopping_list')
              }
            ]
          );
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error('❌ Error in handleConfirmAction:', error);
      Alert.alert('Error', error.message);
    } finally {
      setShowConfirmModal(false);
      setSelectedSupermarket(null);
      setActionType('');
    }
  };

  // 📱 RENDERIZAR ITEM DA LISTA
  const renderSupermarketItem = ({ item }) => (
    <SupermarketListCard
      supermarket={item}
      onPress={handleOpenSupermarketList}
      onClearList={handleClearList}
      onExportToMain={handleExportToMain}
    />
  );

  // 📊 RENDERIZAR RESUMO GERAL
  const renderOverallStats = () => (
    <Card style={styles.overallStatsCard}>
      <Text style={styles.overallStatsTitle}>📊 Overall Summary</Text>
      <View style={styles.overallStatsContent}>
        <View style={styles.overallStatItem}>
          <Text style={styles.overallStatValue}>{overallStats.activeListsCount}</Text>
          <Text style={styles.overallStatLabel}>Active Lists</Text>
        </View>
        <View style={styles.overallStatItem}>
          <Text style={styles.overallStatValue}>{overallStats.totalItemsCount}</Text>
          <Text style={styles.overallStatLabel}>Total Items</Text>
        </View>
        <View style={styles.overallStatItem}>
          <Text style={styles.overallStatValue}>£{overallStats.totalEstimatedValue.toFixed(2)}</Text>
          <Text style={styles.overallStatLabel}>Total Value</Text>
        </View>
        <View style={styles.overallStatItem}>
          <Text style={styles.overallStatValue}>{overallStats.overallCompletionPercentage}%</Text>
          <Text style={styles.overallStatLabel}>Completed</Text>
        </View>
      </View>
      
      {overallStats.cheapestList && (
        <View style={styles.insightContainer}>
          <Text style={styles.insightText}>
            💡 Best value: <Text style={styles.insightHighlight}>{overallStats.cheapestList.name}</Text> 
            {' '}(£{overallStats.cheapestList.totalEstimated.toFixed(2)})
          </Text>
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4B0082" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Supermarket Lists</Text>
        
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => router.push('/(auth)/Price-Comparison')}
        >
          <Ionicons name="add" size={24} color="#4B0082" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Loading supermarket lists...</Text>
        </View>
      ) : (
        <>
          {/* RESUMO GERAL */}
          {overallStats.totalItemsCount > 0 && renderOverallStats()}

          {/* BARRA DE BUSCA */}
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

          {/* LISTA DE SUPERMERCADOS */}
          {filteredLists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="storefront-outline"
                size={100}
                color="#A0AEC0"
              />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matches found' : 'No supermarket lists yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? `No supermarkets or items match "${searchQuery}"`
                  : 'Start by comparing prices to add items to supermarket-specific lists'
                }
              </Text>
              {!searchQuery && (
                <Button
                  title="Compare Prices"
                  onPress={() => router.push('/(auth)/Price-Comparison')}
                  style={styles.emptyButton}
                />
              )}
            </View>
          ) : (
            <FlatList
              data={filteredLists}
              renderItem={renderSupermarketItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* MODAL DE CONFIRMAÇÃO */}
          <ConfirmModal
            visible={showConfirmModal}
            title={actionType === 'clear' ? 'Clear List' : 'Export to Main List'}
            message={
              actionType === 'clear'
                ? `Are you sure you want to clear all items from ${selectedSupermarket?.name} list?`
                : `Export all items from ${selectedSupermarket?.name} to your main shopping list?`
            }
            onConfirm={handleConfirmAction}
            onCancel={() => {
              setShowConfirmModal(false);
              setSelectedSupermarket(null);
              setActionType('');
            }}
            confirmText={actionType === 'clear' ? 'Clear' : 'Export'}
            cancelText="Cancel"
            confirmStyle={actionType === 'clear' ? 'destructive' : 'default'}
          />
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

  // 🔄 LOADING
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

  // 📊 ESTATÍSTICAS GERAIS
  overallStatsCard: {
    margin: 20,
    padding: 16,
  },
  overallStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  overallStatsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  overallStatItem: {
    alignItems: 'center',
  },
  overallStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  overallStatLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  insightContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  insightText: {
    fontSize: 13,
    color: '#2C3E50',
  },
  insightHighlight: {
    fontWeight: 'bold',
    color: '#3498db',
  },

  // 🔍 BUSCA
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

  // 🏪 CARTÃO DE SUPERMERCADO
  supermarketCard: {
    marginBottom: 15,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 15,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  itemCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#95a5a6',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  emptyListContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyListText: {
    fontSize: 16,
    color: '#95a5a6',
    marginBottom: 4,
  },
  emptyListSubtext: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    backgroundColor: '#fafbfc',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
  },
  exportButton: {
    borderColor: '#3498db',
    backgroundColor: '#fff',
  },
  exportButtonText: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  clearButton: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff',
  },
  clearButtonText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },

  // 📱 LISTA E CONTEÚDO
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // 🔄 ESTADO VAZIO
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 10,
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 20,
    width: 200,
  },
});

export default SupermarketListsScreen;