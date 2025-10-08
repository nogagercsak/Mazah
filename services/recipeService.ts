import { FoodItem, supabase } from '@/lib/supabase';
import { RecognizedIngredient } from './foodRecognitionService';

// Extend FoodItem to include daysLeft
interface FoodItemWithDaysLeft extends FoodItem {
  daysLeft: number;
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  readyInMinutes: number;
  image: string;
  usedIngredients?: any[];
  missedIngredients?: any[];
  unusedIngredients?: any[];
  extendedIngredients?: any[];
}

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
  substitutionSuggestions: SubstitutionSuggestion[];
  usedIngredients: string[];
  missedIngredients: string[];
}

interface SubstitutionSuggestion {
  missing: string;
  substitute: string;
  inInventory: boolean;
}

// Common ingredient substitutions database
const SUBSTITUTION_MAP: { [key: string]: string[] } = {
  'butter': ['oil', 'margarine', 'coconut oil'],
  'milk': ['almond milk', 'soy milk', 'oat milk', 'coconut milk'],
  'egg': ['flax egg', 'chia egg', 'applesauce', 'banana'],
  'flour': ['almond flour', 'coconut flour', 'oat flour'],
  'sugar': ['honey', 'maple syrup', 'agave nectar'],
  'cream': ['milk', 'yogurt', 'coconut cream'],
  'chicken': ['turkey', 'tofu', 'chickpeas'],
  'beef': ['turkey', 'mushrooms', 'lentils'],
  'pasta': ['rice', 'quinoa', 'zucchini noodles'],
  'rice': ['quinoa', 'cauliflower rice', 'barley'],
  'onion': ['shallot', 'leek', 'garlic'],
  'garlic': ['garlic powder', 'onion', 'shallot'],
  'lemon': ['lime', 'vinegar', 'lemon juice'],
  'lime': ['lemon', 'vinegar'],
  'tomato': ['tomato paste', 'tomato sauce', 'red pepper'],
  'cheese': ['nutritional yeast', 'cashew cream'],
  'yogurt': ['sour cream', 'cream cheese', 'coconut yogurt'],
  'bread': ['crackers', 'tortilla', 'pita'],
};

export class RecipeService {
  private apiKey: string;
  private userInventory: FoodItemWithDaysLeft[] = [];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async loadUserInventory(userId: string) {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('user_id', userId);

    if (!error && data) {
      this.userInventory = data.map(item => ({
        ...item,
        daysLeft: this.calculateDaysLeft(item.expiration_date)
      }));
    }
    return this.userInventory;
  }

  private calculateDaysLeft(expirationDate: string): number {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async searchRecipesByIngredients(prioritizeExpiring: boolean = true): Promise<ProcessedRecipe[]> {
    // Get ingredients sorted by expiration if prioritizing
    const ingredients = prioritizeExpiring 
      ? this.getExpiringIngredients()
      : this.userInventory.map(item => item.name);

    if (ingredients.length === 0) {
      return [];
    }

    try {
      // Search recipes by available ingredients
      const response = await fetch(
        `https://api.spoonacular.com/recipes/findByIngredients?` +
        `ingredients=${ingredients.join(',')}&` +
        `number=20&` +
        `ranking=2&` + // Maximize used ingredients
        `ignorePantry=false&` +
        `apiKey=${this.apiKey}`
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const recipes: SpoonacularRecipe[] = await response.json();

      // Get detailed information for each recipe
      const detailedRecipes = await Promise.all(
        recipes.map(recipe => this.getRecipeDetails(recipe.id))
      );

      // Process and score recipes
      return detailedRecipes
        .map(recipe => this.processRecipe(recipe))
        .sort((a, b) => b.wasteReductionScore - a.wasteReductionScore);

    } catch (error) {
      if (__DEV__) console.error('Recipe search error:', error);
      return [];
    }
  }

  private async getRecipeDetails(recipeId: number): Promise<SpoonacularRecipe> {
    const response = await fetch(
      `https://api.spoonacular.com/recipes/${recipeId}/information?` +
      `includeNutrition=false&` +
      `apiKey=${this.apiKey}`
    );
    
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }

  private processRecipe(recipe: SpoonacularRecipe): ProcessedRecipe {
    const expiringIngredients = this.findExpiringIngredientsInRecipe(recipe);
    const wasteReductionScore = this.calculateWasteReductionScore(recipe, expiringIngredients);
    const wasteReductionTags = this.generateWasteReductionTags(recipe, expiringIngredients);
    const substitutions = this.findSubstitutions(recipe);
    const matchPercentage = this.calculateMatchPercentage(recipe);

    return {
      id: recipe.id,
      name: recipe.title,
      time: `${recipe.readyInMinutes} min`,
      difficulty: this.calculateDifficulty(recipe),
      image: recipe.image,
      ingredients: recipe.extendedIngredients?.map(ing => ing.name) || [],
      expiringIngredients: expiringIngredients.map(item => item.name),
      wasteReductionScore,
      wasteReductionTags,
      matchPercentage,
      substitutionSuggestions: substitutions,
      usedIngredients: recipe.usedIngredients?.map(ing => ing.name) || [],
      missedIngredients: recipe.missedIngredients?.map(ing => ing.name) || []
    };
  }

  private findExpiringIngredientsInRecipe(recipe: SpoonacularRecipe): FoodItemWithDaysLeft[] {
    const expiringItems = this.userInventory.filter(item => item.daysLeft <= 3);
    const recipeIngredientNames = recipe.extendedIngredients?.map(ing => 
      ing.name.toLowerCase()
    ) || [];

    return expiringItems.filter(item => 
      recipeIngredientNames.some(ingName => 
        ingName.includes(item.name.toLowerCase()) || 
        item.name.toLowerCase().includes(ingName)
      )
    );
  }

  private calculateWasteReductionScore(recipe: SpoonacularRecipe, expiringIngredients: FoodItemWithDaysLeft[]): number {
    let score = 0;

    // Points for using expiring ingredients
    expiringIngredients.forEach(item => {
      if (item.daysLeft < 0) score += 50; // Already expired
      else if (item.daysLeft <= 1) score += 40; // Expires today/tomorrow
      else if (item.daysLeft <= 3) score += 30; // Expires soon
      else if (item.daysLeft <= 7) score += 20; // Expires this week
    });

    // Points for ingredient efficiency
    const totalIngredients = recipe.extendedIngredients?.length || 0;
    const usedFromInventory = recipe.usedIngredients?.length || 0;
    const ingredientEfficiency = totalIngredients > 0 ? usedFromInventory / totalIngredients : 0;
    score += ingredientEfficiency * 30;

    // Bonus for using items that are often wasted
    const wasteProneItems = ['leafy greens', 'berries', 'herbs', 'dairy', 'bread'];
    const usesWasteProneItems = recipe.extendedIngredients?.some(ing => 
      wasteProneItems.some(item => ing.name.toLowerCase().includes(item))
    );
    if (usesWasteProneItems) score += 10;

    return Math.min(score, 100); // Cap at 100
  }

  private generateWasteReductionTags(recipe: SpoonacularRecipe, expiringIngredients: FoodItemWithDaysLeft[]): string[] {
    const tags: string[] = [];

    if (expiringIngredients.length > 0) {
      tags.push('Uses Expiring Items');
    }

    const matchPercentage = this.calculateMatchPercentage(recipe);
    if (matchPercentage >= 80) {
      tags.push('Minimal Shopping');
    } else if (matchPercentage >= 60) {
      tags.push('Few Missing Items');
    }

    if (recipe.readyInMinutes <= 15) {
      tags.push('Quick Meal');
    }

    const ingredientCount = recipe.extendedIngredients?.length || 0;
    if (ingredientCount <= 5) {
      tags.push('Simple Recipe');
    }

    // Check for leftover-friendly
    const leftoversKeywords = ['soup', 'stew', 'casserole', 'curry', 'pasta', 'salad'];
    if (leftoversKeywords.some(keyword => recipe.title.toLowerCase().includes(keyword))) {
      tags.push('Great for Leftovers');
    }

    return tags;
  }

  private findSubstitutions(recipe: SpoonacularRecipe): SubstitutionSuggestion[] {
    const suggestions: SubstitutionSuggestion[] = [];
    const inventoryNames = this.userInventory.map(item => item.name.toLowerCase());

    recipe.missedIngredients?.forEach(missing => {
      const missingName = missing.name.toLowerCase();
      
      // Check substitution map
      for (const [ingredient, substitutes] of Object.entries(SUBSTITUTION_MAP)) {
        if (missingName.includes(ingredient)) {
          const availableSubstitute = substitutes.find(sub => 
            inventoryNames.some(inv => inv.includes(sub) || sub.includes(inv))
          );

          if (availableSubstitute) {
            suggestions.push({
              missing: missing.name,
              substitute: availableSubstitute,
              inInventory: true
            });
          } else if (substitutes.length > 0) {
            suggestions.push({
              missing: missing.name,
              substitute: substitutes[0],
              inInventory: false
            });
          }
          break;
        }
      }
    });

    return suggestions;
  }

  private calculateMatchPercentage(recipe: SpoonacularRecipe): number {
    const total = recipe.extendedIngredients?.length || 0;
    const used = recipe.usedIngredients?.length || 0;
    return total > 0 ? Math.round((used / total) * 100) : 0;
  }

  private calculateDifficulty(recipe: SpoonacularRecipe): string {
    const time = recipe.readyInMinutes;
    const ingredients = recipe.extendedIngredients?.length || 0;

    if (time <= 15 && ingredients <= 5) return 'Easy';
    if (time <= 30 && ingredients <= 10) return 'Medium';
    return 'Advanced';
  }

  private getExpiringIngredients(): string[] {
    return this.userInventory
      .filter(item => item.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .map(item => item.name);
  }

  async getWasteReductionRecipes(filters: {
    useExpiring?: boolean;
    quickMeals?: boolean;
    easyOnly?: boolean;
    minMatchPercentage?: number;
  } = {}): Promise<ProcessedRecipe[]> {
    let recipes = await this.searchRecipesByIngredients(filters.useExpiring ?? true);

    // Apply filters
    if (filters.quickMeals) {
      recipes = recipes.filter(r => parseInt(r.time) <= 15);
    }

    if (filters.easyOnly) {
      recipes = recipes.filter(r => r.difficulty === 'Easy');
    }

    if (filters.minMatchPercentage !== undefined) {
      recipes = recipes.filter(r => r.matchPercentage >= filters.minMatchPercentage!);
    }

    return recipes;
  }

  // Get recipes specifically for items expiring in the next N days
  async getExpirationBasedRecipes(daysAhead: number = 3): Promise<ProcessedRecipe[]> {
    const expiringItems = this.userInventory
      .filter(item => item.daysLeft >= 0 && item.daysLeft <= daysAhead)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    if (expiringItems.length === 0) {
      return [];
    }

    // Search for recipes using these specific items
    const ingredients = expiringItems.map(item => item.name).join(',');
    
    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/findByIngredients?` +
        `ingredients=${ingredients}&` +
        `number=10&` +
        `ranking=1&` + // Minimize missing ingredients
        `apiKey=${this.apiKey}`
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const recipes: SpoonacularRecipe[] = await response.json();
      const detailedRecipes = await Promise.all(
        recipes.map(recipe => this.getRecipeDetails(recipe.id))
      );

      return detailedRecipes
        .map(recipe => this.processRecipe(recipe))
        .filter(recipe => recipe.expiringIngredients.length > 0)
        .sort((a, b) => b.expiringIngredients.length - a.expiringIngredients.length);

    } catch (error) {
      if (__DEV__) console.error('Expiration-based recipe search error:', error);
      return [];
    }
  }

  // Search recipes by name/query
  async searchRecipesByName(query: string): Promise<ProcessedRecipe[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?` +
        `query=${encodeURIComponent(query)}&` +
        `number=20&` +
        `addRecipeInformation=true&` +
        `apiKey=${this.apiKey}`
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const recipes: SpoonacularRecipe[] = data.results || [];

      // Process recipes and calculate waste reduction scores
      return recipes
        .map(recipe => this.processRecipe(recipe))
        .sort((a, b) => b.wasteReductionScore - a.wasteReductionScore);

    } catch (error) {
      if (__DEV__) console.error('Recipe name search error:', error);
      return [];
    }
  }

  // NEW: Search recipes using photo-detected ingredients
  async searchRecipesByPhotoIngredients(recognizedIngredients: RecognizedIngredient[]): Promise<ProcessedRecipe[]> {
    if (!recognizedIngredients || recognizedIngredients.length === 0) {
      return [];
    }

    // Filter ingredients by confidence threshold and clean names
    const highConfidenceIngredients = recognizedIngredients
      .filter(ingredient => ingredient.confidence >= 60) // Only use high-confidence ingredients
      .map(ingredient => ingredient.name.toLowerCase())
      .slice(0, 8); // Limit to 8 ingredients for better API performance

    if (highConfidenceIngredients.length === 0) {
      return [];
    }

    try {
      // Search for recipes using detected ingredients
      const response = await fetch(
        `https://api.spoonacular.com/recipes/findByIngredients?` +
        `ingredients=${highConfidenceIngredients.join(',')}&` +
        `number=20&` +
        `ranking=2&` + // Maximize used ingredients
        `ignorePantry=false&` +
        `apiKey=${this.apiKey}`
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const recipes: SpoonacularRecipe[] = await response.json();

      // Get detailed information for each recipe
      const detailedRecipes = await Promise.all(
        recipes.map(recipe => this.getRecipeDetails(recipe.id))
      );

      // Process recipes with special scoring for photo-detected ingredients
      return detailedRecipes
        .map(recipe => this.processPhotoBasedRecipe(recipe, recognizedIngredients))
        .sort((a, b) => b.wasteReductionScore - a.wasteReductionScore);

    } catch (error) {
      if (__DEV__) console.error('Photo ingredient recipe search error:', error);
      return [];
    }
  }

  // NEW: Process recipe with photo-specific scoring
  private processPhotoBasedRecipe(recipe: SpoonacularRecipe, recognizedIngredients: RecognizedIngredient[]): ProcessedRecipe {
    const baseProcessed = this.processRecipe(recipe);

    // Enhanced scoring for photo-detected ingredients
    const photoScore = this.calculatePhotoBasedScore(recipe, recognizedIngredients);

    return {
      ...baseProcessed,
      wasteReductionScore: Math.min(baseProcessed.wasteReductionScore + photoScore, 100),
      wasteReductionTags: [
        ...baseProcessed.wasteReductionTags,
        ...this.generatePhotoBasedTags(recipe, recognizedIngredients)
      ]
    };
  }

  // NEW: Calculate additional score for photo-detected ingredients
  private calculatePhotoBasedScore(recipe: SpoonacularRecipe, recognizedIngredients: RecognizedIngredient[]): number {
    let score = 0;
    const recipeIngredients = recipe.extendedIngredients?.map(ing => ing.name.toLowerCase()) || [];

    recognizedIngredients.forEach(recognized => {
      const isInRecipe = recipeIngredients.some(recipeIng =>
        recipeIng.includes(recognized.name.toLowerCase()) ||
        recognized.name.toLowerCase().includes(recipeIng)
      );

      if (isInRecipe) {
        // Bonus points based on confidence level
        if (recognized.confidence >= 90) score += 15;
        else if (recognized.confidence >= 80) score += 12;
        else if (recognized.confidence >= 70) score += 8;
        else if (recognized.confidence >= 60) score += 5;
      }
    });

    // Bonus for using multiple detected ingredients
    const matchedCount = recognizedIngredients.filter(recognized =>
      recipeIngredients.some(recipeIng =>
        recipeIng.includes(recognized.name.toLowerCase()) ||
        recognized.name.toLowerCase().includes(recipeIng)
      )
    ).length;

    if (matchedCount >= 3) score += 10;
    else if (matchedCount >= 2) score += 5;

    return score;
  }

  // NEW: Generate tags specific to photo-based detection
  private generatePhotoBasedTags(recipe: SpoonacularRecipe, recognizedIngredients: RecognizedIngredient[]): string[] {
    const tags: string[] = [];
    const recipeIngredients = recipe.extendedIngredients?.map(ing => ing.name.toLowerCase()) || [];

    const matchedIngredients = recognizedIngredients.filter(recognized =>
      recipeIngredients.some(recipeIng =>
        recipeIng.includes(recognized.name.toLowerCase()) ||
        recognized.name.toLowerCase().includes(recipeIng)
      )
    );

    if (matchedIngredients.length >= 3) {
      tags.push('Perfect Match');
    } else if (matchedIngredients.length >= 2) {
      tags.push('Good Match');
    }

    // Check for high-confidence ingredients
    const highConfidenceMatches = matchedIngredients.filter(ing => ing.confidence >= 85);
    if (highConfidenceMatches.length > 0) {
      tags.push('High Confidence Match');
    }

    // Check for fresh ingredients (common in photos)
    const freshIngredients = ['fruits', 'vegetables', 'herbs'];
    const hasFreshIngredients = matchedIngredients.some(ing =>
      freshIngredients.includes(ing.category || '')
    );
    if (hasFreshIngredients) {
      tags.push('Fresh Ingredients');
    }

    return tags;
  }

  // NEW: Get smart recipe suggestions based on what's detected in photo
  async getSmartPhotoRecipes(recognizedIngredients: RecognizedIngredient[]): Promise<{
    primaryRecipes: ProcessedRecipe[];
    alternativeRecipes: ProcessedRecipe[];
    suggestions: {
      missingCommonIngredients: string[];
      cookingTips: string[];
      alternativeIngredients: string[];
    };
  }> {
    // Get recipes using detected ingredients
    const primaryRecipes = await this.searchRecipesByPhotoIngredients(recognizedIngredients);

    // Get alternative recipes with broader search
    const alternativeIngredients = recognizedIngredients
      .map(ing => ing.name)
      .concat(this.getRelatedIngredients(recognizedIngredients));

    const alternativeRecipes = await this.searchRecipesByIngredients(false);

    // Generate smart suggestions
    const suggestions = this.generateSmartSuggestions(recognizedIngredients, primaryRecipes);

    return {
      primaryRecipes: primaryRecipes.slice(0, 10),
      alternativeRecipes: alternativeRecipes.slice(0, 5),
      suggestions
    };
  }

  // NEW: Get ingredients related to detected ones
  private getRelatedIngredients(recognizedIngredients: RecognizedIngredient[]): string[] {
    const related: string[] = [];

    recognizedIngredients.forEach(ingredient => {
      const category = ingredient.category;
      if (category === 'vegetables') {
        related.push('onion', 'garlic', 'olive oil');
      } else if (category === 'fruits') {
        related.push('sugar', 'lemon', 'honey');
      } else if (category === 'proteins') {
        related.push('salt', 'pepper', 'herbs');
      }
    });

    return [...new Set(related)]; // Remove duplicates
  }

  // NEW: Generate smart cooking suggestions
  private generateSmartSuggestions(
    recognizedIngredients: RecognizedIngredient[],
    recipes: ProcessedRecipe[]
  ): {
    missingCommonIngredients: string[];
    cookingTips: string[];
    alternativeIngredients: string[];
  } {
    const commonMissing = this.findCommonMissingIngredients(recipes);
    const cookingTips = this.generateCookingTips(recognizedIngredients);
    const alternatives = this.suggestAlternatives(recognizedIngredients);

    return {
      missingCommonIngredients: commonMissing.slice(0, 5),
      cookingTips: cookingTips.slice(0, 3),
      alternativeIngredients: alternatives.slice(0, 5)
    };
  }

  // NEW: Find commonly missing ingredients across recipes
  private findCommonMissingIngredients(recipes: ProcessedRecipe[]): string[] {
    const missingCounts: { [key: string]: number } = {};

    recipes.forEach(recipe => {
      recipe.missedIngredients.forEach(missing => {
        missingCounts[missing] = (missingCounts[missing] || 0) + 1;
      });
    });

    return Object.entries(missingCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([ingredient]) => ingredient);
  }

  // NEW: Generate cooking tips based on detected ingredients
  private generateCookingTips(recognizedIngredients: RecognizedIngredient[]): string[] {
    const tips: string[] = [];

    recognizedIngredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();

      if (name.includes('tomato')) {
        tips.push('Score an X on tomatoes before blanching for easy peeling');
      } else if (name.includes('onion')) {
        tips.push('Chill onions before cutting to reduce tears');
      } else if (name.includes('garlic')) {
        tips.push('Crush garlic with the flat side of a knife for easy peeling');
      } else if (name.includes('herb')) {
        tips.push('Add fresh herbs at the end of cooking to preserve flavor');
      }
    });

    return [...new Set(tips)]; // Remove duplicates
  }

  // NEW: Suggest alternative ingredients
  private suggestAlternatives(recognizedIngredients: RecognizedIngredient[]): string[] {
    const alternatives: string[] = [];

    recognizedIngredients.forEach(ingredient => {
      const substitutes = SUBSTITUTION_MAP[ingredient.name.toLowerCase()];
      if (substitutes) {
        alternatives.push(...substitutes.slice(0, 2)); // Add top 2 alternatives
      }
    });

    return [...new Set(alternatives)]; // Remove duplicates
  }
}