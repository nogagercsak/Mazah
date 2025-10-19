import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { FOOD_EXPIRATION_DATA } from '@/constants/food-expiration';

const proto = Colors.proto;

interface ExpirationSuggestion {
  foodName: string;
  fridgeDays: number;
  freezerDays: number;
  pantryDays: number;
  category: string;
}

interface ExpirationSuggestionsProps {
  onSuggestionSelect: (foodName: string, expirationDays: number, storage: string) => void;
  searchTerm: string;
}

export const ExpirationSuggestions: React.FC<ExpirationSuggestionsProps> = ({
  onSuggestionSelect,
  searchTerm,
}) => {
  // Calculate suggestions directly from the search term prop
  const suggestions = useMemo((): ExpirationSuggestion[] => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];

    const term = searchTerm.toLowerCase();
    return FOOD_EXPIRATION_DATA
      .filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      )
      .slice(0, 5) // Limit to 5 suggestions
      .map(item => ({
        foodName: item.name,
        fridgeDays: item.fridgeDays,
        freezerDays: item.freezerDays,
        pantryDays: item.pantryDays,
        category: item.category
      }));
  }, [searchTerm]);

  // Don't render if there are no suggestions
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const getStorageIcon = (storage: string) => {
    switch (storage) {
      case 'fridge':
        return 'thermometer';
      case 'freezer':
        return 'snowflake';
      case 'pantry':
        return 'cabinet';
      default:
        return 'cabinet';
    }
  };

  const handleSuggestionPress = (suggestion: ExpirationSuggestion, storage: 'fridge' | 'freezer' | 'pantry') => {
    const days = storage === 'fridge'
      ? suggestion.fridgeDays
      : storage === 'freezer'
        ? suggestion.freezerDays
        : suggestion.pantryDays;

    onSuggestionSelect(suggestion.foodName, days, storage);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconSymbol name="lightbulb" size={18} color={proto.accent} />
        <Text style={styles.headerText}>Tap to add</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsScroll}
      >
        {suggestions.map((suggestion, index) => (
          <View key={index} style={styles.suggestionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.suggestionName} numberOfLines={1}>
                {suggestion.foodName}
              </Text>
              <Text style={styles.categoryBadge}>{suggestion.category}</Text>
            </View>
            <Text style={styles.instructionText}>Choose storage:</Text>
            <View style={styles.storageOptions}>
              {suggestion.fridgeDays > 0 && (
                <TouchableOpacity
                  style={styles.storageButton}
                  onPress={() => handleSuggestionPress(suggestion, 'fridge')}
                  activeOpacity={0.7}
                >
                  <View style={styles.storageButtonContent}>
                    <IconSymbol name={getStorageIcon('fridge')} size={20} color="#FFFFFF" />
                    <Text style={styles.storageButtonLabel}>Fridge</Text>
                    <Text style={styles.storageButtonDays}>{suggestion.fridgeDays}d</Text>
                  </View>
                </TouchableOpacity>
              )}
              {suggestion.freezerDays > 0 && (
                <TouchableOpacity
                  style={styles.storageButton}
                  onPress={() => handleSuggestionPress(suggestion, 'freezer')}
                  activeOpacity={0.7}
                >
                  <View style={styles.storageButtonContent}>
                    <IconSymbol name={getStorageIcon('freezer')} size={20} color="#FFFFFF" />
                    <Text style={styles.storageButtonLabel}>Freezer</Text>
                    <Text style={styles.storageButtonDays}>{suggestion.freezerDays}d</Text>
                  </View>
                </TouchableOpacity>
              )}
              {suggestion.pantryDays > 0 && (
                <TouchableOpacity
                  style={styles.storageButton}
                  onPress={() => handleSuggestionPress(suggestion, 'pantry')}
                  activeOpacity={0.7}
                >
                  <View style={styles.storageButtonContent}>
                    <IconSymbol name={getStorageIcon('pantry')} size={20} color="#FFFFFF" />
                    <Text style={styles.storageButtonLabel}>Pantry</Text>
                    <Text style={styles.storageButtonDays}>{suggestion.pantryDays}d</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
    color: proto.text,
    letterSpacing: 0.2,
  },
  suggestionsScroll: {
    gap: 12,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    minWidth: 220,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  suggestionName: {
    fontSize: 17,
    fontWeight: '700',
    color: proto.text,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  categoryBadge: {
    fontSize: 11,
    color: proto.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  instructionText: {
    fontSize: 13,
    color: proto.textSecondary,
    marginBottom: 10,
    fontWeight: '600',
  },
  storageOptions: {
    flexDirection: 'column',
    gap: 8,
  },
  storageButton: {
    backgroundColor: proto.accent,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: proto.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  storageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  storageButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  storageButtonDays: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
