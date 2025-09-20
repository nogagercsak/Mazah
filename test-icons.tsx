import React from 'react';
import { View, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

const proto = Colors.proto;

export default function TestIcons() {
  const testIcons = [
    'lightbulb',
    'clock', 
    'cabinet',
    'star',
    'plus',
    'square.grid.2x2',
    'leaf.fill',
    'fork.knife',
    'drop'
  ];

  return (
    <View style={{ padding: 20, backgroundColor: 'white' }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Icon Test</Text>
      {testIcons.map((iconName, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <IconSymbol size={20} name={iconName as any} color={proto.accent} />
          <Text style={{ marginLeft: 10 }}>{iconName}</Text>
        </View>
      ))}
    </View>
  );
}