import { FoodItem, supabase } from '@/lib/supabase';

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
      console.error('Recipe search error:', error);
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
      console.error('Expiration-based recipe search error:', error);
      return [];
    }
  }
}