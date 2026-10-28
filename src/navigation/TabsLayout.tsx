import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { colors, iconSize, typography } from '@/src/theme';
import { PERMANENT_TABS } from './routes';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Bottom navigation: exactly Home | Lists | Pantry (Figma V2 "IntelliShop/V2/Bottom Nav").
 * AI, Shopping Mode, store comparison and recipes are contextual flows, never tabs.
 * Uses the standard React Navigation tab bar so VoiceOver gets "<Title>, tab, n of 3" labels
 * and selected state for free.
 */
export function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.action.primary,
        tabBarInactiveTintColor: colors.content.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface.card,
          borderTopColor: colors.border.default,
        },
        tabBarLabelStyle: typography.caption,
      }}
    >
      {PERMANENT_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={(focused ? tab.icon : `${tab.icon}-outline`) as IoniconName}
                size={iconSize.large}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
