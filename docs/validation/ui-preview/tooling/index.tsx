import { AppRegistry, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppDataProvider } from '@/src/state/AppDataProvider';
import HomeScreen from '@/src/screens/HomeScreen';
import ListsScreen from '@/src/screens/ListsScreen';
import ListDetailScreen from '@/src/screens/ListDetailScreen';
import AddItemsScreen from '@/src/screens/AddItemsScreen';
import OptimiseScreen from '@/src/screens/OptimiseScreen';
import ShoppingModeScreen from '@/src/screens/ShoppingModeScreen';
import FinishShoppingScreen from '@/src/screens/FinishShoppingScreen';
import PantryUpdateScreen from '@/src/screens/PantryUpdateScreen';
import PantryScreen from '@/src/screens/PantryScreen';
import ProfileScreen from '@/src/screens/ProfileScreen';
import PlansScreen from '@/src/screens/PlansScreen';
import RecipesScreen from '@/src/screens/RecipesScreen';
import AiConsentScreen from '@/src/screens/AiConsentScreen';
import DeleteAccountScreen from '@/src/screens/DeleteAccountScreen';
import DietaryPreferencesScreen from '@/src/screens/DietaryPreferencesScreen';
import LegalDocumentScreen from '@/src/screens/LegalDocumentScreen';
import { RegisterScreen, WelcomeScreen } from '@/src/screens/auth/AuthScreens';
import { seed } from './seed';

const SCREENS: Record<string, [() => JSX.Element, string]> = {
  home: [HomeScreen, 'full'], 'home-trip': [HomeScreen, 'trip'], 'home-empty': [HomeScreen, 'empty'], lists: [ListsScreen, 'full'], list: [ListDetailScreen, 'trip'], add: [AddItemsScreen, 'full'],
  optimise: [OptimiseScreen, 'full'], shop: [ShoppingModeScreen, 'trip'], finish: [FinishShoppingScreen, 'trip'], update: [PantryUpdateScreen, 'finished'],
  pantry: [PantryScreen, 'full'], profile: [ProfileScreen, 'full'], plans: [PlansScreen, 'full'], recipes: [RecipesScreen, 'full'], consent: [AiConsentScreen, 'full'],
  delete: [DeleteAccountScreen, 'full'], dietary: [DietaryPreferencesScreen, 'full'], legal: [LegalDocumentScreen, 'full'], register: [RegisterScreen, 'empty'], welcome: [WelcomeScreen, 'empty'],
};
const name = location.hash.slice(1).split('?')[0] || 'home';
const [Screen, data] = SCREENS[name];
seed(data);

function App() {
  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <View style={{ height: '100%' }}>
          <Screen />
        </View>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('main', () => App);
AppRegistry.runApplication('main', { rootTag: document.getElementById('root') });
