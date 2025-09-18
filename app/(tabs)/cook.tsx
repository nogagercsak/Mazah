import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator, RefreshControl, Modal, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { RecipeService } from '@/services/recipeService';

const apiKey = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
const proto = Colors.proto;

const filters = [
  { id: 'all', name: 'All Recipes', icon: 'square.grid.2x2' as IconSymbolName },
  { id: 'expiring', name: 'Use Expiring', icon: 'clock.badge.exclamationmark' as IconSymbolName },
  { id: 'quick', name: 'Quick (<15m)', icon: 'bolt' as IconSymbolName },
  { id: 'easy', name: 'Easy', icon: 'star' as IconSymbolName },
  { id: 'minimal', name: 'Minimal Shop', icon: 'cart' as IconSymbolName },
];

type ProcessedRecipe = {
  id: number;
  name: string;
  time: string;
  difficulty: string;
  image: string;
  ingredients: string[];
  expiringIngredients: string[];
  wasteReductionScore: number;
  wasteReductionTags: string[];
  matchPercentage: number;
  substitutionSuggestions: Array<{
    missing: string;
    substitute: string;
    inInventory: boolean;
  }>;
  usedIngredients: string[];
  missedIngredients: string[];
};

type FullRecipeDetails = {
  id: number;
  title: string;
  image: string;
  servings: number;
  readyInMinutes: number;
  extendedIngredients: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
    original: string;
  }>;
  analyzedInstructions: Array<{
    steps: Array<{
      number: number;
      step: string;
      ingredients: Array<{ name: string }>;
      equipment: Array<{ name: string }>;
    }>;
  }>;
  summary: string;
};

export default function CookScreen() {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('expiring');
  const [recipes, setRecipes] = useState<ProcessedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipeService, setRecipeService] = useState<RecipeService | null>(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  
  // Modal states
  const [selectedRecipeForCooking, setSelectedRecipeForCooking] = useState<ProcessedRecipe | null>(null);
  const [fullRecipeDetails, setFullRecipeDetails] = useState<FullRecipeDetails | null>(null);
  const [fetchingRecipeDetails, setFetchingRecipeDetails] = useState(false);

  // Ingredient checking state
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  // Search state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProcessedRecipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize recipe service
  useEffect(() => {
    if (apiKey) {
      setRecipeService(new RecipeService(apiKey));
    }
  }, []);

  // Load inventory and recipes when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (user && recipeService) {
        loadRecipes();
      }
    }, [user, recipeService, selectedFilter])
  );

  const loadRecipes = async () => {
    if (!recipeService || !user) return;

    setLoading(true);
    setError(null);

    try {
      // Load user's inventory first
      await recipeService.loadUserInventory(user.id);

      // Fetch recipes based on selected filter
      let fetchedRecipes: ProcessedRecipe[] = [];

      switch (selectedFilter) {
        case 'expiring':
          fetchedRecipes = await recipeService.getExpirationBasedRecipes(3);
          break;
        case 'quick':
          fetchedRecipes = await recipeService.getWasteReductionRecipes({
            quickMeals: true,
            useExpiring: true
          });
          break;
        case 'easy':
          fetchedRecipes = await recipeService.getWasteReductionRecipes({
            easyOnly: true,
            useExpiring: true
          });
          break;
        case 'minimal':
          fetchedRecipes = await recipeService.getWasteReductionRecipes({
            minMatchPercentage: 70,
            useExpiring: true
          });
          break;
        default:
          fetchedRecipes = await recipeService.getWasteReductionRecipes();
      }

      setRecipes(fetchedRecipes);
    } catch (err: any) {
      if (__DEV__) console.error('Recipe loading error:', err);
      setError(err.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const toggleFilter = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(filterId);
  };

  const toggleRecipeExpansion = (recipeId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  const toggleIngredientCheck = (ingredientIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(ingredientIndex)) {
      newChecked.delete(ingredientIndex);
    } else {
      newChecked.add(ingredientIndex);
    }
    setCheckedIngredients(newChecked);
  };

  const isIngredientInInventory = (ingredientName: string) => {
    if (!selectedRecipeForCooking) return false;
    return selectedRecipeForCooking.usedIngredients.some(ing => 
      ing.toLowerCase().includes(ingredientName.toLowerCase()) ||
      ingredientName.toLowerCase().includes(ing.toLowerCase())
    );
  };

  const handleStartCooking = async (recipe: ProcessedRecipe) => {
    if (!apiKey) {
      if (__DEV__) console.error('API key not found');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRecipeForCooking(recipe);
    setFetchingRecipeDetails(true);
    setCheckedIngredients(new Set()); // Reset checked ingredients

    try {
      // Fetch full recipe details from Spoonacular API
      const response = await fetch(
        `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${apiKey}&includeNutrition=false`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
      }
      
      const recipeData = await response.json();
      
      // Fetch detailed instructions
      const instructionsResponse = await fetch(
        `https://api.spoonacular.com/recipes/${recipe.id}/analyzedInstructions?apiKey=${apiKey}`
      );
      
      const instructionsData = await instructionsResponse.json();
      
      setFullRecipeDetails({
        ...recipeData,
        analyzedInstructions: instructionsData
      });
      
    } catch (error) {
      if (__DEV__) console.error('Failed to fetch recipe details:', error);
      setError('Failed to load recipe details. Please try again.');
      setSelectedRecipeForCooking(null);
    } finally {
      setFetchingRecipeDetails(false);
    }
  };

  const closeRecipeModal = () => {
    setSelectedRecipeForCooking(null);
    setFullRecipeDetails(null);
    setFetchingRecipeDetails(false);
    setCheckedIngredients(new Set());
  };

  const handleSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSearchModal(true);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !recipeService) return;

    setIsSearching(true);
    try {
      await recipeService.loadUserInventory(user?.id || '');
      const results = await recipeService.searchRecipesByName(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      if (__DEV__) console.error('Search error:', error);
      setError('Failed to search recipes. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return proto.accent;
    if (score >= 60) return '#E6D23C';
    if (score >= 40) return '#E6A23C';
    return proto.textSecondary;
  };

  const renderSubstitutions = (substitutions: ProcessedRecipe['substitutionSuggestions']) => {
    if (substitutions.length === 0) return null;

    return (
      <View style={styles.substitutionsContainer}>
        <Text style={styles.substitutionsTitle}>Smart Substitutions:</Text>
        {substitutions.map((sub, index) => (
          <View key={index} style={styles.substitutionItem}>
            <Text style={styles.substitutionText}>
              Replace <Text style={styles.missingIngredient}>{sub.missing}</Text> with{' '}
              <Text style={[
                styles.substituteIngredient,
                sub.inInventory && styles.availableSubstitute
              ]}>
                {sub.substitute}
              </Text>
              {sub.inInventory && <Text style={styles.inInventoryBadge}> ✓ In stock</Text>}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderIngredientsSection = () => {
    if (!fullRecipeDetails) return null;

    const totalIngredients = fullRecipeDetails.extendedIngredients.length;
    const checkedCount = checkedIngredients.size;
    const progressPercentage = totalIngredients > 0 ? (checkedCount / totalIngredients) * 100 : 0;

    return (
      <View style={styles.section}>
        <View style={styles.ingredientsSectionHeader}>
          <View style={styles.ingredientsTitleContainer}>
            <IconSymbol size={20} name="plus" color={proto.accent} />
            <Text style={styles.sectionTitle}>Ingredients</Text>
          </View>
          <View style={styles.ingredientsProgress}>
            <Text style={styles.progressText}>{checkedCount}/{totalIngredients}</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.ingredientsListContainer}>
          {fullRecipeDetails.extendedIngredients.map((ingredient, index) => {
            const isChecked = checkedIngredients.has(index);
            const inInventory = isIngredientInInventory(ingredient.name);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.ingredientRow,
                  isChecked && styles.ingredientRowChecked
                ]}
                onPress={() => toggleIngredientCheck(index)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.ingredientCheckbox,
                  isChecked && styles.ingredientCheckboxChecked
                ]}>
                  {isChecked && (
                    <IconSymbol size={14} name="checkmark" color={proto.buttonText} />
                  )}
                </View>
                
                <View style={styles.ingredientContent}>
                  <View style={styles.ingredientMainInfo}>
                    <Text style={[
                      styles.ingredientRowText,
                      isChecked && styles.ingredientTextChecked
                    ]}>
                      <Text style={styles.ingredientAmount}>
                        {ingredient.amount} {ingredient.unit}
                      </Text>
                      {' '}
                      <Text style={styles.ingredientName}>
                        {ingredient.name}
                      </Text>
                    </Text>
                    
                    {inInventory && (
                      <View style={styles.inventoryBadge}>
                        <IconSymbol size={12} name="checkmark" color={proto.accent} />
                        <Text style={styles.inventoryBadgeText}>In stock</Text>
                      </View>
                    )}
                  </View>
                  
                  {ingredient.original !== `${ingredient.amount} ${ingredient.unit} ${ingredient.name}` && (
                    <Text style={styles.ingredientOriginal}>
                      {ingredient.original}
                    </Text>
                  )}
                </View>

                <View style={[
                  styles.ingredientStatus,
                  inInventory ? styles.ingredientStatusAvailable : styles.ingredientStatusMissing
                ]}>
                  <IconSymbol 
                    size={16} 
                    name={inInventory ? "checkmark" : "plus"} 
                    color={inInventory ? proto.accent : proto.textSecondary} 
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick action buttons */}
        <View style={styles.ingredientsActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              const allIndices = new Set(fullRecipeDetails.extendedIngredients.map((_, i) => i));
              setCheckedIngredients(allIndices);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <IconSymbol size={16} name="checkmark" color={proto.accent} />
            <Text style={styles.actionButtonText}>Check All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setCheckedIngredients(new Set());
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <IconSymbol size={16} name="trash" color={proto.textSecondary} />
            <Text style={styles.actionButtonText}>Clear All</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => {
              // Check only ingredients in inventory
              const inventoryIndices = new Set(
                fullRecipeDetails.extendedIngredients
                  .map((ing, index) => ({ ing, index }))
                  .filter(({ ing }) => isIngredientInInventory(ing.name))
                  .map(({ index }) => index)
              );
              setCheckedIngredients(inventoryIndices);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <IconSymbol size={16} name="house.fill" color={proto.buttonText} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>Check Owned</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRecipeModal = () => {
    if (!selectedRecipeForCooking) return null;

    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeRecipeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={2}>
              {fullRecipeDetails?.title || selectedRecipeForCooking.name}
            </Text>
            <TouchableOpacity 
              onPress={closeRecipeModal}
              style={styles.closeButton}
            >
              <IconSymbol size={24} name="xmark" color={proto.text} />
            </TouchableOpacity>
          </View>

          {fetchingRecipeDetails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={proto.accent} />
              <Text style={styles.loadingText}>Loading recipe details...</Text>
            </View>
          ) : fullRecipeDetails ? (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Recipe Image */}
              <Image 
                source={{ uri: fullRecipeDetails.image }} 
                style={styles.modalRecipeImage} 
                resizeMode="cover" 
              />

              {/* Recipe Info */}
              <View style={styles.recipeInfoSection}>
                <View style={styles.recipeMetaRow}>
                  <View style={styles.metaItem}>
                    <IconSymbol size={16} name="clock" color={proto.textSecondary} />
                    <Text style={styles.metaText}>{fullRecipeDetails.readyInMinutes} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <IconSymbol size={16} name="person.2" color={proto.textSecondary} />
                    <Text style={styles.metaText}>{fullRecipeDetails.servings} servings</Text>
                  </View>
                  <View style={[styles.scoreContainer, { backgroundColor: getScoreColor(selectedRecipeForCooking.wasteReductionScore) }]}>
                    <IconSymbol size={16} name="leaf.fill" color={proto.buttonText} />
                    <Text style={styles.scoreText}>{selectedRecipeForCooking.wasteReductionScore}%</Text>
                  </View>
                </View>
              </View>

              {/* Improved Ingredients Section */}
              {renderIngredientsSection()}

              {/* Instructions Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {fullRecipeDetails.analyzedInstructions.length > 0 ? (
                  fullRecipeDetails.analyzedInstructions[0].steps.map((step, index) => (
                    <View key={index} style={styles.instructionStep}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{step.number}</Text>
                      </View>
                      <Text style={styles.stepText}>{step.step}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noInstructionsText}>
                    Instructions not available. Please check the original recipe source.
                  </Text>
                )}
              </View>

              {/* Bottom padding */}
              <View style={{ height: 20 }} />
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load recipe details</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => handleStartCooking(selectedRecipeForCooking)}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  const renderSearchModal = () => {
    return (
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSearchModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Search Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Recipes</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeSearchModal}
            >
              <IconSymbol size={24} name="close" color={proto.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <View style={styles.searchInputWrapper}>
              <IconSymbol size={20} name="magnifyingglass" color={proto.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for recipes..."
                placeholderTextColor={proto.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <IconSymbol size={18} name="cancel" color={proto.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.searchActionButton, !searchQuery.trim() && styles.searchActionButtonDisabled]}
              onPress={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color={proto.buttonText} />
              ) : (
                <Text style={styles.searchActionButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          <ScrollView style={styles.searchResultsContainer} showsVerticalScrollIndicator={false}>
            {searchResults.length > 0 ? (
              searchResults.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.searchResultItem}
                  onPress={() => {
                    closeSearchModal();
                    handleStartCooking(recipe);
                  }}
                >
                  <Image source={{ uri: recipe.image }} style={styles.searchResultImage} />
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultTitle} numberOfLines={2}>{recipe.name}</Text>
                    <Text style={styles.searchResultDetails}>{recipe.time} • {recipe.difficulty}</Text>
                    {recipe.matchPercentage > 0 && (
                      <Text style={styles.searchResultMatch}>{recipe.matchPercentage}% match with your ingredients</Text>
                    )}
                  </View>
                  <View style={styles.searchResultScore}>
                    <IconSymbol size={16} name="leaf.fill" color={proto.accent} />
                    <Text style={styles.searchResultScoreText}>{recipe.wasteReductionScore}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : searchQuery && !isSearching ? (
              <View style={styles.noSearchResults}>
                <IconSymbol size={48} name="magnifyingglass" color={proto.textSecondary} />
                <Text style={styles.noSearchResultsTitle}>No recipes found</Text>
                <Text style={styles.noSearchResultsText}>Try searching with different keywords</Text>
              </View>
            ) : !searchQuery ? (
              <View style={styles.searchEmptyState}>
                <IconSymbol size={48} name="magnifyingglass" color={proto.textSecondary} />
                <Text style={styles.searchEmptyStateTitle}>Search for Recipes</Text>
                <Text style={styles.searchEmptyStateText}>Enter a recipe name, ingredient, or cuisine type to find delicious recipes</Text>
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderRecipeCard = (recipe: ProcessedRecipe) => {
    const isExpanded = expandedRecipeId === recipe.id;
    
    return (
      <TouchableOpacity
        key={recipe.id}
        style={styles.recipeCard}
        onPress={() => toggleRecipeExpansion(recipe.id)}
        activeOpacity={0.8}
      >
        <View style={styles.recipeImageContainer}>
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} resizeMode="cover" />
          
          {/* Waste Reduction Score */}
          <View style={[styles.scoreContainer, { backgroundColor: getScoreColor(recipe.wasteReductionScore) }]}>
            <IconSymbol size={16} name="leaf.fill" color={proto.buttonText} />
            <Text style={styles.scoreText}>{recipe.wasteReductionScore}%</Text>
          </View>

          {/* Expiring ingredients badge */}
          {recipe.expiringIngredients.length > 0 && (
            <View style={styles.expiringBadge}>
              <Text style={styles.expiringBadgeText}>
                {recipe.expiringIngredients.length} expiring
              </Text>
            </View>
          )}
        </View>

        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          
          {/* Tags */}
          <View style={styles.tagsContainer}>
            {recipe.wasteReductionTags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.recipeMeta}>
            <View style={styles.metaItem}>
              <IconSymbol size={16} name="clock" color={proto.textSecondary} />
              <Text style={styles.metaText}>{recipe.time}</Text>
            </View>
            <View style={styles.metaItem}>
              <IconSymbol size={16} name="star" color={proto.textSecondary} />
              <Text style={styles.metaText}>{recipe.difficulty}</Text>
            </View>
            <View style={styles.metaItem}>
              <IconSymbol size={16} name="checkmark" color={proto.textSecondary} />
              <Text style={styles.metaText}>{recipe.matchPercentage}% match</Text>
            </View>
          </View>

          {/* Expiring ingredients list */}
          {recipe.expiringIngredients.length > 0 && (
            <View style={styles.expiringIngredientsContainer}>
              <Text style={styles.expiringLabel}>Uses expiring:</Text>
              <View style={styles.ingredientsList}>
                {recipe.expiringIngredients.map((ingredient, index) => (
                  <View key={index} style={styles.expiringIngredientTag}>
                    <Text style={styles.expiringIngredientText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Expandable section */}
          {isExpanded && (
            <View style={styles.expandedSection}>
              <View style={styles.ingredientsSection}>
                <Text style={styles.sectionTitle}>You have:</Text>
                <View style={styles.ingredientsList}>
                  {recipe.usedIngredients.map((ing, index) => (
                    <View key={index} style={styles.availableIngredientTag}>
                      <Text style={styles.ingredientText}>{ing}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {recipe.missedIngredients.length > 0 && (
                <View style={styles.ingredientsSection}>
                  <Text style={styles.sectionTitle}>You'll need:</Text>
                  <View style={styles.ingredientsList}>
                    {recipe.missedIngredients.map((ing, index) => (
                      <View key={index} style={styles.missingIngredientTag}>
                        <Text style={styles.ingredientText}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {renderSubstitutions(recipe.substitutionSuggestions)}

              <TouchableOpacity 
                style={styles.cookButton}
                onPress={() => handleStartCooking(recipe)}
              >
                <Text style={styles.cookButtonText}>Start Cooking</Text>
                <IconSymbol size={20} name="chevron.right" color={proto.buttonText} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.expandIndicator}>
            <IconSymbol 
              size={20} 
              name={isExpanded ? "chevron.right" : "chevron.right"} 
              color={proto.textSecondary} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol size={48} name="lightbulb" color={proto.textSecondary} />
      <Text style={styles.emptyStateTitle}>No recipes found</Text>
      <Text style={styles.emptyStateText}>
        {selectedFilter === 'expiring' 
          ? "Great news! You don't have any items expiring soon."
          : "Try adding more ingredients to your inventory or adjusting filters."}
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={proto.accent} />
      <Text style={styles.loadingText}>Finding waste-conscious recipes...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Recipe Suggestions</Text>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
          <IconSymbol size={24} name="magnifyingglass" color={proto.accentDark} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
            onPress={() => toggleFilter(filter.id)}
          >
            <IconSymbol 
              size={18} 
              name={filter.icon} 
              color={selectedFilter === filter.id ? proto.buttonText : proto.textSecondary} 
            />
            <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        style={styles.recipesContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={proto.accent}
          />
        }
      >
        {loading ? (
          renderLoadingState()
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : recipes.length > 0 ? (
          <View style={styles.recipesGrid}>
            {recipes.map(renderRecipeCard)}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* Recipe Modal */}
      {renderRecipeModal()}

      {/* Search Modal */}
      {renderSearchModal()}
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
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: proto.accentDark,
    opacity: 0.85,
    letterSpacing: 0.5,
    flex: 1,
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
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: proto.card,
    marginRight: 12,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: proto.accent,
  },
  filterText: {
    fontSize: 14,
    color: proto.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: proto.buttonText,
  },
  recipesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  recipesGrid: {
    gap: 16,
    paddingBottom: 20,
  },
  recipeCard: {
    backgroundColor: proto.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  recipeImageContainer: {
    height: 180,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  scoreContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  scoreText: {
    color: proto.buttonText,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  expiringBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#E57373',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  expiringBadgeText: {
    color: proto.buttonText,
    fontSize: 12,
    fontWeight: '700',
  },
  recipeInfo: {
    padding: 16,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: '700',
    color: proto.text,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: proto.accentDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    opacity: 0.9,
  },
  tagText: {
    color: proto.buttonText,
    fontSize: 11,
    fontWeight: '600',
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: proto.textSecondary,
  },
  expiringIngredientsContainer: {
    marginTop: 12,
  },
  expiringLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 6,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  expiringIngredientTag: {
    backgroundColor: '#E57373',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiringIngredientText: {
    color: proto.buttonText,
    fontSize: 12,
    fontWeight: '600',
  },
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: proto.background,
  },
  ingredientsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: proto.text,
    marginBottom: 8,
  },
  availableIngredientTag: {
    backgroundColor: proto.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  missingIngredientTag: {
    backgroundColor: proto.textSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    opacity: 0.7,
  },
  ingredientText: {
    color: proto.buttonText,
    fontSize: 12,
    fontWeight: '500',
  },
  substitutionsContainer: {
    marginBottom: 16,
    backgroundColor: proto.background,
    padding: 12,
    borderRadius: 12,
  },
  substitutionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 8,
  },
  substitutionItem: {
    marginBottom: 6,
  },
  substitutionText: {
    fontSize: 13,
    color: proto.textSecondary,
    lineHeight: 18,
  },
  missingIngredient: {
    color: '#E57373',
    fontWeight: '600',
  },
  substituteIngredient: {
    color: proto.textSecondary,
    fontWeight: '600',
  },
  availableSubstitute: {
    color: proto.accent,
  },
  inInventoryBadge: {
    color: proto.accent,
    fontWeight: '700',
  },
  cookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: proto.accent,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  cookButtonText: {
    color: proto.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
  expandIndicator: {
    alignItems: 'center',
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: proto.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#E57373',
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: proto.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: proto.card,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: proto.text,
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: proto.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  modalContent: {
    flex: 1,
  },
  modalRecipeImage: {
    width: '100%',
    height: 250,
  },
  recipeInfoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: proto.card,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: proto.card,
  },
  
  // Enhanced Ingredients Section Styles
  ingredientsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ingredientsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingredientsProgress: {
    alignItems: 'flex-end',
    gap: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: proto.accent,
  },
  progressBarContainer: {
    width: 80,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: proto.card,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: proto.accent,
    borderRadius: 2,
  },
  ingredientsListContainer: {
    gap: 2,
    marginBottom: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: proto.card,
    marginBottom: 8,
    gap: 12,
  },
  ingredientRowChecked: {
    backgroundColor: `${proto.accent}15`,
    borderWidth: 1,
    borderColor: `${proto.accent}30`,
  },
  ingredientCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: proto.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  ingredientCheckboxChecked: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
  },
  ingredientContent: {
    flex: 1,
    gap: 4,
  },
  ingredientMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  ingredientRowText: {
    fontSize: 16,
    color: proto.text,
    flex: 1,
  },
  ingredientTextChecked: {
    opacity: 0.7,
  },
  ingredientAmount: {
    fontWeight: '600',
    color: proto.accent,
  },
  ingredientName: {
    fontWeight: '500',
  },
  ingredientOriginal: {
    fontSize: 13,
    color: proto.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  inventoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${proto.accent}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inventoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: proto.accent,
  },
  ingredientStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientStatusAvailable: {
    backgroundColor: `${proto.accent}15`,
  },
  ingredientStatusMissing: {
    backgroundColor: proto.background,
  },
  ingredientsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: proto.card,
    borderWidth: 1,
    borderColor: proto.background,
  },
  actionButtonPrimary: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: proto.textSecondary,
  },
  actionButtonTextPrimary: {
    color: proto.buttonText,
  },
  
  // Instructions styles
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: proto.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: proto.buttonText,
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: proto.text,
    lineHeight: 22,
  },
  noInstructionsText: {
    fontSize: 16,
    color: proto.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  retryButton: {
    backgroundColor: proto.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: proto.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  // Search Modal Styles
  searchInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: proto.text,
  },
  searchActionButton: {
    backgroundColor: proto.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchActionButtonDisabled: {
    backgroundColor: proto.textSecondary,
    opacity: 0.5,
  },
  searchActionButtonText: {
    color: proto.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  searchResultItem: {
    flexDirection: 'row',
    backgroundColor: proto.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  searchResultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 4,
  },
  searchResultDetails: {
    fontSize: 14,
    color: proto.textSecondary,
    marginBottom: 2,
  },
  searchResultMatch: {
    fontSize: 12,
    color: proto.accent,
  },
  searchResultScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: proto.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  searchResultScoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: proto.accent,
  },
  noSearchResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSearchResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noSearchResultsText: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
  },
  searchEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  searchEmptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginTop: 16,
    marginBottom: 8,
  },
  searchEmptyStateText: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});