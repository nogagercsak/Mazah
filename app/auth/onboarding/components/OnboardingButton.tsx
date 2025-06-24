import { Colors } from '@/constants/Colors';
import React from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator 
} from 'react-native';

const proto = Colors.proto;

interface OnboardingButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function OnboardingButton({
  onPress,
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: OnboardingButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={isPrimary ? proto.buttonText : proto.accent} 
          size="small" 
        />
      ) : (
        <Text 
          style={[
            styles.buttonText,
            isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary,
            disabled && styles.buttonTextDisabled,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: proto.accent,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: proto.accent,
  },
  buttonDisabled: {
    backgroundColor: proto.border,
    borderColor: proto.border,
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  buttonTextPrimary: {
    color: proto.buttonText,
  },
  buttonTextSecondary: {
    color: proto.accent,
  },
  buttonTextDisabled: {
    color: proto.textSecondary,
  },
}); 