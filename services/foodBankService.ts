import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';


// Types
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
 coordinates: {
   lat: number;
   lng: number;
 };
};


// Configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours


// Main search function
export const searchFoodBanks = async (zipCode: string): Promise<FoodBank[]> => {
 const cacheKey = `foodbanks_${zipCode}`;
 const cached = await getCachedData(cacheKey);
 if (cached) {
   console.log('Returning cached food banks');
   return cached;
 }


 try {
   console.log('Searching for food banks near:', zipCode);
   const userLocation = await getUserLocation(zipCode);
   const foodBanks = await searchOpenStreetMap(zipCode, userLocation);
  
   // Calculate distances for all food banks
   const foodBanksWithDistance = foodBanks.map(fb => ({
     ...fb,
     distance: calculateDistance(userLocation, fb.coordinates),
   }));


   // Sort by distance
   const sortedResults = foodBanksWithDistance.sort((a, b) => a.distance - b.distance);
  
   await setCachedData(cacheKey, sortedResults);
   return sortedResults;
 } catch (error) {
   console.error('Food bank search failed:', error);
   throw new Error('Unable to find food banks. Please check your connection and try again.');
 }
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
       node["social_facility"="food_bank"](around:16000,${lat},${lng});
       way["social_facility"="food_bank"](around:16000,${lat},${lng});
       node["amenity"="social_facility"]["social_facility:for"="food"](around:16000,${lat},${lng});
       node["name"~"food bank|food pantry",i](around:16000,${lat},${lng});
       node["shop"="charity"](around:16000,${lat},${lng});
       way["shop"="charity"](around:16000,${lat},${lng});
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


   if (!overpassData.elements || overpassData.elements.length === 0) {
     throw new Error('No food banks found in this area');
   }


   return overpassData.elements.map((element: any) => ({
     id: element.id.toString(),
     name: element.tags?.name || 'Food Bank',
     address: formatOSMAddress(element.tags),
     phone: element.tags?.phone || element.tags?.['contact:phone'],
     website: element.tags?.website || element.tags?.['contact:website'],
     hours: element.tags?.opening_hours,
     distance: 0, // Will be calculated later
     acceptedItems: element.tags?.['social_facility:for'] ? [element.tags['social_facility:for']] : undefined,
     specialNotes: element.tags?.description || element.tags?.note,
     coordinates: {
       lat: element.lat || element.center?.lat || lat,
       lng: element.lon || element.center?.lon || lng,
     },
   }));
 } catch (error) {
   console.error('OpenStreetMap error:', error);
   throw new Error('Failed to search OpenStreetMap. Please try again.');
 }
};


const getUserLocation = async (zipCode: string): Promise<{ lat: number; lng: number }> => {
 try {
  //  const { status } = await Location.requestForegroundPermissionsAsync();

   if (status === 'granted') {
     const location = await Location.getCurrentPositionAsync({});
     return {
       lat: location.coords.latitude,
       lng: location.coords.longitude,
     };
   }
 } catch (error) {
   console.log('Could not get user location, using ZIP code geocoding');
 }


 // Fallback to ZIP code geocoding
 try {
   const response = await fetch(
     `https://nominatim.openstreetmap.org/search?` +
       `postalcode=${zipCode}&country=US&format=json&limit=1`,
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
   console.error('Geocoding error:', error);
 }


 // Last resort: default to NYC coordinates
 throw new Error('Unable to determine location from ZIP code');
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
   console.error('Cache read error:', error);
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
   console.error('Cache write error:', error);
 }
};


export const clearFoodBankCache = async () => {
 try {
   const keys = await AsyncStorage.getAllKeys();
   const foodBankKeys = keys.filter((key) => key.startsWith('foodbanks_'));
   await AsyncStorage.multiRemove(foodBankKeys);
 } catch (error) {
   console.error('Clear cache error:', error);
 }
};
