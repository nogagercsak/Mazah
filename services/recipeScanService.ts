import * as FileSystem from 'expo-file-system';

export interface ExtractedFood {
  name: string;
  quantity: string;
  category: 'dairy' | 'produce' | 'meat' | 'pantry' | 'frozen' | 'other';
  estimatedExpirationDays: number;
  suggestedStorage: 'fridge' | 'pantry' | 'freezer';
}

// Expiration estimates (in days) based on food categories
const EXPIRATION_ESTIMATES = {
  dairy: {
    milk: 7,
    cheese: 21,
    yogurt: 14,
    butter: 30,
    cream: 7,
    default: 10,
  },
  produce: {
    leafy_greens: 5,
    berries: 5,
    apples: 14,
    citrus: 14,
    tomatoes: 7,
    carrots: 21,
    potatoes: 30,
    onions: 30,
    default: 7,
  },
  meat: {
    raw_chicken: 2,
    raw_beef: 3,
    raw_pork: 3,
    raw_fish: 2,
    deli_meat: 5,
    bacon: 7,
    default: 3,
  },
  frozen: {
    default: 90,
  },
  pantry: {
    canned: 365,
    pasta: 730,
    rice: 730,
    flour: 180,
    sugar: 730,
    spices: 365,
    default: 180,
  },
  other: {
    default: 30,
  },
};

// Food categorization keywords
const FOOD_CATEGORIES = {
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese', 'parmesan', 'mozzarella', 'cheddar'],
  produce: ['lettuce', 'spinach', 'kale', 'berries', 'strawberries', 'blueberries', 'apple', 'orange', 'banana', 'tomato', 'carrot', 'potato', 'onion', 'garlic', 'pepper', 'cucumber', 'broccoli', 'cauliflower', 'celery', 'lemon', 'lime', 'avocado'],
  meat: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'turkey', 'ham', 'bacon', 'sausage', 'ground beef', 'steak'],
  frozen: ['frozen', 'ice cream'],
  pantry: ['canned', 'pasta', 'rice', 'flour', 'sugar', 'salt', 'pepper', 'spice', 'oil', 'vinegar', 'sauce', 'beans', 'cereal', 'bread'],
};

/**
 * Categorize a food item based on its name
 */
const categorizeFoodItem = (foodName: string): ExtractedFood['category'] => {
  const lowerName = foodName.toLowerCase();

  for (const [category, keywords] of Object.entries(FOOD_CATEGORIES)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category as ExtractedFood['category'];
    }
  }

  return 'other';
};

/**
 * Estimate expiration days based on food name and category
 */
export const estimateExpirationDays = (foodName: string, category: ExtractedFood['category']): number => {
  const lowerName = foodName.toLowerCase();

  // Check for specific items first
  const categoryEstimates = EXPIRATION_ESTIMATES[category] as Record<string, number>;

  for (const [item, days] of Object.entries(categoryEstimates)) {
    if (item !== 'default' && lowerName.includes(item.replace('_', ' '))) {
      return days;
    }
  }

  // Return category default
  return categoryEstimates.default;
};

/**
 * Suggest storage location based on food category
 */
const suggestStorageLocation = (category: ExtractedFood['category']): ExtractedFood['suggestedStorage'] => {
  switch (category) {
    case 'dairy':
    case 'meat':
    case 'produce':
      return 'fridge';
    case 'frozen':
      return 'freezer';
    case 'pantry':
    case 'other':
    default:
      return 'pantry';
  }
};

/**
 * Extract recipe ingredients from an image using AI
 * This is a placeholder - you'll need to integrate with an actual OCR/AI service
 * like Google Cloud Vision, AWS Textract, or OpenAI Vision API
 */
export const extractRecipeFromImage = async (imageUri: string): Promise<ExtractedFood[]> => {
  try {
    // For now, return mock data
    // In production, you would:
    // 1. Upload image to your server or directly to AI service
    // 2. Call OCR to extract text
    // 3. Use AI to parse ingredients from the text
    // 4. Return structured data

    if (__DEV__) {
      console.log('Extracting recipe from image:', imageUri);
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock extracted foods - replace with actual AI extraction
    const mockExtractedFoods: ExtractedFood[] = [
      { name: 'Organic Milk', quantity: '1 gallon', category: 'dairy', estimatedExpirationDays: 7, suggestedStorage: 'fridge' },
      { name: 'Fresh Spinach', quantity: '1 bunch', category: 'produce', estimatedExpirationDays: 5, suggestedStorage: 'fridge' },
      { name: 'Chicken Breast', quantity: '2 lbs', category: 'meat', estimatedExpirationDays: 3, suggestedStorage: 'fridge' },
      { name: 'Pasta', quantity: '1 box', category: 'pantry', estimatedExpirationDays: 730, suggestedStorage: 'pantry' },
      { name: 'Tomatoes', quantity: '4', category: 'produce', estimatedExpirationDays: 7, suggestedStorage: 'fridge' },
    ];

    return mockExtractedFoods;

    // Example integration with OpenAI Vision API (commented out):
    /*
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all ingredients from this recipe image. Return a JSON array with objects containing: name (string), quantity (string). Only include food items that would be stored in an inventory.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const extractedText = data.choices[0].message.content;

    // Parse the JSON response
    const parsedIngredients = JSON.parse(extractedText);

    // Enrich with categorization and expiration estimates
    return parsedIngredients.map((item: { name: string; quantity: string }) => {
      const category = categorizeFoodItem(item.name);
      const estimatedExpirationDays = estimateExpirationDays(item.name, category);
      const suggestedStorage = suggestStorageLocation(category);

      return {
        ...item,
        category,
        estimatedExpirationDays,
        suggestedStorage,
      };
    });
    */
  } catch (error) {
    if (__DEV__) {
      console.error('Error extracting recipe from image:', error);
    }
    throw new Error('Failed to extract recipe from image. Please try again.');
  }
};

/**
 * Parse manually entered recipe text
 */
export const parseRecipeText = (recipeText: string): ExtractedFood[] => {
  // Simple parser - split by lines and extract ingredients
  // In production, you might want to use NLP or AI for better parsing

  const lines = recipeText.split('\n').filter(line => line.trim().length > 0);
  const foods: ExtractedFood[] = [];

  for (const line of lines) {
    // Basic pattern matching for "quantity + name" format
    const match = line.match(/^(\d+(?:\.\d+)?(?:\s*(?:cup|tbsp|tsp|lb|lbs|oz|g|kg|gallon|bunch|piece|pieces))?)\s+(.+)$/i);

    if (match) {
      const quantity = match[1].trim();
      const name = match[2].trim();

      const category = categorizeFoodItem(name);
      const estimatedExpirationDays = estimateExpirationDays(name, category);
      const suggestedStorage = suggestStorageLocation(category);

      foods.push({
        name,
        quantity,
        category,
        estimatedExpirationDays,
        suggestedStorage,
      });
    }
  }

  return foods;
};
