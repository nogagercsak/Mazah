import { Pressable } from 'react-native';
import React from 'react';
import * as Haptics from 'expo-haptics';

export default function HapticTab(props: any) {
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onPress?.(e);
      }}
    />
  );
} 