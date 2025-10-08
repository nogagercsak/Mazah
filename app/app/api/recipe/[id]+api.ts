import { ExpoRequest, ExpoResponse } from 'expo-router/server';

interface RecipeDetails {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  instructions: any[];
  extendedIngredients: any[];
  nutrition?: any;
  diets: string[];
  dishTypes: string[];
  winePairing?: any;
}

export async function GET(request: ExpoRequest, { id }: { id: string }): Promise<ExpoResponse> {
  try {
    // Validate recipe ID
    const recipeId = parseInt(id);
    if (isNaN(recipeId) || recipeId <= 0) {
      return ExpoResponse.json(
        { error: 'Invalid recipe ID' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const spoonacularApiKey = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
    if (!spoonacularApiKey) {
      return ExpoResponse.json(
        { error: 'Recipe service configuration error' },
        { status: 500 }
      );
    }

    // Fetch recipe details from Spoonacular
    const response = await fetch(
      `https://api.spoonacular.com/recipes/${recipeId}/information?` +
      `includeNutrition=true&` +
      `apiKey=${spoonacularApiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return ExpoResponse.json(
          { error: 'Recipe not found' },
          { status: 404 }
        );
      } else if (response.status === 429) {
        return ExpoResponse.json(
          { error: 'Recipe service rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      } else {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }
    }

    const recipeData: RecipeDetails = await response.json();

    // Process and format the recipe data
    const processedRecipe = {
      id: recipeData.id,
      title: recipeData.title,
      image: recipeData.image,
      readyInMinutes: recipeData.readyInMinutes,
      servings: recipeData.servings,
      summary: stripHtml(recipeData.summary),

      // Process ingredients
      ingredients: recipeData.extendedIngredients?.map(ingredient => ({
        id: ingredient.id,
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
        original: ingredient.original,
        image: ingredient.image ? `https://spoonacular.com/cdn/ingredients_100x100/${ingredient.image}` : null
      })) || [],

      // Process instructions
      instructions: processInstructions(recipeData.instructions),

      // Additional details
      diets: recipeData.diets || [],
      dishTypes: recipeData.dishTypes || [],

      // Nutrition information (if available)
      nutrition: recipeData.nutrition ? {
        calories: recipeData.nutrition.nutrients?.find((n: any) => n.name === 'Calories')?.amount || 0,
        protein: recipeData.nutrition.nutrients?.find((n: any) => n.name === 'Protein')?.amount || 0,
        carbs: recipeData.nutrition.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount || 0,
        fat: recipeData.nutrition.nutrients?.find((n: any) => n.name === 'Fat')?.amount || 0,
        fiber: recipeData.nutrition.nutrients?.find((n: any) => n.name === 'Fiber')?.amount || 0,
        sugar: recipeData.nutrition.nutrients?.find((n: any) => n.name === 'Sugar')?.amount || 0,
        sodium: recipeData.nutrition.nutrients?.find((n: any) => n.name === 'Sodium')?.amount || 0,
      } : null,

      // Wine pairing (if available)
      winePairing: recipeData.winePairing ? {
        pairedWines: recipeData.winePairing.pairedWines || [],
        pairingText: recipeData.winePairing.pairingText || '',
        productMatches: recipeData.winePairing.productMatches || []
      } : null,

      // Metadata
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'spoonacular'
      }
    };

    return ExpoResponse.json({
      success: true,
      recipe: processedRecipe
    });

  } catch (error: any) {
    console.error('Recipe fetch error:', error);

    // Handle specific errors
    if (error.message?.includes('429') || error.message?.includes('rate')) {
      return ExpoResponse.json(
        {
          error: 'Recipe service rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }

    if (error.message?.includes('API Error')) {
      return ExpoResponse.json(
        {
          error: 'Recipe service temporarily unavailable.',
          code: 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return ExpoResponse.json(
        {
          error: 'Network error. Please check your internet connection.',
          code: 'NETWORK_ERROR'
        },
        { status: 503 }
      );
    }

    return ExpoResponse.json(
      {
        error: 'Failed to fetch recipe details. Please try again.',
        code: 'FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}

// Helper function to strip HTML tags from text
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// Helper function to process instructions
function processInstructions(instructions: any[]): any[] {
  if (!instructions || !Array.isArray(instructions)) {
    return [];
  }

  return instructions.map((instruction, index) => {
    if (typeof instruction === 'string') {
      return {
        number: index + 1,
        step: stripHtml(instruction)
      };
    }

    if (instruction.steps && Array.isArray(instruction.steps)) {
      return instruction.steps.map((step: any) => ({
        number: step.number,
        step: stripHtml(step.step),
        ingredients: step.ingredients || [],
        equipment: step.equipment || []
      }));
    }

    return {
      number: instruction.number || index + 1,
      step: stripHtml(instruction.step || instruction)
    };
  }).flat();
}

// Handle preflight requests for CORS
export async function OPTIONS(request: ExpoRequest): Promise<ExpoResponse> {
  return new ExpoResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}