import { Text, TextProps } from 'react-native';
import React from 'react';
import { Colors } from '@/constants/Colors';

export function ThemedText(props: TextProps) {
  const { style, ...otherProps } = props;
  return (
    <Text
      style={[
        {
          color: Colors.proto.text,
        },
        style,
      ]}
      {...otherProps}
    />
  );
} 