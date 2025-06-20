import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

const { proto } = Colors;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: proto.accentDark,
        tabBarInactiveTintColor: proto.textSecondary,
        tabBarStyle: {
          backgroundColor: proto.card,
          borderTopColor: proto.shadow,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cabinet" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="cook"
        options={{
          title: 'Cook',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="fork.knife" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="share"
        options={{
          title: 'Share',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2" color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
