import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { RecipeService } from '@/services/recipeService';

interface RecipeRequest {
  ingredients: string[];
  filters?: {
    useExpiring?: boolean;
    quickMeals?: boolean;
    easyOnly?: boolean;
    minMatchPercentage?: number;
    cuisine?: string;
    diet?: string;
    maxCookingTime?: number;
  };
  userId?: string;
  pagination?: {
    page: number;
    limit: number;
  };
}

export async function POST(request: ExpoRequest): Promise<ExpoResponse> {
  try {
    const body: RecipeRequest = await request.json();

    // Validate request
    if (!body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      return ExpoResponse.json(
        { error: 'No ingredients provided' },
        { status: 400 }
      );
    }

    // Validate ingredients array
    if (body.ingredients.some(ing => typeof ing !== 'string' || ing.trim().length === 0)) {
      return ExpoResponse.json(
        { error: 'Invalid ingredients format' },
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

    // Initialize recipe service
    const recipeService = new RecipeService(spoonacularApiKey);

    // Load user inventory if userId provided
    if (body.userId) {
      try {
        await recipeService.loadUserInventory(body.userId);
      } catch (error) {
        console.warn('Failed to load user inventory:', error);
        // Continue without user inventory
      }
    }

    // Search for recipes
    let recipes;
    if (body.filters) {
      recipes = await recipeService.getWasteReductionRecipes(body.filters);
    } else {
      // Use the ingredients to search for recipes directly
      recipes = await recipeService.searchRecipesByIngredients(body.filters?.useExpiring ?? false);
    }

    // Apply pagination
    const page = body.pagination?.page || 1;
    const limit = Math.min(body.pagination?.limit || 20, 50); // Cap at 50 results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecipes = recipes.slice(startIndex, endIndex);

    // Calculate total pages
    const totalPages = Math.ceil(recipes.length / limit);

    return ExpoResponse.json({
      success: true,
      recipes: paginatedRecipes,
      totalResults: recipes.length,
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        resultsPerPage: limit
      },
      metadata: {
        searchIngredients: body.ingredients,
        appliedFilters: body.filters || {},
        processingTime: Date.now() // You could track actual processing time
      }
    });

  } catch (error: any) {
    console.error('Recipe search error:', error);

    // Handle API rate limiting
    if (error.message?.includes('429') || error.message?.includes('rate')) {
      return ExpoResponse.json(
        {
          error: 'Recipe service rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }

    // Handle API errors
    if (error.message?.includes('API Error')) {
      return ExpoResponse.json(
        {
          error: 'Recipe service temporarily unavailable.',
          code: 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    // Handle network errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return ExpoResponse.json(
        {
          error: 'Network error. Please check your internet connection.',
          code: 'NETWORK_ERROR'
        },
        { status: 503 }
      );
    }

    // Generic error
    return ExpoResponse.json(
      {
        error: 'Failed to search recipes. Please try again.',
        code: 'SEARCH_ERROR'
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: ExpoRequest): Promise<ExpoResponse> {
  return new ExpoResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}