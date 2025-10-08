import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecognizedIngredient {
  name: string;
  confidence: number;
  category?: string;
}

export interface RecognitionResult {
  ingredients: RecognizedIngredient[];
  processingTime: number;
  imageSize: {
    width: number;
    height: number;
  };
}

export interface RecognitionError {
  code: string;
  message: string;
  details?: any;
}

interface CacheEntry {
  result: RecognitionResult;
  timestamp: number;
  imageHash: string;
}

export class FoodRecognitionService {
  private clarifaiApiKey: string;
  private clarifaiModelId: string;
  private googleVisionApiKey: string;
  private confidenceThreshold: number = 0.6;
  private cacheExpiry: number = 24 * 60 * 60 * 1000; // 24 hours
  private rateLimitKey: string = 'foodRecognition_rateLimit';
  private maxRequestsPerHour: number = 100;

  constructor() {
    this.clarifaiApiKey = process.env.EXPO_PUBLIC_CLARIFAI_API_KEY || '';
    this.clarifaiModelId = process.env.EXPO_PUBLIC_CLARIFAI_MODEL_ID || 'food-item-recognition';
    this.googleVisionApiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';
  }

  async recognizeIngredients(imageUri: string): Promise<RecognitionResult> {
    try {
      // Check rate limit
      await this.checkRateLimit();

      // Check cache first
      const cachedResult = await this.getCachedResult(imageUri);
      if (cachedResult) {
        return cachedResult;
      }

      let result: RecognitionResult | null = null;

      // Try Clarifai first (primary API)
      if (this.clarifaiApiKey && this.clarifaiApiKey !== 'your_clarifai_api_key_here') {
        try {
          result = await this.recognizeWithClarifai(imageUri);
        } catch (error) {
          console.warn('Clarifai recognition failed, trying fallback:', error);
        }
      }

      // Fallback to Google Vision if Clarifai fails
      if (!result && this.googleVisionApiKey && this.googleVisionApiKey !== 'your_google_vision_api_key_here') {
        try {
          result = await this.recognizeWithGoogleVision(imageUri);
        } catch (error) {
          console.warn('Google Vision recognition failed:', error);
        }
      }

      if (!result) {
        throw new Error('All recognition services failed');
      }

      // Cache the result
      await this.cacheResult(imageUri, result);

      // Update rate limit
      await this.updateRateLimit();

      return result;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  private async recognizeWithClarifai(imageUri: string): Promise<RecognitionResult> {
    const startTime = Date.now();

    // Convert image to base64
    const base64Image = await this.imageToBase64(imageUri);
    const imageSize = await this.getImageSize(imageUri);

    const response = await fetch('https://api.clarifai.com/v2/models/food-item-recognition/outputs', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.clarifaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [{
          data: {
            image: {
              base64: base64Image
            }
          }
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Clarifai API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.outputs || data.outputs.length === 0) {
      throw new Error('No recognition results from Clarifai');
    }

    const concepts = data.outputs[0].data?.concepts || [];
    const ingredients: RecognizedIngredient[] = concepts
      .filter((concept: any) => concept.value >= this.confidenceThreshold)
      .map((concept: any) => ({
        name: this.cleanIngredientName(concept.name),
        confidence: Math.round(concept.value * 100),
        category: this.categorizeIngredient(concept.name)
      }))
      .slice(0, 10); // Limit to top 10 results

    return {
      ingredients,
      processingTime: Date.now() - startTime,
      imageSize
    };
  }

  private async recognizeWithGoogleVision(imageUri: string): Promise<RecognitionResult> {
    const startTime = Date.now();

    // Convert image to base64
    const base64Image = await this.imageToBase64(imageUri);
    const imageSize = await this.getImageSize(imageUri);

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.googleVisionApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 20
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.responses || data.responses.length === 0) {
      throw new Error('No recognition results from Google Vision');
    }

    const labels = data.responses[0].labelAnnotations || [];
    const objects = data.responses[0].localizedObjectAnnotations || [];

    // Combine labels and objects, focusing on food-related items
    const allDetections = [
      ...labels.map((label: any) => ({
        name: label.description,
        confidence: Math.round(label.score * 100)
      })),
      ...objects.map((obj: any) => ({
        name: obj.name,
        confidence: Math.round(obj.score * 100)
      }))
    ];

    // Filter for food-related items and remove duplicates
    const foodKeywords = ['food', 'fruit', 'vegetable', 'meat', 'dairy', 'grain', 'spice', 'herb', 'ingredient'];
    const ingredients: RecognizedIngredient[] = allDetections
      .filter((item: any) => {
        const name = item.name.toLowerCase();
        return item.confidence >= this.confidenceThreshold * 100 &&
               (foodKeywords.some(keyword => name.includes(keyword)) ||
                this.isFoodItem(name));
      })
      .map((item: any) => ({
        name: this.cleanIngredientName(item.name),
        confidence: item.confidence,
        category: this.categorizeIngredient(item.name)
      }))
      .reduce((unique: RecognizedIngredient[], current: RecognizedIngredient) => {
        // Remove duplicates based on cleaned name
        if (!unique.find(item => item.name.toLowerCase() === current.name.toLowerCase())) {
          unique.push(current);
        }
        return unique;
      }, [])
      .slice(0, 10); // Limit to top 10 results

    return {
      ingredients,
      processingTime: Date.now() - startTime,
      imageSize
    };
  }

  private async imageToBase64(imageUri: string): Promise<string> {
    try {
      // For React Native, we can use fetch to get the blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Convert blob to base64 (simplified for React Native)
      // In a production app, you would use a proper base64 conversion library
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to convert image to base64: ${error}`);
    }
  }

  private async getImageSize(imageUri: string): Promise<{ width: number; height: number }> {
    // Simplified implementation - return default size for React Native
    return { width: 224, height: 224 };
  }

  private cleanIngredientName(name: string): string {
    // Remove common prefixes/suffixes and clean up the name
    return name
      .toLowerCase()
      .replace(/^(fresh|organic|raw|cooked|dried|frozen)\s+/g, '')
      .replace(/\s+(food|ingredient|item)$/g, '')
      .replace(/[^\w\s]/g, '')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private categorizeIngredient(name: string): string {
    const lowerName = name.toLowerCase();

    const categories = {
      'fruits': ['apple', 'banana', 'orange', 'berry', 'grape', 'lemon', 'lime', 'peach', 'pear'],
      'vegetables': ['carrot', 'broccoli', 'spinach', 'tomato', 'onion', 'pepper', 'lettuce', 'potato'],
      'proteins': ['chicken', 'beef', 'pork', 'fish', 'egg', 'tofu', 'beans', 'meat'],
      'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      'grains': ['rice', 'bread', 'pasta', 'wheat', 'oats', 'quinoa'],
      'herbs': ['basil', 'parsley', 'cilantro', 'oregano', 'thyme', 'rosemary']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }

    return 'other';
  }

  private isFoodItem(name: string): boolean {
    const commonFoodItems = [
      'apple', 'banana', 'carrot', 'broccoli', 'chicken', 'beef', 'rice', 'bread',
      'cheese', 'milk', 'egg', 'tomato', 'onion', 'garlic', 'potato', 'pasta',
      'lettuce', 'spinach', 'pepper', 'mushroom', 'avocado', 'lemon', 'lime'
    ];

    return commonFoodItems.some(food => name.includes(food));
  }

  private async getCachedResult(imageUri: string): Promise<RecognitionResult | null> {
    try {
      const imageHash = await this.generateImageHash(imageUri);
      const cacheKey = `foodRecognition_${imageHash}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (cachedData) {
        const cache: CacheEntry = JSON.parse(cachedData);
        if (Date.now() - cache.timestamp < this.cacheExpiry) {
          return cache.result;
        } else {
          // Remove expired cache
          await AsyncStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      // Cache miss or error, continue without cache
      console.warn('Cache retrieval failed:', error);
    }

    return null;
  }

  private async cacheResult(imageUri: string, result: RecognitionResult): Promise<void> {
    try {
      const imageHash = await this.generateImageHash(imageUri);
      const cacheKey = `foodRecognition_${imageHash}`;
      const cacheEntry: CacheEntry = {
        result,
        timestamp: Date.now(),
        imageHash
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      // Cache write failed, but don't throw error
      console.warn('Failed to cache result:', error);
    }
  }

  private async generateImageHash(imageUri: string): Promise<string> {
    // Simple hash based on URI and file size
    try {
      const response = await fetch(imageUri, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length') || '0';
      return btoa(imageUri + contentLength).slice(0, 16);
    } catch {
      return btoa(imageUri).slice(0, 16);
    }
  }

  private async checkRateLimit(): Promise<void> {
    try {
      const rateLimitData = await AsyncStorage.getItem(this.rateLimitKey);
      if (rateLimitData) {
        const { count, timestamp } = JSON.parse(rateLimitData);
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        if (timestamp > oneHourAgo && count >= this.maxRequestsPerHour) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limit')) {
        throw error;
      }
      // Storage error, allow request to continue
    }
  }

  private async updateRateLimit(): Promise<void> {
    try {
      const rateLimitData = await AsyncStorage.getItem(this.rateLimitKey);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);

      let count = 1;
      if (rateLimitData) {
        const parsed = JSON.parse(rateLimitData);
        if (parsed.timestamp > oneHourAgo) {
          count = parsed.count + 1;
        }
      }

      await AsyncStorage.setItem(this.rateLimitKey, JSON.stringify({
        count,
        timestamp: Date.now()
      }));
    } catch (error) {
      // Storage error, but don't throw
      console.warn('Failed to update rate limit:', error);
    }
  }

  private formatError(error: any): RecognitionError {
    if (error instanceof Error) {
      if (error.message.includes('Rate limit')) {
        return {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: error.message
        };
      } else if (error.message.includes('API error')) {
        return {
          code: 'API_ERROR',
          message: 'Food recognition service is temporarily unavailable.',
          details: error.message
        };
      } else if (error.message.includes('network')) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network connection error. Please check your internet connection.',
          details: error.message
        };
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred during food recognition.',
      details: error?.message || 'Unknown error'
    };
  }

  // Utility method to preprocess image for better recognition
  async preprocessImage(imageUri: string): Promise<string> {
    // For now, return the original URI
    // In the future, we could add image preprocessing like:
    // - Resize to 224x224
    // - Normalize pixel values
    // - Apply filters for better recognition
    return imageUri;
  }

  // Method to clear cache
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const foodRecognitionKeys = keys.filter(key => key.startsWith('foodRecognition_'));
      await AsyncStorage.multiRemove(foodRecognitionKeys);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
}

// Singleton instance
export const foodRecognitionService = new FoodRecognitionService();