import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const apiKey = Constants.expoConfig?.extra?.SPOONACULAR_API_KEY;

const proto = Colors.proto;

const mockFilters = [
  { id: 'all', name: 'All Recipes', active: true },
  { id: 'expiring', name: 'Use Expiring', active: false },
  { id: 'quick', name: 'Quick (<15 min)', active: false },
  { id: 'easy', name: 'Easy', active: false },
];

type Recipe = {
  id: number;
  name: string;
  time: string;
  difficulty: string;
  image: string;
  ingredients: string[];
  expiringIngredients: string[];
};

export default function CookScreen() {
  const colorScheme = useColorScheme();

  const [filters, setFilters] = useState(mockFilters);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Missing toggleFilter function
  const toggleFilter = (filterId: string) => {
    setFilters(prevFilters =>
      prevFilters.map(filter => ({
        ...filter,
        active: filter.id === filterId
      }))
    );
    setSelectedFilter(filterId);
  };

  async function fetchRecipes() {
    setLoading(true);
    setError(null);

    if (!apiKey) {
      console.warn("API key is missing from Constants");
      setError("Missing API key");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?query=pasta&addRecipeInformation=true&number=10&apiKey=${apiKey}`
      );
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched recipes:", data.results);

      const mappedRecipes = data.results.map((r: any) => ({
        id: r.id,
        name: r.title,
        time: `${r.readyInMinutes} min`,
        difficulty: r.readyInMinutes <= 15 ? 'Easy' : 'Medium',
        image: r.image,
        ingredients: r.extendedIngredients?.map((ing: any) => ing.name) || [],
        expiringIngredients: [],
      }));

      setRecipes(mappedRecipes);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getFilteredRecipes = () => {
    switch (selectedFilter) {
      case 'expiring':
        return recipes.filter(recipe => recipe.expiringIngredients.length > 0);
      case 'quick':
        return recipes.filter(recipe => {
          const timeNumber = parseInt(recipe.time.replace(/\D/g, ''), 10);
          return timeNumber < 15;
        });
      case 'easy':
        return recipes.filter(recipe => recipe.difficulty === 'Easy');
      default:
        return recipes;
    }
  };

  const filteredRecipes = getFilteredRecipes();

  const renderRecipeCard = (recipe: any) => (
    <View key={recipe.id} style={styles.recipeCard}>
      <View style={styles.recipeImage}>
        {/* Show image */}
        <Image source={{ uri: recipe.image }} style={{ width: '100%', height: 90 }} resizeMode="cover" />
        {recipe.expiringIngredients.length > 0 && (
          <View style={styles.expiringBadge}>
            <Text style={styles.expiringBadgeText}>{recipe.expiringIngredients.length} expiring</Text>
          </View>
        )}
      </View>
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <View style={styles.recipeMeta}>
          <View style={styles.metaItem}>
            <IconSymbol size={16} name="clock" color={proto.textSecondary} />
            <Text style={styles.metaText}>{recipe.time}</Text>
          </View>
          <View style={styles.metaItem}>
            <IconSymbol size={16} name="star" color={proto.textSecondary} />
            <Text style={styles.metaText}>{recipe.difficulty}</Text>
          </View>
        </View>
        <View style={styles.ingredientsContainer}>
          <Text style={styles.ingredientsLabel}>Uses:</Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.slice(0, 3).map((ingredient: string, index: number) => (
              <View key={index} style={styles.ingredientTag}>
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
            {recipe.ingredients.length > 3 && (
              <Text style={styles.moreIngredients}>+{recipe.ingredients.length - 3} more</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cook with What You Have</Text>
          <TouchableOpacity style={styles.searchButton}>
            <IconSymbol size={24} name="magnifyingglass" color={proto.accentDark} />
          </TouchableOpacity>
        </View>
        <View style={styles.filtersContainer}>
          <View style={styles.filtersGrid}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, filter.active && styles.filterChipActive]}
                onPress={() => toggleFilter(filter.id)}
              >
                <Text style={[styles.filterText, filter.active && styles.filterTextActive]}>{filter.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      <ScrollView style={styles.recipesContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.recipesGrid}>
          {loading ? (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading recipes...</Text>
          ) : error ? (
            <Text style={{ textAlign: 'center', marginTop: 20, color: 'red' }}>{error}</Text>
          ) : filteredRecipes.length > 0 ? (
            filteredRecipes.map(renderRecipeCard)
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol size={48} name="lightbulb" color={proto.textSecondary} />
              <Text style={styles.emptyStateTitle}>No recipes found?</Text>
              <Text style={styles.emptyStateText}>
                Try adding more ingredients to your inventory or adjust your filters.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: proto.background,
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: proto.accentDark,
    opacity: 0.85,
    letterSpacing: 0.5,
    marginBottom: 0,
    marginTop: 0,
    maxWidth: '75%',
    marginRight: 12,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: proto.card,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    flexShrink: 0,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    backgroundColor: proto.background,
    marginBottom: 16,
    alignItems: 'center',
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: proto.card,
    width: '48%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  filterChipActive: {
    backgroundColor: proto.accent,
  },
  filterText: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
  },
  filterTextActive: {
    color: proto.buttonText,
    fontWeight: '700',
  },
  recipesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  recipesGrid: {
    gap: 8,
  },
  recipeCard: {
    backgroundColor: proto.card,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 0,
  },
  recipeImage: {
    height: 90,
    backgroundColor: proto.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    position: 'relative',
  },
  expiringBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E57373',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiringBadgeText: {
    color: proto.buttonText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  recipeInfo: {
    padding: 16,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: proto.text,
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 6,
    fontSize: 14,
    color: proto.textSecondary,
  },
  ingredientsContainer: {
    marginTop: 4,
  },
  ingredientsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: proto.text,
    marginBottom: 8,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingredientTag: {
    backgroundColor: proto.accentDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  ingredientText: {
    color: proto.buttonText,
    fontSize: 12,
  },
  moreIngredients: {
    fontSize: 12,
    color: proto.textSecondary,
    alignSelf: 'center',
  },
  emptyState: {
    marginTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: proto.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: proto.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});