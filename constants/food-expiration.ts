export interface FoodItem {
  name: string;
  category: string;
  fridgeDays: number;
  freezerDays: number;
  pantryDays: number;
}

export const FOOD_EXPIRATION_DATA: FoodItem[] = [
  // Dairy
  { name: "milk", category: "dairy", fridgeDays: 7, freezerDays: 90, pantryDays: 0 },
  { name: "yogurt", category: "dairy", fridgeDays: 10, freezerDays: 60, pantryDays: 0 },
  { name: "butter", category: "dairy", fridgeDays: 30, freezerDays: 365, pantryDays: 0 },
  { name: "eggs", category: "dairy", fridgeDays: 28, freezerDays: 365, pantryDays: 0 },
  { name: "cream", category: "dairy", fridgeDays: 10, freezerDays: 60, pantryDays: 0 },
  { name: "half and half", category: "dairy", fridgeDays: 7, freezerDays: 90, pantryDays: 0 },
  { name: "margarine", category: "dairy", fridgeDays: 90, freezerDays: 365, pantryDays: 0 },
  { name: "cream cheese", category: "dairy", fridgeDays: 14, freezerDays: 60, pantryDays: 0 },
  { name: "cottage cheese", category: "dairy", fridgeDays: 10, freezerDays: 90, pantryDays: 0 },
  { name: "sour cream", category: "dairy", fridgeDays: 14, freezerDays: 60, pantryDays: 0 },
  { name: "egg whites", category: "dairy", fridgeDays: 7, freezerDays: 365, pantryDays: 0 },
  { name: "egg yolks", category: "dairy", fridgeDays: 2, freezerDays: 365, pantryDays: 0 },

  // Meat
  { name: "chicken", category: "meat", fridgeDays: 2, freezerDays: 270, pantryDays: 0 },
  { name: "beef", category: "meat", fridgeDays: 3, freezerDays: 365, pantryDays: 0 },
  { name: "pork", category: "meat", fridgeDays: 3, freezerDays: 270, pantryDays: 0 },
  { name: "turkey", category: "meat", fridgeDays: 2, freezerDays: 270, pantryDays: 0 },
  { name: "duck", category: "meat", fridgeDays: 2, freezerDays: 270, pantryDays: 0 },
  { name: "lamb", category: "meat", fridgeDays: 3, freezerDays: 270, pantryDays: 0 },
  { name: "veal", category: "meat", fridgeDays: 3, freezerDays: 270, pantryDays: 0 },
  { name: "ground beef", category: "meat", fridgeDays: 2, freezerDays: 120, pantryDays: 0 },
  { name: "ground pork", category: "meat", fridgeDays: 2, freezerDays: 120, pantryDays: 0 },
  { name: "ground chicken", category: "meat", fridgeDays: 2, freezerDays: 120, pantryDays: 0 },
  { name: "bacon", category: "meat", fridgeDays: 7, freezerDays: 30, pantryDays: 0 },
  { name: "sausage", category: "meat", fridgeDays: 2, freezerDays: 60, pantryDays: 0 },
  { name: "hot dogs", category: "meat", fridgeDays: 14, freezerDays: 60, pantryDays: 0 },
  { name: "ham", category: "meat", fridgeDays: 7, freezerDays: 60, pantryDays: 0 },
  { name: "roast beef", category: "meat", fridgeDays: 5, freezerDays: 60, pantryDays: 0 },
  { name: "turkey breast", category: "meat", fridgeDays: 5, freezerDays: 60, pantryDays: 0 },
  { name: "salami", category: "meat", fridgeDays: 21, freezerDays: 60, pantryDays: 0 },
  { name: "pepperoni", category: "meat", fridgeDays: 21, freezerDays: 60, pantryDays: 0 },

  // Seafood
  { name: "salmon", category: "seafood", fridgeDays: 2, freezerDays: 180, pantryDays: 0 },
  { name: "shrimp", category: "seafood", fridgeDays: 2, freezerDays: 180, pantryDays: 0 },
  { name: "tuna", category: "seafood", fridgeDays: 2, freezerDays: 180, pantryDays: 0 },
  { name: "cod", category: "seafood", fridgeDays: 2, freezerDays: 180, pantryDays: 0 },
  { name: "tilapia", category: "seafood", fridgeDays: 2, freezerDays: 180, pantryDays: 0 },
  { name: "crab", category: "seafood", fridgeDays: 2, freezerDays: 180, pantryDays: 0 },
  { name: "lobster", category: "seafood", fridgeDays: 2, freezerDays: 180, pantryDays: 0 },
  { name: "fish", category: "seafood", fridgeDays: 2, freezerDays: 180, pantryDays: 0 }, // Fixed category
  { name: "shellfish", category: "seafood", fridgeDays: 2, freezerDays: 180, pantryDays: 0 },
  { name: "clams", category: "seafood", fridgeDays: 2, freezerDays: 90, pantryDays: 0 },
  { name: "mussels", category: "seafood", fridgeDays: 2, freezerDays: 90, pantryDays: 0 },
  { name: "oysters", category: "seafood", fridgeDays: 2, freezerDays: 90, pantryDays: 0 },
  { name: "squid", category: "seafood", fridgeDays: 2, freezerDays: 90, pantryDays: 0 },

  // Fruit 
  { name: "apple", category: "fruit", fridgeDays: 30, freezerDays: 240, pantryDays: 21 },
  { name: "banana", category: "fruit", fridgeDays: 7, freezerDays: 90, pantryDays: 5 },
  { name: "orange", category: "fruit", fridgeDays: 21, freezerDays: 120, pantryDays: 14 },
  { name: "lemon", category: "fruit", fridgeDays: 30, freezerDays: 120, pantryDays: 14 },
  { name: "lime", category: "fruit", fridgeDays: 30, freezerDays: 120, pantryDays: 14 },
  { name: "grapefruit", category: "fruit", fridgeDays: 21, freezerDays: 120, pantryDays: 14 },
  { name: "grapes", category: "fruit", fridgeDays: 14, freezerDays: 90, pantryDays: 7 },
  { name: "strawberries", category: "fruit", fridgeDays: 5, freezerDays: 365, pantryDays: 2 },
  { name: "blueberries", category: "fruit", fridgeDays: 10, freezerDays: 365, pantryDays: 3 },
  { name: "raspberries", category: "fruit", fridgeDays: 3, freezerDays: 365, pantryDays: 2 },
  { name: "blackberries", category: "fruit", fridgeDays: 3, freezerDays: 365, pantryDays: 2 },
  { name: "peach", category: "fruit", fridgeDays: 5, freezerDays: 365, pantryDays: 3 },
  { name: "plum", category: "fruit", fridgeDays: 5, freezerDays: 365, pantryDays: 3 },
  { name: "pear", category: "fruit", fridgeDays: 7, freezerDays: 365, pantryDays: 5 },
  { name: "kiwi", category: "fruit", fridgeDays: 14, freezerDays: 365, pantryDays: 7 },
  { name: "pineapple", category: "fruit", fridgeDays: 7, freezerDays: 365, pantryDays: 5 },
  { name: "mango", category: "fruit", fridgeDays: 7, freezerDays: 365, pantryDays: 5 },
  { name: "avocado", category: "fruit", fridgeDays: 5, freezerDays: 180, pantryDays: 3 },
  { name: "watermelon", category: "fruit", fridgeDays: 7, freezerDays: 365, pantryDays: 5 },
  { name: "cantaloupe", category: "fruit", fridgeDays: 7, freezerDays: 365, pantryDays: 5 },
  { name: "honeydew", category: "fruit", fridgeDays: 7, freezerDays: 365, pantryDays: 5 },

  // Vegetables (removed duplicates)
  { name: "carrot", category: "vegetable", fridgeDays: 21, freezerDays: 270, pantryDays: 7 },
  { name: "broccoli", category: "vegetable", fridgeDays: 7, freezerDays: 240, pantryDays: 0 },
  { name: "spinach", category: "vegetable", fridgeDays: 5, freezerDays: 240, pantryDays: 0 },
  { name: "lettuce", category: "vegetable", fridgeDays: 7, freezerDays: 0, pantryDays: 3 },
  { name: "cabbage", category: "vegetable", fridgeDays: 21, freezerDays: 240, pantryDays: 7 },
  { name: "cauliflower", category: "vegetable", fridgeDays: 7, freezerDays: 240, pantryDays: 0 },
  { name: "tomato", category: "vegetable", fridgeDays: 7, freezerDays: 0, pantryDays: 5 },
  { name: "potato", category: "vegetable", fridgeDays: 60, freezerDays: 0, pantryDays: 90 },
  { name: "onion", category: "vegetable", fridgeDays: 30, freezerDays: 0, pantryDays: 60 },
  { name: "garlic", category: "vegetable", fridgeDays: 90, freezerDays: 0, pantryDays: 180 },
  { name: "bell pepper", category: "vegetable", fridgeDays: 7, freezerDays: 240, pantryDays: 0 },
  { name: "cucumber", category: "vegetable", fridgeDays: 7, freezerDays: 0, pantryDays: 3 },
  { name: "zucchini", category: "vegetable", fridgeDays: 5, freezerDays: 240, pantryDays: 0 },
  { name: "eggplant", category: "vegetable", fridgeDays: 5, freezerDays: 240, pantryDays: 0 },
  { name: "mushroom", category: "vegetable", fridgeDays: 7, freezerDays: 240, pantryDays: 0 },
  { name: "celery", category: "vegetable", fridgeDays: 14, freezerDays: 180, pantryDays: 7 },
  { name: "asparagus", category: "vegetable", fridgeDays: 5, freezerDays: 240, pantryDays: 0 },
  { name: "green beans", category: "vegetable", fridgeDays: 7, freezerDays: 240, pantryDays: 0 },
  { name: "corn", category: "vegetable", fridgeDays: 5, freezerDays: 240, pantryDays: 0 },
  { name: "kale", category: "vegetable", fridgeDays: 5, freezerDays: 365, pantryDays: 2 },
  { name: "sweet potato", category: "vegetable", fridgeDays: 14, freezerDays: 180, pantryDays: 14 },
  { name: "peas", category: "vegetable", fridgeDays: 5, freezerDays: 365, pantryDays: 3 },

  // Grains 
  { name: "bread", category: "grains", fridgeDays: 7, freezerDays: 90, pantryDays: 5 },
  { name: "rice", category: "grains", fridgeDays: 5, freezerDays: 180, pantryDays: 365 },
  { name: "pasta", category: "grains", fridgeDays: 5, freezerDays: 180, pantryDays: 365 },
  { name: "flour - white", category: "grains", fridgeDays: 365, freezerDays: 730, pantryDays: 365 },
  { name: "flour - whole wheat", category: "grains", fridgeDays: 180, freezerDays: 365, pantryDays: 90 },
  { name: "oats", category: "grains", fridgeDays: 365, freezerDays: 730, pantryDays: 365 },
  { name: "quinoa", category: "grains", fridgeDays: 365, freezerDays: 730, pantryDays: 365 },
  { name: "cereal", category: "grains", fridgeDays: 180, freezerDays: 365, pantryDays: 180 },
  { name: "tortillas", category: "grains", fridgeDays: 14, freezerDays: 90, pantryDays: 30 },
  { name: "baguette", category: "grains", fridgeDays: 7, freezerDays: 90, pantryDays: 3 },

  // Baked Goods (removed duplicates)
  { name: "muffins", category: "baked goods", fridgeDays: 7, freezerDays: 90, pantryDays: 3 },
  { name: "pie", category: "baked goods", fridgeDays: 3, freezerDays: 90, pantryDays: 2 },
  { name: "bagels", category: "baked goods", fridgeDays: 7, freezerDays: 90, pantryDays: 5 },
  { name: "cake", category: "baked goods", fridgeDays: 7, freezerDays: 90, pantryDays: 3 },
  { name: "cookies", category: "baked goods", fridgeDays: 14, freezerDays: 90, pantryDays: 7 },
  { name: "pastries", category: "baked goods", fridgeDays: 3, freezerDays: 90, pantryDays: 2 },

  // Herbs
  { name: "basil", category: "herb", fridgeDays: 7, freezerDays: 180, pantryDays: 3 },
  { name: "parsley", category: "herb", fridgeDays: 7, freezerDays: 180, pantryDays: 3 },
  { name: "cilantro", category: "herb", fridgeDays: 7, freezerDays: 180, pantryDays: 3 },
  { name: "mint", category: "herb", fridgeDays: 7, freezerDays: 180, pantryDays: 3 },
  { name: "rosemary", category: "herb", fridgeDays: 14, freezerDays: 180, pantryDays: 7 },
  { name: "thyme", category: "herb", fridgeDays: 14, freezerDays: 180, pantryDays: 7 },
  { name: "oregano", category: "herb", fridgeDays: 14, freezerDays: 180, pantryDays: 7 },
  { name: "sage", category: "herb", fridgeDays: 14, freezerDays: 180, pantryDays: 7 },

  // Nuts and Seeds
  { name: "almonds", category: "nuts", fridgeDays: 180, freezerDays: 365, pantryDays: 90 },
  { name: "walnuts", category: "nuts", fridgeDays: 180, freezerDays: 365, pantryDays: 60 },
  { name: "peanuts", category: "nuts", fridgeDays: 180, freezerDays: 365, pantryDays: 90 },
  { name: "cashews", category: "nuts", fridgeDays: 180, freezerDays: 365, pantryDays: 90 },
  { name: "pecans", category: "nuts", fridgeDays: 180, freezerDays: 365, pantryDays: 60 },
  { name: "chia seeds", category: "nuts", fridgeDays: 365, freezerDays: 730, pantryDays: 365 },
  { name: "flax seeds", category: "nuts", fridgeDays: 365, freezerDays: 730, pantryDays: 180 },

  // Beverages
  { name: "juice", category: "beverages", fridgeDays: 7, freezerDays: 90, pantryDays: 0 },
  { name: "soda", category: "beverages", fridgeDays: 0, freezerDays: 0, pantryDays: 180 },

  // Miscellaneous
  { name: "honey", category: "miscellaneous", fridgeDays: 0, freezerDays: 0, pantryDays: 730 },
  { name: "peanut butter", category: "miscellaneous", fridgeDays: 180, freezerDays: 0, pantryDays: 365 },
  { name: "tofu", category: "miscellaneous", fridgeDays: 7, freezerDays: 180, pantryDays: 0 },
  { name: "tempeh", category: "miscellaneous", fridgeDays: 10, freezerDays: 180, pantryDays: 0 },
  { name: "hummus", category: "miscellaneous", fridgeDays: 7, freezerDays: 90, pantryDays: 0 },
  { name: "salsa", category: "miscellaneous", fridgeDays: 14, freezerDays: 90, pantryDays: 0 },
  { name: "pickles", category: "miscellaneous", fridgeDays: 365, freezerDays: 0, pantryDays: 180 },
  { name: "jam", category: "miscellaneous", fridgeDays: 365, freezerDays: 0, pantryDays: 180 },
  { name: "maple syrup", category: "miscellaneous", fridgeDays: 365, freezerDays: 0, pantryDays: 365 },
];

export const getExpirationSuggestion = (
  foodName: string,
  storageType: 'fridge' | 'freezer' | 'pantry' = 'fridge'
): number | null => {
  const foodItem = FOOD_EXPIRATION_DATA.find(item =>
    item.name.toLowerCase() === foodName.toLowerCase()
  );

  if (!foodItem) return null;

  switch (storageType) {
    case 'fridge': return foodItem.fridgeDays;
    case 'freezer': return foodItem.freezerDays;
    case 'pantry': return foodItem.pantryDays;
    default: return foodItem.fridgeDays;
  }
};
