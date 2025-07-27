// ingredientSubstitutions.ts

export interface SubstitutionCategory {
  category: string;
  substitutions: { [key: string]: string[] };
}

export const COMPREHENSIVE_SUBSTITUTIONS: SubstitutionCategory[] = [
  {
    category: 'Dairy',
    substitutions: {
      'butter': ['margarine', 'coconut oil', 'olive oil', 'applesauce (for baking)', 'greek yogurt'],
      'milk': ['almond milk', 'soy milk', 'oat milk', 'coconut milk', 'cashew milk', 'rice milk'],
      'heavy cream': ['coconut cream', 'evaporated milk', 'greek yogurt + milk', 'cashew cream'],
      'sour cream': ['greek yogurt', 'cream cheese', 'cottage cheese (blended)', 'coconut cream'],
      'cream cheese': ['greek yogurt (strained)', 'cottage cheese (blended)', 'ricotta', 'mascarpone'],
      'yogurt': ['sour cream', 'buttermilk', 'cottage cheese', 'coconut yogurt'],
      'buttermilk': ['milk + lemon juice', 'milk + vinegar', 'yogurt + water', 'sour cream + water'],
      'cheese': ['nutritional yeast', 'cashew cheese', 'tofu (for ricotta)', 'hummus (for spreads)'],
      'parmesan': ['pecorino romano', 'grana padano', 'nutritional yeast', 'breadcrumbs (for texture)'],
      'mozzarella': ['provolone', 'white cheddar', 'monterey jack', 'cashew cheese'],
    }
  },
  {
    category: 'Proteins',
    substitutions: {
      'chicken': ['turkey', 'pork', 'tofu', 'tempeh', 'seitan', 'jackfruit (for pulled texture)'],
      'beef': ['lamb', 'bison', 'turkey', 'mushrooms', 'lentils', 'black beans', 'tempeh'],
      'pork': ['chicken', 'turkey', 'beef', 'tempeh', 'mushrooms'],
      'fish': ['tofu', 'tempeh', 'hearts of palm', 'banana blossom', 'chickpea flour batter'],
      'eggs': ['flax eggs', 'chia eggs', 'applesauce', 'mashed banana', 'silken tofu', 'aquafaba'],
      'bacon': ['turkey bacon', 'tempeh bacon', 'mushroom bacon', 'coconut bacon', 'smoked paprika'],
    }
  },
  {
    category: 'Vegetables',
    substitutions: {
      'onion': ['shallot', 'leek', 'scallions', 'garlic', 'onion powder', 'chives'],
      'garlic': ['garlic powder', 'shallot', 'garlic scapes', 'onion', 'asafoetida'],
      'tomato': ['red bell pepper', 'tomato paste', 'tomato sauce', 'sun-dried tomatoes'],
      'mushrooms': ['eggplant', 'zucchini', 'tofu', 'tempeh', 'sun-dried tomatoes'],
      'bell pepper': ['poblano pepper', 'anaheim pepper', 'tomato', 'zucchini'],
      'spinach': ['kale', 'swiss chard', 'collard greens', 'arugula', 'bok choy'],
      'kale': ['collard greens', 'swiss chard', 'spinach', 'mustard greens', 'cabbage'],
      'zucchini': ['yellow squash', 'cucumber', 'eggplant', 'bell pepper'],
      'eggplant': ['zucchini', 'mushrooms', 'tofu', 'bell pepper'],
      'broccoli': ['cauliflower', 'brussels sprouts', 'green beans', 'asparagus'],
      'cauliflower': ['broccoli', 'cabbage', 'brussels sprouts', 'turnips'],
      'carrots': ['parsnips', 'sweet potatoes', 'butternut squash', 'beets'],
      'celery': ['fennel', 'bok choy stems', 'water chestnuts', 'jicama'],
    }
  },
  {
    category: 'Grains & Starches',
    substitutions: {
      'rice': ['quinoa', 'cauliflower rice', 'barley', 'farro', 'bulgur', 'couscous'],
      'pasta': ['zucchini noodles', 'spaghetti squash', 'rice noodles', 'shirataki noodles'],
      'bread': ['tortillas', 'pita', 'naan', 'crackers', 'rice cakes', 'lettuce wraps'],
      'flour': ['almond flour', 'coconut flour', 'oat flour', 'rice flour', 'chickpea flour'],
      'cornstarch': ['arrowroot powder', 'tapioca starch', 'potato starch', 'flour'],
      'breadcrumbs': ['crushed crackers', 'oats', 'crushed nuts', 'panko', 'crushed cereal'],
      'oats': ['quinoa flakes', 'rice', 'buckwheat', 'millet', 'barley'],
      'potatoes': ['sweet potatoes', 'cauliflower', 'turnips', 'rutabaga', 'parsnips'],
    }
  },
  {
    category: 'Condiments & Sauces',
    substitutions: {
      'soy sauce': ['tamari', 'coconut aminos', 'worcestershire sauce', 'liquid aminos'],
      'worcestershire': ['soy sauce + vinegar', 'fish sauce', 'tamari + molasses'],
      'ketchup': ['tomato paste + vinegar + sugar', 'barbecue sauce', 'sriracha'],
      'mayonnaise': ['greek yogurt', 'sour cream', 'avocado', 'hummus', 'tahini'],
      'mustard': ['horseradish', 'wasabi', 'mayonnaise + turmeric', 'hot sauce'],
      'vinegar': ['lemon juice', 'lime juice', 'wine', 'citric acid'],
      'hot sauce': ['cayenne pepper', 'red pepper flakes', 'sriracha', 'harissa', 'gochujang'],
    }
  },
  {
    category: 'Herbs & Spices',
    substitutions: {
      'basil': ['oregano', 'thyme', 'parsley', 'cilantro', 'mint'],
      'oregano': ['basil', 'thyme', 'marjoram', 'italian seasoning'],
      'thyme': ['oregano', 'basil', 'marjoram', 'rosemary', 'sage'],
      'rosemary': ['thyme', 'sage', 'oregano', 'tarragon'],
      'cilantro': ['parsley', 'basil', 'dill', 'mint', 'oregano'],
      'parsley': ['cilantro', 'basil', 'chervil', 'dill', 'celery leaves'],
      'dill': ['tarragon', 'fennel fronds', 'parsley', 'basil'],
      'ginger': ['galangal', 'turmeric', 'cardamom', 'allspice'],
      'cinnamon': ['nutmeg', 'allspice', 'cardamom', 'ginger'],
      'nutmeg': ['cinnamon', 'mace', 'allspice', 'ginger'],
      'paprika': ['cayenne + sweet pepper', 'chili powder', 'hot sauce'],
      'cumin': ['coriander', 'caraway', 'chili powder', 'garam masala'],
    }
  },
  {
    category: 'Baking',
    substitutions: {
      'baking powder': ['baking soda + cream of tartar', 'self-rising flour'],
      'baking soda': ['baking powder (3x amount)', 'potassium bicarbonate'],
      'vanilla extract': ['vanilla bean', 'almond extract', 'maple syrup', 'honey'],
      'sugar': ['honey', 'maple syrup', 'agave nectar', 'stevia', 'coconut sugar'],
      'brown sugar': ['white sugar + molasses', 'coconut sugar', 'honey', 'maple syrup'],
      'molasses': ['honey', 'maple syrup', 'brown sugar', 'dark corn syrup'],
      'chocolate chips': ['cocoa powder + butter', 'carob chips', 'chopped chocolate bar'],
      'cocoa powder': ['melted chocolate', 'carob powder', 'hot chocolate mix'],
    }
  },
  {
    category: 'Citrus & Acids',
    substitutions: {
      'lemon juice': ['lime juice', 'vinegar', 'citric acid', 'orange juice + vinegar'],
      'lime juice': ['lemon juice', 'vinegar', 'grapefruit juice'],
      'orange juice': ['lemon juice + sugar', 'grapefruit juice', 'pineapple juice'],
      'lemon zest': ['lime zest', 'orange zest', 'lemon extract', 'dried lemon peel'],
    }
  }
];

// Helper function to find substitutions for an ingredient
export function findSubstitutions(ingredient: string): string[] {
  const normalizedIngredient = ingredient.toLowerCase().trim();
  const allSubstitutions: string[] = [];

  for (const category of COMPREHENSIVE_SUBSTITUTIONS) {
    for (const [key, substitutes] of Object.entries(category.substitutions)) {
      if (normalizedIngredient.includes(key) || key.includes(normalizedIngredient)) {
        allSubstitutions.push(...substitutes);
      }
    }
  }

  // Remove duplicates
  return [...new Set(allSubstitutions)];
}

// Helper function to check if we have a substitute in inventory
export function findAvailableSubstitute(
  missingIngredient: string, 
  availableIngredients: string[]
): { substitute: string; available: boolean } | null {
  const possibleSubstitutes = findSubstitutions(missingIngredient);
  const normalizedAvailable = availableIngredients.map(ing => ing.toLowerCase());

  for (const substitute of possibleSubstitutes) {
    const normalizedSubstitute = substitute.toLowerCase();
    const isAvailable = normalizedAvailable.some(available => 
      available.includes(normalizedSubstitute) || normalizedSubstitute.includes(available)
    );

    if (isAvailable) {
      return { substitute, available: true };
    }
  }

  // Return the first substitute even if not available
  if (possibleSubstitutes.length > 0) {
    return { substitute: possibleSubstitutes[0], available: false };
  }

  return null;
}

// Waste-prone ingredients that should be prioritized
export const WASTE_PRONE_INGREDIENTS = [
  'lettuce', 'spinach', 'kale', 'arugula', 'mixed greens', 'herbs',
  'berries', 'strawberries', 'raspberries', 'blueberries', 'blackberries',
  'banana', 'avocado', 'tomato', 'cucumber', 'mushrooms',
  'milk', 'yogurt', 'cream', 'soft cheese',
  'bread', 'fresh pasta', 'prepared meals',
  'fish', 'seafood', 'ground meat',
];

// Function to check if an ingredient is waste-prone
export function isWasteProne(ingredient: string): boolean {
  const normalized = ingredient.toLowerCase();
  return WASTE_PRONE_INGREDIENTS.some(prone => 
    normalized.includes(prone) || prone.includes(normalized)
  );
}