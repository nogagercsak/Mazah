import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

const proto = Colors.proto;

export interface Ingredient {
  id: string;
  name: string;
  standard_unit: string;
}

export interface SelectedIngredient {
  id: string;
  quantity: number;
  unit: string;
  name?: string;
}

interface IngredientSelectorProps {
  availableIngredients: Ingredient[];
  selectedIngredients: SelectedIngredient[];
  onIngredientAdd: (ingredient: SelectedIngredient) => void;
  onIngredientUpdate: (index: number, field: 'quantity' | 'unit', value: string | number) => void;
  onIngredientRemove: (index: number) => void;
  loading?: boolean;
}

const commonUnits = ['g', 'kg', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'piece', 'pinch', 'handful'];

export default function IngredientSelector({
  availableIngredients,
  selectedIngredients,
  onIngredientAdd,
  onIngredientUpdate,
  onIngredientRemove,
  loading = false
}: IngredientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedUnitSelector, setExpandedUnitSelector] = useState<number | null>(null);

  // Filter ingredients based on search and exclude already selected ones
  const filteredIngredients = useMemo(() => {
    const selectedIds = new Set(selectedIngredients.map(ing => ing.id));
    return availableIngredients
      .filter(ing => 
        !selectedIds.has(ing.id) &&
        ing.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 8); // Limit results for better UX
  }, [availableIngredients, selectedIngredients, searchQuery]);

  const handleIngredientSelect = (ingredient: Ingredient) => {
    const newIngredient: SelectedIngredient = {
      id: ingredient.id,
      quantity: 1,
      unit: ingredient.standard_unit || 'g',
      name: ingredient.name
    };
    
    onIngredientAdd(newIngredient);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    const validatedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
    onIngredientUpdate(index, 'quantity', validatedValue);
  };

  const handleUnitChange = (index: number, unit: string) => {
    onIngredientUpdate(index, 'unit', unit);
    setExpandedUnitSelector(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading ingredients...</Text>
      </View>
    );
  }

  if (availableIngredients.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <IconSymbol size={32} name="exclamationmark.triangle" color={proto.textSecondary} />
        <Text style={styles.emptyStateTitle}>No Ingredients Available</Text>
        <Text style={styles.emptyStateText}>
          It looks like there are no ingredients available in the database. This might be due to:
          {'\n\n'}
          • Database setup not complete
          {'\n'}
          • Global ingredients not seeded
          {'\n'}
          • Permission issues
          {'\n\n'}
          Please check your database setup or contact support.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Ingredients</Text>
      
      {/* Add Ingredient Search */}
      <View style={styles.addIngredientSection}>
        <View style={styles.searchContainer}>
          <IconSymbol size={16} name="magnifyingglass" color={proto.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search and add ingredients..."
            placeholderTextColor={proto.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowDropdown(text.length > 0);
            }}
            onFocus={() => setShowDropdown(searchQuery.length > 0)}
            returnKeyType="done"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setShowDropdown(false);
              }}
              style={styles.clearButton}
            >
              <IconSymbol size={14} name="xmark" color={proto.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results Dropdown */}
        {showDropdown && filteredIngredients.length > 0 && (
          <View style={styles.dropdown}>
            <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
              {filteredIngredients.map(ingredient => (
                <TouchableOpacity
                  key={ingredient.id}
                  style={styles.dropdownItem}
                  onPress={() => handleIngredientSelect(ingredient)}
                >
                  <IconSymbol size={16} name="plus.circle" color={proto.accent} />
                  <Text style={styles.dropdownItemText}>{ingredient.name}</Text>
                  <Text style={styles.dropdownItemUnit}>({ingredient.standard_unit})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {showDropdown && filteredIngredients.length === 0 && searchQuery.length > 0 && (
          <View style={styles.dropdown}>
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No ingredients found for "{searchQuery}"</Text>
            </View>
          </View>
        )}
      </View>

      {/* Selected Ingredients */}
      {selectedIngredients.length > 0 && (
        <View style={styles.selectedIngredientsContainer}>
          <Text style={styles.selectedIngredientsTitle}>
            Selected Ingredients ({selectedIngredients.length})
          </Text>
          
          {selectedIngredients.map((ingredient, index) => {
            const ingredientData = availableIngredients.find(ing => ing.id === ingredient.id);
            const ingredientName = ingredient.name || ingredientData?.name || 'Unknown ingredient';
            
            return (
              <View key={`${ingredient.id}-${index}`} style={styles.ingredientCard}>
                <View style={styles.ingredientHeader}>
                  <Text style={styles.ingredientName}>{ingredientName}</Text>
                  <TouchableOpacity
                    onPress={() => onIngredientRemove(index)}
                    style={styles.removeButton}
                  >
                    <IconSymbol size={16} name="trash" color={proto.error} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.quantityRow}>
                  <View style={styles.quantityInputContainer}>
                    <Text style={styles.quantityLabel}>Quantity</Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={ingredient.quantity.toString()}
                      onChangeText={(value) => handleQuantityChange(index, value)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={proto.textSecondary}
                    />
                  </View>
                  
                  <View style={styles.unitSelectorContainer}>
                    <Text style={styles.unitLabel}>Unit</Text>
                    <TouchableOpacity
                      style={styles.unitSelector}
                      onPress={() => setExpandedUnitSelector(
                        expandedUnitSelector === index ? null : index
                      )}
                    >
                      <Text style={styles.unitText}>{ingredient.unit}</Text>
                      <IconSymbol 
                        size={12} 
                        name={expandedUnitSelector === index ? "chevron.up" : "chevron.down"} 
                        color={proto.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Unit Selection Dropdown */}
                {expandedUnitSelector === index && (
                  <View style={styles.unitDropdown}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.unitScrollView}
                    >
                      {commonUnits.map(unit => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitOption,
                            ingredient.unit === unit && styles.unitOptionSelected
                          ]}
                          onPress={() => handleUnitChange(index, unit)}
                        >
                          <Text style={[
                            styles.unitOptionText,
                            ingredient.unit === unit && styles.unitOptionTextSelected
                          ]}>
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {selectedIngredients.length === 0 && (
        <View style={styles.emptySelectedContainer}>
          <IconSymbol size={24} name="plus.circle.dashed" color={proto.textSecondary} />
          <Text style={styles.emptySelectedText}>No ingredients added yet</Text>
          <Text style={styles.emptySelectedSubtext}>Search and add ingredients above</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 16,
  },
  addIngredientSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: proto.text,
  },
  clearButton: {
    padding: 4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: proto.background,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 16,
    color: proto.text,
  },
  dropdownItemUnit: {
    fontSize: 14,
    color: proto.textSecondary,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
  },
  selectedIngredientsContainer: {
    gap: 12,
  },
  selectedIngredientsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 8,
  },
  ingredientCard: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: proto.text,
    flex: 1,
  },
  removeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityInputContainer: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: proto.textSecondary,
    marginBottom: 6,
  },
  quantityInput: {
    backgroundColor: proto.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: proto.text,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  unitSelectorContainer: {
    minWidth: 100,
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: proto.textSecondary,
    marginBottom: 6,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: proto.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  unitText: {
    fontSize: 16,
    color: proto.text,
  },
  unitDropdown: {
    marginTop: 8,
    backgroundColor: proto.background,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  unitScrollView: {
    flexGrow: 0,
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: proto.card,
  },
  unitOptionSelected: {
    backgroundColor: proto.accent,
  },
  unitOptionText: {
    fontSize: 14,
    color: proto.text,
  },
  unitOptionTextSelected: {
    color: proto.buttonText,
    fontWeight: '600',
  },
  emptySelectedContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptySelectedText: {
    fontSize: 16,
    color: proto.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptySelectedSubtext: {
    fontSize: 14,
    color: proto.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: proto.textSecondary,
    marginTop: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: proto.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});