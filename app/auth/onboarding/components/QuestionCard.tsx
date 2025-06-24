import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';

const proto = Colors.proto;

interface QuestionCardProps {
  title: string;
  subtitle?: string;
  options: {
    label: string;
    value: string;
  }[];
  selectedValues: string[];
  onSelect: (value: string) => void;
  multiSelect?: boolean;
}

export default function QuestionCard({
  title,
  subtitle,
  options,
  selectedValues,
  onSelect,
  multiSelect = false,
}: QuestionCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: proto.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: proto.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  optionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: proto.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  optionSelected: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  optionText: {
    fontSize: 16,
    color: proto.text,
    flex: 1,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: proto.buttonText,
    fontWeight: '600',
  },
}); 