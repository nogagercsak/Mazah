import { Alert, Linking } from 'react-native';

// Whitelist of allowed domains for food bank websites
const ALLOWED_FOOD_BANK_DOMAINS = [
  'feedingamerica.org',
  'foodbank.org',
  'foodpantries.org',
  '211.org',
  'dial211.org',
  'usda.gov',
  'fns.usda.gov',
  'benefits.gov',
  'salvationarmy.org',
  'redcross.org',
  'unitedway.org',
  'catholiccharities.org',
  'churchofjesuschrist.org',
  'secondharvest.org',
  'fooddepository.org',
  'gleaners.org',
  'breadforlife.org',
  'foodrescue.org',
  'communityservicescouncil.org',
  'networkofcare.org',
  'findhelp.org'
];

/**
 * Safely opens a food bank website URL with domain restrictions
 * Only allows verified food bank and charity organization domains
 * @param url - The website URL to open
 * @param onRestricted - Optional callback when URL is restricted
 */
export const openFoodBankWebsite = (url: string, onRestricted?: () => void): void => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase().replace('www.', '');
    
    // Check if domain is in our whitelist or is a subdomain of allowed domains
    const isAllowed = ALLOWED_FOOD_BANK_DOMAINS.some(allowedDomain => 
      domain === allowedDomain || domain.endsWith('.' + allowedDomain)
    );
    
    if (isAllowed) {
      Linking.openURL(url);
    } else {
      if (onRestricted) {
        onRestricted();
      } else {
        Alert.alert(
          'Website Unavailable',
          'For your safety, we can only open verified food bank websites. Please contact the food bank directly using their phone number.',
          [{ text: 'OK' }]
        );
      }
    }
  } catch (error) {
    Alert.alert(
      'Invalid Website',
      'The website URL appears to be invalid. Please contact the food bank directly using their phone number.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Checks if a URL is from an allowed food bank domain
 * @param url - The URL to check
 * @returns boolean indicating if the domain is allowed
 */
export const isAllowedFoodBankDomain = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase().replace('www.', '');
    
    return ALLOWED_FOOD_BANK_DOMAINS.some(allowedDomain => 
      domain === allowedDomain || domain.endsWith('.' + allowedDomain)
    );
  } catch {
    return false;
  }
};

/**
 * Gets the list of allowed food bank domains
 * @returns Array of allowed domain strings
 */
export const getAllowedFoodBankDomains = (): string[] => {
  return [...ALLOWED_FOOD_BANK_DOMAINS];
};