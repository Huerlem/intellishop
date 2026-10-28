import { Tabs } from 'expo-router';

import { colors, typography } from '@/src/theme';
import { HomeIcon, ListsIcon, PantryIcon } from '@/src/ui/icons';
import { PERMANENT_TABS } from './routes';

function tabIcon(name: (typeof PERMANENT_TABS)[number]['name'], color: string) {
  if (name === 'index') return <HomeIcon color={color} />;
  if (name === 'lists') return <ListsIcon color={color} />;
  return <PantryIcon color={color} />;
}

/**
 * Bottom navigation: exactly Home | Lists | Pantry (Figma V2 "IntelliShop/V2/Bottom Nav" 100:137:
 * white, 1 px top border, 72 pt bar + iOS safe area, 20 pt icon + Caption label,
 * active #4338CA, inactive #64748B). Icons come from the Figma component (src/ui/icons.tsx).
 * AI, Shopping Mode, store comparison and recipes are contextual flows, never tabs.
 * Uses the standard React Navigation tab bar so VoiceOver gets "<Title>, tab, n of 3" labels
 * and selected state.
 */
export function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.action.primary,
        tabBarInactiveTintColor: colors.content.muted,
        tabBarStyle: {
          backgroundColor: colors.surface.card,
          borderTopColor: colors.border.default,
          borderTopWidth: 1,
        },
        tabBarItemStyle: { minHeight: 56, paddingTop: 8 },
        tabBarLabelStyle: typography.caption,
      }}
    >
      {PERMANENT_TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title, tabBarIcon: ({ color }) => tabIcon(tab.name, color) }} />
      ))}
    </Tabs>
  );
}
