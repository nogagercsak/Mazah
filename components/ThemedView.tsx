import { View, ViewProps } from 'react-native';
import React from 'react';
import { Colors } from '@/constants/Colors';

export function ThemedView(props: ViewProps) {
  const { style, ...otherProps } = props;
  return (
    <View
      style={[
        {
          backgroundColor: Colors.proto.background,
        },
        style,
      ]}
      {...otherProps}
    />
  );
} 