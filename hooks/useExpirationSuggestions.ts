import { useState, useMemo } from 'react';
import { FOOD_EXPIRATION_DATA, getExpirationSuggestion } from '@/constants/food-expiration';

export interface ExpirationSuggestion {
  foodName: string;
  fridgeDays: number;
  freezerDays: number;
  pantryDays: number;
  category: string;
}

export const useExpirationSuggestions = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const suggestions = useMemo((): ExpirationSuggestion[] => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return FOOD_EXPIRATION_DATA
      .filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      )
      .slice(0, 5) // Limit to 5 suggestions
      .map(item => ({
        foodName: item.name,
        fridgeDays: item.fridgeDays,
        freezerDays: item.freezerDays,
        pantryDays: item.pantryDays,
        category: item.category
      }));
  }, [searchTerm]);

  const calculateExpirationDate = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  return {
    searchTerm,
    setSearchTerm,
    suggestions,
    calculateExpirationDate,
    getExpirationSuggestion
  };
};