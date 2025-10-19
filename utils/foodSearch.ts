import Fuse from 'fuse.js';
import { FOOD_EXPIRATION_DATA, FoodItem } from '@/constants/food-expiration';

const searchableData = FOOD_EXPIRATION_DATA.map(item => ({
  originalItem: item,
  name: item.name,
  category: item.category
}));

const fuse = new Fuse(searchableData, {
  keys: [
    { name: 'name', weight: 0.8 },
    { name: 'category', weight: 0.2 }
  ],
  threshold: 0.3, // Fuzzy matching level
  includeScore: true,
  minMatchCharLength: 2,
  shouldSort: true,
  findAllMatches: true,
  ignoreLocation: true, // Search anywhere in the string
});

export const searchFoodItems = (searchTerm: string): FoodItem[] => {
  if (!searchTerm.trim() || searchTerm.length < 2) {
    return [];
  }
  
  const results = fuse.search(searchTerm);
  
  // Get unique items with best scores
  const uniqueItems = new Map<string, { item: FoodItem; score: number }>();
  
  results.forEach(result => {
    const item = result.item.originalItem;
    const currentBest = uniqueItems.get(item.name);
    
    if (!currentBest || (result.score && result.score < currentBest.score)) {
      uniqueItems.set(item.name, {
        item,
        score: result.score || 1
      });
    }
  });
  
  return Array.from(uniqueItems.values())
    .sort((a, b) => (a.score || 1) - (b.score || 1))
    .slice(0, 8)
    .map(({ item }) => item);
};

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
  };
};