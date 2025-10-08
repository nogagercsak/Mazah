import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { foodRecognitionService, RecognitionResult, RecognitionError } from '@/services/foodRecognitionService';

export async function POST(request: ExpoRequest): Promise<ExpoResponse> {
  const startTime = Date.now();

  try {
    // Validate request method
    if (request.method !== 'POST') {
      return ExpoResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return ExpoResponse.json(
        {
          error: 'Invalid content type. Expected multipart/form-data.',
          code: 'INVALID_CONTENT_TYPE'
        },
        { status: 400 }
      );
    }

    // Parse the multipart form data with timeout
    let formData: FormData;
    try {
      const parseTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      formData = await Promise.race([
        request.formData(),
        parseTimeout
      ]);
    } catch (error) {
      return ExpoResponse.json(
        {
          error: 'Failed to parse form data or request timeout',
          code: 'PARSE_ERROR'
        },
        { status: 400 }
      );
    }

    const imageFile = formData.get('image') as File;

    // Validate image file presence
    if (!imageFile) {
      return ExpoResponse.json(
        {
          error: 'No image file provided. Please include an image in the "image" field.',
          code: 'MISSING_IMAGE'
        },
        { status: 400 }
      );
    }

    // Validate file is actually a File object
    if (!(imageFile instanceof File)) {
      return ExpoResponse.json(
        {
          error: 'Invalid image format. Please provide a valid image file.',
          code: 'INVALID_FILE_FORMAT'
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heif', 'image/heic'];
    if (!allowedTypes.includes(imageFile.type.toLowerCase())) {
      return ExpoResponse.json(
        {
          error: `Unsupported image format: ${imageFile.type}. Supported formats: JPEG, PNG, WebP, HEIF.`,
          code: 'UNSUPPORTED_FORMAT',
          supportedFormats: allowedTypes
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      return ExpoResponse.json(
        {
          error: `File too large: ${(imageFile.size / (1024 * 1024)).toFixed(2)}MB. Maximum size is 5MB.`,
          code: 'FILE_TOO_LARGE',
          maxSize: '5MB',
          actualSize: `${(imageFile.size / (1024 * 1024)).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    // Validate minimum file size (1KB)
    const minSize = 1024; // 1KB
    if (imageFile.size < minSize) {
      return ExpoResponse.json(
        {
          error: 'File too small. Minimum size is 1KB.',
          code: 'FILE_TOO_SMALL'
        },
        { status: 400 }
      );
    }

    // Convert File to data URL for processing
    let arrayBuffer: ArrayBuffer;
    let base64: string;
    let dataUrl: string;

    try {
      arrayBuffer = await imageFile.arrayBuffer();

      // For React Native environment, use different base64 conversion
      if (typeof Buffer !== 'undefined') {
        base64 = Buffer.from(arrayBuffer).toString('base64');
      } else {
        // Fallback for environments without Buffer
        const uint8Array = new Uint8Array(arrayBuffer);
        base64 = btoa(String.fromCharCode(...uint8Array));
      }

      dataUrl = `data:${imageFile.type};base64,${base64}`;
    } catch (error) {
      console.error('File conversion error:', error);
      return ExpoResponse.json(
        {
          error: 'Failed to process image file. The file may be corrupted.',
          code: 'FILE_PROCESSING_ERROR'
        },
        { status: 400 }
      );
    }

    // Validate base64 data
    if (!base64 || base64.length === 0) {
      return ExpoResponse.json(
        {
          error: 'Invalid image data. The file may be corrupted.',
          code: 'INVALID_IMAGE_DATA'
        },
        { status: 400 }
      );
    }

    // Recognize ingredients with timeout
    let result: RecognitionResult;
    try {
      const recognitionTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Recognition timeout')), 60000)
      );

      result = await Promise.race([
        foodRecognitionService.recognizeIngredients(dataUrl),
        recognitionTimeout
      ]);
    } catch (error) {
      console.error('Recognition timeout or error:', error);
      if (error instanceof Error && error.message === 'Recognition timeout') {
        return ExpoResponse.json(
          {
            error: 'Image recognition took too long. Please try with a smaller image.',
            code: 'RECOGNITION_TIMEOUT'
          },
          { status: 408 }
        );
      }
      throw error; // Re-throw to be handled by outer catch
    }

    // Validate recognition results
    if (!result || !result.ingredients) {
      return ExpoResponse.json(
        {
          error: 'Recognition service returned invalid results.',
          code: 'INVALID_RECOGNITION_RESULT'
        },
        { status: 502 }
      );
    }

    // Filter and validate ingredients
    const validIngredients = result.ingredients.filter(ingredient =>
      ingredient &&
      ingredient.name &&
      typeof ingredient.name === 'string' &&
      ingredient.name.trim().length > 0 &&
      typeof ingredient.confidence === 'number' &&
      ingredient.confidence >= 0 &&
      ingredient.confidence <= 100
    );

    // Check if any valid ingredients were found
    if (validIngredients.length === 0) {
      return ExpoResponse.json(
        {
          error: 'No ingredients could be identified in this image. Please try with a clearer photo that shows food ingredients.',
          code: 'NO_INGREDIENTS_DETECTED',
          suggestions: [
            'Ensure the image shows food ingredients clearly',
            'Use better lighting when taking the photo',
            'Try taking the photo from a closer distance',
            'Make sure ingredients are visible and not obscured'
          ]
        },
        { status: 422 }
      );
    }

    const processingTime = Date.now() - startTime;

    // Return successful response with additional metadata
    return ExpoResponse.json({
      success: true,
      ingredients: validIngredients,
      confidence: validIngredients.map(ing => ing.confidence),
      metadata: {
        processingTime: processingTime,
        imageSize: result.imageSize,
        totalIngredients: validIngredients.length,
        originalImageSize: imageFile.size,
        imageType: imageFile.type,
        recognitionModel: 'clarifai-food-v1',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('Ingredient recognition error:', {
      error: error.message,
      stack: error.stack,
      processingTime,
      timestamp: new Date().toISOString()
    });

    // Handle recognition service errors
    if (error.code) {
      const recognitionError = error as RecognitionError;
      return ExpoResponse.json(
        {
          error: recognitionError.message,
          code: recognitionError.code,
          details: recognitionError.details,
          processingTime,
          timestamp: new Date().toISOString()
        },
        { status: getStatusCodeFromError(recognitionError.code) }
      );
    }

    // Handle specific error types
    if (error.message?.includes('timeout')) {
      return ExpoResponse.json(
        {
          error: 'Request timeout. Please try again with a smaller image.',
          code: 'REQUEST_TIMEOUT',
          processingTime,
          timestamp: new Date().toISOString()
        },
        { status: 408 }
      );
    }

    if (error.message?.includes('network')) {
      return ExpoResponse.json(
        {
          error: 'Network error occurred while processing the image.',
          code: 'NETWORK_ERROR',
          processingTime,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Handle general errors
    return ExpoResponse.json(
      {
        error: 'An unexpected error occurred while processing the image. Please try again.',
        code: 'PROCESSING_ERROR',
        processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function getStatusCodeFromError(errorCode: string): number {
  switch (errorCode) {
    case 'RATE_LIMIT_EXCEEDED':
      return 429;
    case 'NETWORK_ERROR':
      return 503;
    case 'API_ERROR':
      return 502;
    default:
      return 500;
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