import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Types
export type FoodBankType = 'food_bank' | 'food_pantry' | 'soup_kitchen' | 'mobile_food_bank' | 'community_fridge' | 'other';

export type FoodBank = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  hours?: string;
  distance: number;
  acceptedItems?: string[];
  specialNotes?: string;
  type: FoodBankType;
  isOpen?: boolean;
  lastUpdated?: string;
  email?: string;
  requirements?: string[];
  languages?: string[];
  accessibility?: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  source: 'osm' | '211' | 'usda' | 'manual';
};

// Configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const SEARCH_RADIUS_MILES = 30; // 30 mile radius

// Food Bank Type detection
const determineFoodBankType = (tags: any): FoodBankType => {
  const name = tags?.name?.toLowerCase() || '';
  const description = tags?.description?.toLowerCase() || '';
  const socialFacility = tags?.social_facility?.toLowerCase() || '';
  
  if (name.includes('soup kitchen') || description.includes('soup kitchen')) {
    return 'soup_kitchen';
  }
  if (name.includes('mobile') || description.includes('mobile')) {
    return 'mobile_food_bank';
  }
  if (name.includes('community fridge') || name.includes('little free pantry')) {
    return 'community_fridge';
  }
  if (name.includes('food pantry') || description.includes('pantry') || socialFacility.includes('pantry')) {
    return 'food_pantry';
  }
  if (name.includes('food bank') || socialFacility === 'food_bank') {
    return 'food_bank';
  }
  
  return 'other';
};

// Parse accepted items from various sources
const parseAcceptedItems = (tags: any): string[] => {
  const items: string[] = [];
  
  if (tags?.['social_facility:for']) {
    items.push(tags['social_facility:for']);
  }
  if (tags?.accepted_food_types) {
    items.push(...tags.accepted_food_types.split(',').map((item: string) => item.trim()));
  }
  if (tags?.description) {
    const desc = tags.description.toLowerCase();
    if (desc.includes('non-perishable')) items.push('Non-perishable foods');
    if (desc.includes('fresh produce')) items.push('Fresh produce');
    if (desc.includes('dairy')) items.push('Dairy products');
    if (desc.includes('meat')) items.push('Meat');
    if (desc.includes('clothing')) items.push('Clothing');
    if (desc.includes('hygiene')) items.push('Hygiene products');
  }
  
  return [...new Set(items)]; // Remove duplicates
};

// Data validation and formatting functions
const formatPhoneNumber = (phone: string | undefined): string | undefined => {
  if (!phone) return undefined;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // US phone number should have 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    // Remove leading 1 for US numbers
    const usDigits = digits.slice(1);
    return `(${usDigits.slice(0, 3)}) ${usDigits.slice(3, 6)}-${usDigits.slice(6)}`;
  }
  
  // Return original if doesn't match US format
  return phone;
};

const formatWebsite = (website: string | undefined): string | undefined => {
  if (!website) return undefined;
  
  const url = website.trim().toLowerCase();
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${website.trim()}`;
  }
  
  return website.trim();
};

const validateEmail = (email: string | undefined): string | undefined => {
  if (!email) return undefined;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) ? email.trim() : undefined;
};

const parseLanguages = (languageString: string | undefined): string[] => {
  if (!languageString) return [];
  
  return languageString
    .split(/[,;|]/)
    .map(lang => lang.trim())
    .filter(lang => lang.length > 0)
    .map(lang => {
      // Standardize common language names
      const normalized = lang.toLowerCase();
      if (normalized.includes('span')) return 'Spanish';
      if (normalized.includes('fren')) return 'French';
      if (normalized.includes('chin')) return 'Chinese';
      if (normalized.includes('arab')) return 'Arabic';
      if (normalized.includes('viet')) return 'Vietnamese';
      if (normalized.includes('kore')) return 'Korean';
      if (normalized.includes('port')) return 'Portuguese';
      if (normalized.includes('russ')) return 'Russian';
      if (normalized.includes('germ')) return 'German';
      if (normalized.includes('ital')) return 'Italian';
      if (normalized.includes('japa')) return 'Japanese';
      if (normalized.includes('hindi')) return 'Hindi';
      
      // Capitalize first letter
      return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
    });
};

// Parse requirements from description
const parseRequirements = (tags: any): string[] => {
  const requirements: string[] = [];
  const desc = tags?.description?.toLowerCase() || '';
  const notes = tags?.note?.toLowerCase() || '';
  const combined = `${desc} ${notes}`;
  
  if (combined.includes('id required') || combined.includes('identification')) {
    requirements.push('Valid ID required');
  }
  if (combined.includes('proof of income') || combined.includes('income verification')) {
    requirements.push('Proof of income');
  }
  if (combined.includes('residency') || combined.includes('resident')) {
    requirements.push('Local residency proof');
  }
  if (combined.includes('referral')) {
    requirements.push('Referral required');
  }
  if (combined.includes('appointment') || combined.includes('call ahead')) {
    requirements.push('Appointment required');
  }
  
  return requirements;
};

// Main search function with multiple input types
export const searchFoodBanks = async (
  input: string, 
  searchType: 'zip' | 'location' | 'city' = 'zip'
): Promise<FoodBank[]> => {
  const cacheKey = `foodbanks_${searchType}_${input}`;
  const cached = await getCachedData(cacheKey);
  if (cached) {
    if (__DEV__) console.log('Returning cached food banks');
    return cached;
  }

  try {
    if (__DEV__) console.log(`Searching for food banks using ${searchType}:`, input);
    
    let userLocation: { lat: number; lng: number };
    
    if (searchType === 'location') {
      // Input is already coordinates in format "lat,lng"
      const [lat, lng] = input.split(',').map(parseFloat);
      userLocation = { lat, lng };
    } else {
      userLocation = await getUserLocation(input, searchType);
    }
    
    // Search multiple sources in parallel
    const [osmResults, twoOneOneResults] = await Promise.allSettled([
      searchOpenStreetMap(input, userLocation),
      search211Database(userLocation)
    ]);

    let allFoodBanks: FoodBank[] = [];
    
    // Add OSM results
    if (osmResults.status === 'fulfilled') {
      allFoodBanks.push(...osmResults.value);
    } else if (__DEV__) {
      if (__DEV__) console.warn('OSM search failed:', osmResults.reason);
    }
    
    // Add 211 results
    if (twoOneOneResults.status === 'fulfilled') {
      allFoodBanks.push(...twoOneOneResults.value);
    } else if (__DEV__) {
      if (__DEV__) console.warn('211 search failed:', twoOneOneResults.reason);
    }

    // Remove duplicates based on proximity and name similarity
    const uniqueFoodBanks = removeDuplicates(allFoodBanks);
    
    // Calculate distances for all food banks
    const foodBanksWithDistance = uniqueFoodBanks.map(fb => ({
      ...fb,
      distance: calculateDistance(userLocation, fb.coordinates),
    }));

    // Filter by distance and sort
    const nearbyFoodBanks = foodBanksWithDistance
      .filter(fb => fb.distance <= SEARCH_RADIUS_MILES)
      .sort((a, b) => a.distance - b.distance);
   
    await setCachedData(cacheKey, nearbyFoodBanks);
    return nearbyFoodBanks;
  } catch (error) {
    if (__DEV__) console.error('Food bank search failed:', error);
    throw new Error('Unable to find food banks. Please check your connection and try again.');
  }
};

// Get user's current GPS location
export const getCurrentLocation = async (): Promise<{ lat: number; lng: number }> => {
  try {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (error) {
    if (__DEV__) console.error('GPS location error:', error);
    throw new Error('Unable to get your current location');
  }
};

// Search 211.org database (using their public API)
const search211Database = async (userLocation: { lat: number; lng: number }): Promise<FoodBank[]> => {
  try {
    // Note: This is a simplified implementation. In production, you'd need to register for 211 API access
    // For now, we'll return empty array until real API integration is implemented
    return [];
  } catch (error) {
    if (__DEV__) console.error('211 API error:', error);
    return [];
  }
};

// Remove duplicate food banks based on proximity and name similarity
const removeDuplicates = (foodBanks: FoodBank[]): FoodBank[] => {
  const unique: FoodBank[] = [];
  const DUPLICATE_DISTANCE_THRESHOLD = 0.1; // 0.1 miles
  
  for (const foodBank of foodBanks) {
    const isDuplicate = unique.some(existing => {
      const distance = calculateDistance(foodBank.coordinates, existing.coordinates);
      const nameSimilarity = calculateStringSimilarity(
        foodBank.name.toLowerCase(),
        existing.name.toLowerCase()
      );
      
      return distance < DUPLICATE_DISTANCE_THRESHOLD && nameSimilarity > 0.7;
    });
    
    if (!isDuplicate) {
      unique.push(foodBank);
    }
  }
  
  return unique;
};

// Calculate string similarity (simple implementation)
const calculateStringSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

// Levenshtein distance calculation
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

const searchOpenStreetMap = async (
  zipCode: string,
  userLocation: { lat: number; lng: number }
): Promise<FoodBank[]> => {
  try {
    const { lat, lng } = userLocation;

    const overpassQuery = `
      [out:json];
      (
        node["social_facility"="food_bank"](around:48280,${lat},${lng});
        way["social_facility"="food_bank"](around:48280,${lat},${lng});
        node["amenity"="social_facility"]["social_facility:for"="food"](around:48280,${lat},${lng});
        node["name"~"food bank|food pantry",i](around:48280,${lat},${lng});
        node["shop"="charity"](around:48280,${lat},${lng});
        way["shop"="charity"](around:48280,${lat},${lng});
      );
      out body;
    `;

    const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    if (!overpassResponse.ok) {
      throw new Error('OpenStreetMap API error');
    }

    const overpassData = await overpassResponse.json();
    if (__DEV__) console.log('Overpass query result:', overpassData);
    if (__DEV__) console.log('Elements found:', overpassData.elements?.length || 0);
    if (overpassData.elements) {
      overpassData.elements.forEach((el: { tags: { name: any; shop: any; social_facility: any; }; lat: any; lon: any; }, i: any) => {
        if (__DEV__) console.log(`Element ${i}:`, {
          name: el.tags?.name,
          shop: el.tags?.shop,
          social_facility: el.tags?.social_facility,
          coords: {lat: el.lat, lng: el.lon}
        });
      });
    }

    if (!overpassData.elements || overpassData.elements.length === 0) {
      throw new Error('No food banks found in this area');
    }

    // Filter out elements without valid coordinates and add better filtering
    const validElements = overpassData.elements.filter((element: { lat: any; lon: any; center: { lat: any; lon: any; }; tags: { [x: string]: string; name: string; shop: string; description: string; }; }) => {
      // Must have valid coordinates
      const hasValidCoords = (element.lat && element.lon) || (element.center?.lat && element.center?.lon);
      if (!hasValidCoords) {
        if (__DEV__) console.log('Filtering out element without coordinates:', element.tags?.name);
        return false;
      }

      // Filter out charity shops unless they specifically mention food
      if (element.tags?.shop === 'charity') {
        const name = element.tags?.name?.toLowerCase() || '';
        const description = element.tags?.description?.toLowerCase() || '';
        const hasFood = name.includes('food') || 
                       description.includes('food') || 
                       element.tags?.['social_facility:for'] === 'food';
        
        if (!hasFood) {
          if (__DEV__) console.log('Filtering out non-food charity shop:', element.tags?.name);
          return false;
        }
      }

      return true;
    });

    return validElements.map((element: any) => ({
      id: element.id.toString(),
      name: element.tags?.name || 'Food Bank',
      address: formatOSMAddress(element.tags),
      phone: formatPhoneNumber(element.tags?.phone || element.tags?.['contact:phone']),
      website: formatWebsite(element.tags?.website || element.tags?.['contact:website']),
      email: validateEmail(element.tags?.email || element.tags?.['contact:email']),
      hours: element.tags?.opening_hours,
      distance: 0,
      type: determineFoodBankType(element.tags),
      acceptedItems: parseAcceptedItems(element.tags),
      requirements: parseRequirements(element.tags),
      specialNotes: element.tags?.description || element.tags?.note,
      languages: parseLanguages(element.tags?.['service:languages']),
      accessibility: element.tags?.wheelchair === 'yes' ? ['Wheelchair accessible'] : undefined,
      lastUpdated: new Date().toISOString(),
      source: 'osm' as const,
      coordinates: {
        lat: element.lat || element.center?.lat,
        lng: element.lon || element.center?.lon,
      },
    }));
  } catch (error) {
    if (__DEV__) console.error('OpenStreetMap error:', error);
    throw new Error('Failed to search OpenStreetMap. Please try again.');
  }
};


const getUserLocation = async (
  input: string, 
  searchType: 'zip' | 'city' = 'zip'
): Promise<{ lat: number; lng: number }> => {
  try {
    let searchQuery: string;
    
    if (searchType === 'zip') {
      searchQuery = `postalcode=${input}&country=US&format=json&limit=1`;
    } else {
      // For city search, search for city names
      searchQuery = `city=${encodeURIComponent(input)}&country=US&format=json&limit=1`;
    }
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${searchQuery}`,
      {
        headers: {
          'User-Agent': 'FoodBankLocator/1.0',
        },
      }
    );

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    if (__DEV__) console.error('Geocoding error:', error);
  }

  // If geocoding fails, throw error
  const errorMessage = searchType === 'zip' 
    ? 'Unable to determine location from ZIP code' 
    : 'Unable to find that city';
  throw new Error(errorMessage);
};

const calculateDistance = (
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number => {
  const R = 3959; // Earth's radius in miles
  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;
  const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const formatOSMAddress = (tags: any): string => {
  if (!tags) return 'Address not available';
  const parts = [];

  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:state']) parts.push(tags['addr:state']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);

  const address = parts.join(' ');
  return address || tags.address || 'Address not available';
};

// Check if food bank is currently open
export const isCurrentlyOpen = (hours: string | undefined): boolean => {
  if (!hours) return false;
  
  try {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
    
    // Simple parsing for common formats like "Mo-Fr 09:00-17:00"
    const hoursLower = hours.toLowerCase();
    
    // Check for 24/7
    if (hoursLower.includes('24/7') || hoursLower.includes('always open')) {
      return true;
    }
    
    // Check for closed
    if (hoursLower.includes('closed') || hoursLower.includes('by appointment')) {
      return false;
    }
    
    // Basic day matching (this is simplified - a full implementation would use a proper library)
    const dayNames = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    const currentDayName = dayNames[currentDay];
    
    if (hoursLower.includes(currentDayName)) {
      // Try to extract time ranges
      const timeMatch = hoursLower.match(/(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?/);
      if (timeMatch) {
        const openHour = parseInt(timeMatch[1]);
        const openMin = parseInt(timeMatch[2] || '0');
        const closeHour = parseInt(timeMatch[3]);
        const closeMin = parseInt(timeMatch[4] || '0');
        
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;
        
        return currentTime >= openTime && currentTime <= closeTime;
      }
    }
    
    return false; // Default to closed if we can't parse
  } catch (error) {
    if (__DEV__) console.error('Error parsing hours:', error);
    return false;
  }
};

// Add filtering functionality
export const filterFoodBanks = (
  foodBanks: FoodBank[],
  filters: {
    type?: FoodBankType[];
    openNow?: boolean;
    hasPhone?: boolean;
    hasWebsite?: boolean;
    acceptsSpecificItems?: string[];
    maxDistance?: number;
  }
): FoodBank[] => {
  return foodBanks.filter(fb => {
    // Filter by type
    if (filters.type && filters.type.length > 0 && !filters.type.includes(fb.type)) {
      return false;
    }
    
    // Filter by open status
    if (filters.openNow && !isCurrentlyOpen(fb.hours)) {
      return false;
    }
    
    // Filter by contact info
    if (filters.hasPhone && !fb.phone) {
      return false;
    }
    
    if (filters.hasWebsite && !fb.website) {
      return false;
    }
    
    // Filter by accepted items
    if (filters.acceptsSpecificItems && filters.acceptsSpecificItems.length > 0) {
      const fbItems = fb.acceptedItems?.map(item => item.toLowerCase()) || [];
      const hasMatchingItem = filters.acceptsSpecificItems.some(filterItem =>
        fbItems.some(fbItem => fbItem.includes(filterItem.toLowerCase()))
      );
      if (!hasMatchingItem) {
        return false;
      }
    }
    
    // Filter by distance
    if (filters.maxDistance && fb.distance > filters.maxDistance) {
      return false;
    }
    
    return true;
  });
};

// Sort food banks by different criteria
export const sortFoodBanks = (
  foodBanks: FoodBank[],
  sortBy: 'distance' | 'name' | 'type' | 'openStatus'
): FoodBank[] => {
  return [...foodBanks].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return a.distance - b.distance;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'openStatus':
        const aOpen = isCurrentlyOpen(a.hours);
        const bOpen = isCurrentlyOpen(b.hours);
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
        return a.distance - b.distance; // Secondary sort by distance
      default:
        return 0;
    }
  });
};

const getCachedData = async (key: string): Promise<FoodBank[] | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);

    if (Date.now() - timestamp > CACHE_DURATION) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    if (__DEV__) console.error('Cache read error:', error);
    return null;
  }
};

const setCachedData = async (key: string, data: FoodBank[]) => {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    if (__DEV__) console.error('Cache write error:', error);
  }
};

export const clearFoodBankCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const foodBankKeys = keys.filter((key) => key.startsWith('foodbanks_'));
    await AsyncStorage.multiRemove(foodBankKeys);
  } catch (error) {
    if (__DEV__) console.error('Clear cache error:', error);
  }
};