import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const proto = Colors.proto;

// Mock data for demonstration
const mockWeekDays = [
  { day: 'Mon', date: '15', meals: ['Pasta with Chicken', 'Salad'] },
  { day: 'Tue', date: '16', meals: ['Rice Bowl', 'Soup'] },
  { day: 'Wed', date: '17', meals: ['Yogurt Parfait', 'Sandwich'] },
  { day: 'Thu', date: '18', meals: ['Stir Fry', 'Fruit'] },
  { day: 'Fri', date: '19', meals: ['Pizza', 'Smoothie'] },
  { day: 'Sat', date: '20', meals: ['Grilled Fish', 'Vegetables'] },
  { day: 'Sun', date: '21', meals: ['Pancakes', 'Eggs'] },
];

const mockShoppingList = [
  { id: 1, item: 'Chicken Breast', quantity: '1kg', category: 'Meat', inPantry: false },
  { id: 2, item: 'Rice', quantity: '500g', category: 'Grains', inPantry: true },
  { id: 3, item: 'Tomatoes', quantity: '6 pieces', category: 'Vegetables', inPantry: false },
  { id: 4, item: 'Milk', quantity: '2L', category: 'Dairy', inPantry: false },
  { id: 5, item: 'Bread', quantity: '2 loaves', category: 'Bakery', inPantry: false },
];

const mockCategories = [
  { id: 'all', name: 'All', active: true },
  { id: 'meat', name: 'Meat', active: false },
  { id: 'vegetables', name: 'Vegetables', active: false },
  { id: 'dairy', name: 'Dairy', active: false },
  { id: 'grains', name: 'Grains', active: false },
];

export default function PlanScreen() {
  const colorScheme = useColorScheme();
  const [selectedDay, setSelectedDay] = useState(0);
  const [categories, setCategories] = useState(mockCategories);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const toggleCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCategories(categories.map(c => ({ ...c, active: c.id === categoryId })));
  };

  const getFilteredShoppingList = () => {
    if (selectedCategory === 'all') return mockShoppingList;
    return mockShoppingList.filter(item => 
      item.category.toLowerCase() === selectedCategory
    );
  };

  const addMeal = () => {
    Alert.alert('Add Meal', 'This would open a form to add a meal to the selected day');
  };

  const generateShoppingList = () => {
    Alert.alert('Shopping List', 'This would generate a shopping list based on your meal plan');
  };

  const renderDayCard = (day: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.dayCard, selectedDay === index && styles.dayCardSelected]}
      onPress={() => setSelectedDay(index)}
    >
      <Text style={[styles.dayText, selectedDay === index && styles.dayTextSelected]}>{day.day}</Text>
      <Text style={[styles.dateText, selectedDay === index && styles.dateTextSelected]}>{day.date}</Text>
      <View style={styles.mealDots}>
        {day.meals.map((_meal: string, mealIndex: number) => (
          <View key={mealIndex} style={[styles.mealDot, selectedDay === index && styles.mealDotSelected]} />
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderMealItem = (meal: string, index: number) => (
    <View key={index} style={styles.mealItem}>
      <IconSymbol size={16} name={"fork.knife" as any} color={proto.textSecondary} />
      <Text style={styles.mealText}>{meal}</Text>
    </View>
  );

  const renderShoppingItem = (item: any) => (
    <View key={item.id} style={styles.shoppingItem}>
      <View style={styles.shoppingItemInfo}>
        <Text style={styles.shoppingItemName}>{item.item}</Text>
        <Text style={styles.shoppingItemQuantity}>{item.quantity}</Text>
      </View>
      <View style={styles.shoppingItemMeta}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{item.category}</Text>
        </View>
        {item.inPantry && (
          <View style={styles.inPantryBadge}>
            <IconSymbol size={12} name={"checkmark" as any} color={proto.accent} />
            <Text style={styles.inPantryText}>In Pantry</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Planner</Text>
        <TouchableOpacity style={styles.addButton} onPress={addMeal}>
          <IconSymbol size={24} name={"plus" as any} color={proto.buttonText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekContainer}
        contentContainerStyle={styles.weekContentContainer}
      >
        {mockWeekDays.map(renderDayCard)}
      </ScrollView>

      <View style={styles.contentContainer}>
        <View style={styles.mealsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meals for {mockWeekDays[selectedDay].day}</Text>
            <TouchableOpacity style={styles.editButton}>
              <IconSymbol size={16} name={"pencil" as any} color={proto.accentDark} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mealsList}>
            {mockWeekDays[selectedDay].meals.map(renderMealItem)}
          </View>
        </View>

        <View style={styles.shoppingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shopping List</Text>
            <TouchableOpacity style={styles.generateButton} onPress={generateShoppingList}>
              <IconSymbol size={16} name={"wand.and.stars" as any} color={proto.buttonText} />
              <Text style={styles.generateButtonText}>Generate</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryChip, category.active && styles.categoryChipActive]}
                onPress={() => toggleCategory(category.id)}
              >
                <Text style={[styles.categoryText, category.active && styles.categoryTextActive]}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.shoppingList} showsVerticalScrollIndicator={false}>
            {getFilteredShoppingList().map(renderShoppingItem)}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: proto.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: proto.background,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: proto.accentDark,
    opacity: 0.85,
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: proto.accent,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  weekContainer: {
    paddingHorizontal: 16,
    backgroundColor: proto.background,
    maxHeight: 80,
  },
  weekContentContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dayCard: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: proto.card,
    marginRight: 8,
    minWidth: 60,
    justifyContent: 'center',
    flexShrink: 0,
  },
  dayCardSelected: {
    backgroundColor: proto.accent,
  },
  dayText: {
    fontSize: 13,
    color: proto.textSecondary,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: proto.buttonText,
  },
  dateText: {
    fontSize: 18,
    color: proto.text,
    fontWeight: 'bold',
    marginTop: 2,
  },
  dateTextSelected: {
    color: proto.buttonText,
  },
  mealDots: {
    flexDirection: 'row',
    marginTop: 4,
  },
  mealDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: proto.textSecondary,
    marginHorizontal: 1,
  },
  mealDotSelected: {
    backgroundColor: proto.buttonText,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  mealsSection: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 6,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: proto.text,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: proto.background,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  mealsList: {
    gap: 6,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  mealText: {
    fontSize: 15,
    color: proto.text,
    marginLeft: 10,
  },
  shoppingSection: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 6,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.accentDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  generateButtonText: {
    color: proto.buttonText,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  categoriesContainer: {
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: proto.card,
    marginRight: 6,
    marginBottom: 0,
    minWidth: 90,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderColor: proto.textSecondary,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: proto.accent,
  },
  categoryText: {
    fontSize: 13,
    color: proto.textSecondary,
  },
  categoryTextActive: {
    color: proto.buttonText,
    fontWeight: '700',
  },
  shoppingList: {
    flex: 1,
  },
  shoppingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: proto.card,
  },
  shoppingItemInfo: {
    flex: 1,
  },
  shoppingItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: proto.text,
    marginBottom: 2,
  },
  shoppingItemQuantity: {
    fontSize: 13,
    color: proto.textSecondary,
  },
  shoppingItemMeta: {
    alignItems: 'flex-end',
  },
  categoryTag: {
    backgroundColor: proto.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 2,
  },
  categoryTagText: {
    fontSize: 11,
    color: proto.textSecondary,
  },
  inPantryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inPantryText: {
    fontSize: 11,
    color: proto.accent,
    marginLeft: 2,
    fontWeight: '700',
  },
});