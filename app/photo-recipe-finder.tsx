import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { imageCaptureService, CapturedImage, CaptureError } from '@/services/imageCaptureService';
import { foodRecognitionService, RecognizedIngredient, RecognitionError } from '@/services/foodRecognitionService';
import { RecipeService } from '@/services/recipeService';
import { useAuth } from '@/contexts/AuthContext';

const { proto } = Colors;

interface ProcessedRecipe {
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
  substitutionSuggestions: any[];
  usedIngredients: string[];
  missedIngredients: string[];
}

type Step = 'camera' | 'processing' | 'ingredients' | 'recipes';

export default function PhotoRecipeFinderScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>('camera');
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [recognizedIngredients, setRecognizedIngredients] = useState<RecognizedIngredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<ProcessedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    // Animate step transitions
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const handleCameraCapture = async () => {
    try {
      setLoading(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const image = await imageCaptureService.captureImage({
        source: 'camera',
        quality: 0.8,
        allowsEditing: true,
        maxDimensions: { width: 224, height: 224 },
      });

      setCapturedImage(image);
      setCurrentStep('processing');
      await processImage(image);
    } catch (error) {
      const captureError = error as CaptureError;
      handleError(captureError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryUpload = async () => {
    try {
      setLoading(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const image = await imageCaptureService.captureImage({
        source: 'gallery',
        quality: 0.8,
        allowsEditing: true,
        maxDimensions: { width: 224, height: 224 },
      });

      setCapturedImage(image);
      setCurrentStep('processing');
      await processImage(image);
    } catch (error) {
      const captureError = error as CaptureError;
      handleError(captureError.message);
    } finally {
      setLoading(false);
    }
  };

  const processImage = async (image: CapturedImage) => {
    try {
      setLoading(true);

      // Recognize ingredients
      const result = await foodRecognitionService.recognizeIngredients(image.uri);

      if (result.ingredients.length === 0) {
        throw new Error('No ingredients detected in the image. Please try a different photo with clearer ingredients.');
      }

      setRecognizedIngredients(result.ingredients);
      setSelectedIngredients(result.ingredients.map(ing => ing.name));
      setCurrentStep('ingredients');
    } catch (error) {
      const recognitionError = error as RecognitionError;
      handleError(recognitionError.message || 'Failed to recognize ingredients');
    } finally {
      setLoading(false);
    }
  };

  const handleFindRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (selectedIngredients.length === 0) {
        throw new Error('Please select at least one ingredient to find recipes.');
      }

      // Filter recognized ingredients to only selected ones
      const filteredIngredients = recognizedIngredients.filter(ing =>
        selectedIngredients.includes(ing.name)
      );

      // Get API key
      const apiKey = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
      if (!apiKey) {
        throw new Error('Recipe service not configured');
      }

      // Initialize recipe service
      const recipeService = new RecipeService(apiKey);

      // Load user inventory if available
      if (user) {
        await recipeService.loadUserInventory(user.id);
      }

      // Get smart recipe recommendations
      const smartResults = await recipeService.getSmartPhotoRecipes(filteredIngredients);

      if (smartResults.primaryRecipes.length === 0) {
        throw new Error('No recipes found with the selected ingredients. Try adding more common ingredients or selecting different ones.');
      }

      setRecipes(smartResults.primaryRecipes);
      setCurrentStep('recipes');
    } catch (error: any) {
      handleError(error.message || 'Failed to find recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (message: string) => {
    setError(message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const handleIngredientToggle = (ingredientName: string) => {
    setSelectedIngredients(prev => {
      if (prev.includes(ingredientName)) {
        return prev.filter(name => name !== ingredientName);
      } else {
        return [...prev, ingredientName];
      }
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRecipePress = (recipe: ProcessedRecipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/recipe-details?id=${recipe.id}`);
  };

  const handleRetry = () => {
    setCapturedImage(null);
    setRecognizedIngredients([]);
    setSelectedIngredients([]);
    setRecipes([]);
    setError(null);
    setCurrentStep('camera');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderProgressIndicator = () => {
    const steps = ['camera', 'processing', 'ingredients', 'recipes'];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              index <= currentIndex && styles.progressDotActive
            ]}>
              {index < currentIndex && (
                <IconSymbol size={12} name="checkmark" color={proto.buttonText} />
              )}
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                index < currentIndex && styles.progressLineActive
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderCameraStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <IconSymbol size={64} name="camera" color={proto.accent} />
      <Text style={styles.stepTitle}>Take a Photo of Your Ingredients</Text>
      <Text style={styles.stepDescription}>
        Snap a photo of your ingredients and we&apos;ll identify them to suggest personalized recipes.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleCameraCapture}
          disabled={loading}
        >
          <IconSymbol size={24} name="camera" color={proto.buttonText} />
          <Text style={styles.primaryButtonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleGalleryUpload}
          disabled={loading}
        >
          <IconSymbol size={24} name="photo" color={proto.accentDark} />
          <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderProcessingStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      {capturedImage && (
        <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} />
      )}
      <ActivityIndicator size="large" color={proto.accent} style={styles.loader} />
      <Text style={styles.stepTitle}>Analyzing Your Ingredients</Text>
      <Text style={styles.stepDescription}>
        Our AI is identifying the ingredients in your photo...
      </Text>
    </Animated.View>
  );

  const renderIngredientsStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      {capturedImage && (
        <Image source={{ uri: capturedImage.uri }} style={styles.capturedImageSmall} />
      )}
      <Text style={styles.stepTitle}>Confirm Your Ingredients</Text>
      <Text style={styles.stepDescription}>
        We detected these ingredients. Tap to select which ones you want to use in recipes.
      </Text>

      <ScrollView style={styles.ingredientsList} showsVerticalScrollIndicator={false}>
        {recognizedIngredients.map((ingredient, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.ingredientItem,
              selectedIngredients.includes(ingredient.name) && styles.ingredientItemSelected
            ]}
            onPress={() => handleIngredientToggle(ingredient.name)}
          >
            <View style={styles.ingredientInfo}>
              <Text style={[
                styles.ingredientName,
                selectedIngredients.includes(ingredient.name) && styles.ingredientNameSelected
              ]}>
                {ingredient.name}
              </Text>
              <Text style={styles.ingredientConfidence}>
                {ingredient.confidence}% confidence
              </Text>
            </View>
            <View style={[
              styles.checkbox,
              selectedIngredients.includes(ingredient.name) && styles.checkboxSelected
            ]}>
              {selectedIngredients.includes(ingredient.name) && (
                <IconSymbol size={16} name="checkmark" color={proto.buttonText} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.actionButton, styles.primaryButton]}
        onPress={handleFindRecipes}
        disabled={loading || selectedIngredients.length === 0}
      >
        {loading ? (
          <ActivityIndicator size="small" color={proto.buttonText} />
        ) : (
          <>
            <IconSymbol size={24} name="fork.knife" color={proto.buttonText} />
            <Text style={styles.primaryButtonText}>Find Recipes ({selectedIngredients.length})</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderRecipesStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.stepTitle}>Recipe Recommendations</Text>
      <Text style={styles.stepDescription}>
        Here are personalized recipes based on your ingredients:
      </Text>

      <ScrollView style={styles.recipesList} showsVerticalScrollIndicator={false}>
        {recipes.map((recipe, index) => (
          <TouchableOpacity
            key={recipe.id}
            style={styles.recipeCard}
            onPress={() => handleRecipePress(recipe)}
          >
            <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName} numberOfLines={2}>
                {recipe.name}
              </Text>
              <Text style={styles.recipeDetails}>
                {recipe.time} • {recipe.difficulty} • {recipe.matchPercentage}% match
              </Text>
              <View style={styles.recipeTagsContainer}>
                {recipe.wasteReductionTags.slice(0, 2).map((tag, tagIndex) => (
                  <View key={tagIndex} style={styles.recipeTag}>
                    <Text style={styles.recipeTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            <IconSymbol size={20} name="chevron.right" color={proto.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={handleRetry}
      >
        <IconSymbol size={24} name="camera" color={proto.accentDark} />
        <Text style={styles.secondaryButtonText}>Try Another Photo</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <IconSymbol size={48} name="exclamationmark.triangle" color={proto.error} />
      <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol size={24} name="chevron.left" color={proto.accentDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Recipe Finder</Text>
        <View style={styles.headerSpacer} />
      </View>

      {renderProgressIndicator()}

      {error ? renderErrorState() : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentStep === 'camera' && renderCameraStep()}
          {currentStep === 'processing' && renderProcessingStep()}
          {currentStep === 'ingredients' && renderIngredientsStep()}
          {currentStep === 'recipes' && renderRecipesStep()}
        </ScrollView>
      )}
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: proto.accentDark,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: proto.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: proto.accent,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: proto.border,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: proto.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: proto.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: proto.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: proto.accent,
  },
  secondaryButton: {
    backgroundColor: proto.card,
    borderWidth: 1,
    borderColor: proto.accentDark,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.buttonText,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.accentDark,
  },
  capturedImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  capturedImageSmall: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
  },
  loader: {
    marginVertical: 24,
  },
  ingredientsList: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 24,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: proto.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ingredientItemSelected: {
    borderColor: proto.accent,
    backgroundColor: proto.background,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 4,
  },
  ingredientNameSelected: {
    color: proto.accentDark,
  },
  ingredientConfidence: {
    fontSize: 14,
    color: proto.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: proto.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
  },
  recipesList: {
    width: '100%',
    marginBottom: 24,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: proto.card,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 4,
  },
  recipeDetails: {
    fontSize: 14,
    color: proto.textSecondary,
    marginBottom: 8,
  },
  recipeTagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  recipeTag: {
    backgroundColor: proto.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recipeTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: proto.buttonText,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
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
    fontSize: 16,
    fontWeight: '600',
    color: proto.buttonText,
  },
});