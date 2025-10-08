import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

const { proto } = Colors;
const { width: screenWidth } = Dimensions.get('window');

interface RecipeDetails {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  ingredients: {
    id: number;
    name: string;
    amount: number;
    unit: string;
    original: string;
    image: string | null;
  }[];
  instructions: {
    number: number;
    step: string;
    ingredients?: any[];
    equipment?: any[];
  }[];
  diets: string[];
  dishTypes: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  winePairing?: {
    pairedWines: string[];
    pairingText: string;
    productMatches: any[];
  };
}

export default function RecipeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRecipeDetails(Array.isArray(id) ? id[0] : id);
    }
  }, [id]);

  const fetchRecipeDetails = async (recipeId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/app/api/recipe/${recipeId}`);

      if (!response.ok) {
        throw new Error('Failed to load recipe details');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load recipe');
      }

      setRecipe(data.recipe);
    } catch (error: any) {
      console.error('Recipe fetch error:', error);
      setError(error.message || 'Failed to load recipe details');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!recipe) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsFavorite(!isFavorite);

      // TODO: Implement favorite functionality with Supabase
      // For now, just show local state change

    } catch (error) {
      console.error('Favorite error:', error);
      Alert.alert('Error', 'Failed to update favorite status');
      setIsFavorite(!isFavorite); // Revert on error
    }
  };

  const handleShare = async () => {
    if (!recipe) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await Share.share({
        message: `Check out this recipe: ${recipe.title}\n\nReady in ${recipe.readyInMinutes} minutes • Serves ${recipe.servings}\n\nShared from Mazah`,
        url: recipe.image,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={proto.accent} />
      <Text style={styles.loadingText}>Loading recipe details...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContainer}>
      <IconSymbol size={48} name="exclamationmark.triangle" color={proto.error} />
      <Text style={styles.errorTitle}>Failed to Load Recipe</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => fetchRecipeDetails(Array.isArray(id) ? id[0] : id as string)}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNutritionInfo = () => {
    if (!recipe?.nutrition) return null;

    const nutrition = recipe.nutrition;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition Information</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(nutrition.calories)}</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(nutrition.protein)}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(nutrition.carbs)}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(nutrition.fat)}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDietTags = () => {
    if (!recipe?.diets || recipe.diets.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diet Information</Text>
        <View style={styles.tagsContainer}>
          {recipe.diets.map((diet, index) => (
            <View key={index} style={styles.dietTag}>
              <Text style={styles.dietTagText}>{diet}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}>{renderLoadingState()}</SafeAreaView>;
  if (error || !recipe) return <SafeAreaView style={styles.container}>{renderErrorState()}</SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <IconSymbol size={24} name="chevron.left" color={proto.buttonText} />
            </TouchableOpacity>
            <View style={styles.headerButtonsRight}>
              <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                <IconSymbol size={24} name="square.and.arrow.up" color={proto.buttonText} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleFavorite}>
                <IconSymbol
                  size={24}
                  name={isFavorite ? "heart.fill" : "heart"}
                  color={isFavorite ? "#FF6B6B" : proto.buttonText}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Recipe Title and Basic Info */}
          <Text style={styles.recipeTitle}>{recipe.title}</Text>

          <View style={styles.recipeMetrics}>
            <View style={styles.metric}>
              <IconSymbol size={20} name="clock" color={proto.accent} />
              <Text style={styles.metricText}>{recipe.readyInMinutes} min</Text>
            </View>
            <View style={styles.metric}>
              <IconSymbol size={20} name="person.2" color={proto.accent} />
              <Text style={styles.metricText}>{recipe.servings} servings</Text>
            </View>
            <View style={styles.metric}>
              <IconSymbol size={20} name="fork.knife" color={proto.accent} />
              <Text style={styles.metricText}>{recipe.dishTypes[0] || 'Main Dish'}</Text>
            </View>
          </View>

          {/* Summary */}
          {recipe.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Recipe</Text>
              <Text style={styles.summary}>{recipe.summary}</Text>
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients ({recipe.ingredients.length})</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientCheckbox}>
                  <IconSymbol size={12} name="circle" color={proto.textSecondary} />
                </View>
                <Text style={styles.ingredientText}>{ingredient.original}</Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{instruction.number}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction.step}</Text>
              </View>
            ))}
          </View>

          {/* Nutrition */}
          {renderNutritionInfo()}

          {/* Diet Tags */}
          {renderDietTags()}

          {/* Wine Pairing */}
          {recipe.winePairing && recipe.winePairing.pairedWines.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wine Pairing</Text>
              <Text style={styles.winePairingText}>{recipe.winePairing.pairingText}</Text>
              <View style={styles.tagsContainer}>
                {recipe.winePairing.pairedWines.map((wine, index) => (
                  <View key={index} style={styles.wineTag}>
                    <Text style={styles.wineTagText}>{wine}</Text>
                  </View>
                ))}
              </View>
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
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  headerActions: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonsRight: {
    flexDirection: 'row',
    gap: 12,
  },
  contentContainer: {
    padding: 24,
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: proto.text,
    marginBottom: 16,
    lineHeight: 34,
  },
  recipeMetrics: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 24,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 14,
    fontWeight: '500',
    color: proto.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: proto.text,
    marginBottom: 16,
  },
  summary: {
    fontSize: 16,
    color: proto.textSecondary,
    lineHeight: 24,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 16,
  },
  ingredientCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: proto.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: proto.text,
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingRight: 16,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: proto.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: proto.buttonText,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: proto.text,
    lineHeight: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: proto.accent,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: proto.textSecondary,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietTag: {
    backgroundColor: proto.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dietTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: proto.buttonText,
  },
  wineTag: {
    backgroundColor: proto.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: proto.accent,
  },
  wineTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: proto.accentDark,
  },
  winePairingText: {
    fontSize: 16,
    color: proto.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: proto.textSecondary,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 16,
    color: proto.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: proto.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: proto.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
});