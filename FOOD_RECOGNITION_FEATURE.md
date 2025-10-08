# Food Recognition to Recipe Recommendation Feature

## Overview

This feature allows users to take or upload photos of ingredients and receive personalized recipe recommendations using AI-powered food recognition technology.

## Features Implemented

### 1. Image Capture & Upload Module ✅
- **Camera Integration**: Take photos directly from the app using expo-camera
- **Gallery Upload**: Select existing photos from device gallery
- **Image Preprocessing**: Automatic resize to 224x224 and optimization for ML models
- **Format Support**: JPEG, PNG, WebP, HEIF formats
- **Permissions Handling**: Automatic camera and photo library permission management

### 2. Food Recognition Integration ✅
- **Primary API**: Clarifai Food Model API integration
- **Fallback API**: Google Cloud Vision API as backup
- **Confidence Filtering**: 60%+ confidence threshold for ingredient detection
- **Error Handling**: Graceful degradation and user-friendly error messages
- **Caching**: 24-hour cache for recognition results to minimize API calls
- **Rate Limiting**: 100 requests per hour protection

### 3. Recipe Recommendation System ✅
- **Spoonacular Integration**: Enhanced existing Spoonacular API integration
- **Photo-Based Scoring**: Special scoring algorithm for photo-detected ingredients
- **Smart Matching**: Ingredient matching with substitution suggestions
- **Waste Reduction Focus**: Prioritizes recipes that use expiring ingredients
- **Pagination Support**: Handles large result sets efficiently

### 4. User Interface Components ✅

#### Photo Recipe Finder Screen (`/photo-recipe-finder`)
- **Step-by-step flow**: Camera → Processing → Ingredient Confirmation → Recipe Results
- **Progress Indicator**: Visual progress through the 4-step process
- **Ingredient Selection**: Interactive ingredient confirmation with confidence scores
- **Recipe Cards**: Rich recipe display with images, timing, and match percentages

#### Recipe Details Screen (`/recipe-details`)
- **Full Recipe View**: Complete ingredients, instructions, and nutritional info
- **Interactive Features**: Save to favorites, share functionality
- **Responsive Design**: Optimized for mobile and tablet viewing

#### Cook Tab Integration
- **Camera Button**: Quick access to photo recipe finder from Cook tab
- **Seamless Navigation**: Integrated with existing recipe workflow

### 5. Backend API Endpoints ✅

#### POST `/app/api/recognize-ingredients`
- **Input**: Multipart form data with image file
- **Output**: Detected ingredients with confidence scores
- **Validation**: File type, size, and format validation
- **Error Handling**: Comprehensive error responses with helpful messages

#### POST `/app/api/get-recipes`
- **Input**: Ingredient list with optional filters
- **Output**: Personalized recipe recommendations
- **Features**: Pagination, filtering, smart suggestions

#### GET `/app/api/recipe/[id]`
- **Input**: Recipe ID
- **Output**: Complete recipe details with instructions and nutrition
- **Features**: Recipe caching and detailed ingredient information

## Technical Implementation

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Camera/Upload │───▶│ Food Recognition│───▶│ Recipe Matching │
│     Module      │    │     Service     │    │    Service      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Image Picker  │    │ Clarifai/Google │    │   Spoonacular   │
│      Service    │    │   Vision APIs   │    │      API        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Services

#### ImageCaptureService
- Handles camera permissions and image capture
- Provides image validation and preprocessing
- Manages temporary file cleanup

#### FoodRecognitionService
- Integrates multiple AI recognition APIs
- Implements confidence-based filtering
- Provides caching and rate limiting
- Handles API errors gracefully

#### Enhanced RecipeService
- Extended existing service with photo-specific methods
- Smart ingredient matching algorithms
- Waste reduction scoring
- Substitution suggestions

## Configuration

### Environment Variables
```bash
# Food Recognition APIs
EXPO_PUBLIC_CLARIFAI_API_KEY=your_clarifai_api_key_here
EXPO_PUBLIC_CLARIFAI_MODEL_ID=food-item-recognition
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# API Configuration
EXPO_PUBLIC_API_RATE_LIMIT=100
```

### Permissions (iOS)
```xml
<key>NSCameraUsageDescription</key>
<string>Mazah needs camera access to identify ingredients from photos for recipe recommendations.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Mazah needs photo library access to select ingredient photos for recognition.</string>
```

### Permissions (Android)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## Usage Flow

1. **Access Feature**: Tap camera button in Cook tab or navigate to `/photo-recipe-finder`
2. **Capture Image**: Take photo or select from gallery
3. **Processing**: AI analyzes image for food ingredients
4. **Confirm Ingredients**: Review and select detected ingredients
5. **Get Recipes**: Receive personalized recipe recommendations
6. **View Details**: Tap any recipe for full instructions and details

## Error Handling

### User-Friendly Messages
- **No ingredients detected**: Provides helpful tips for better photos
- **API failures**: Graceful fallback between recognition services
- **Network issues**: Clear offline/connectivity messages
- **File issues**: Specific guidance for supported formats

### Technical Error Codes
- `RATE_LIMIT_EXCEEDED`: API rate limiting protection
- `NETWORK_ERROR`: Connectivity issues
- `INVALID_IMAGE_DATA`: File corruption or format issues
- `NO_INGREDIENTS_DETECTED`: No food items found in image

## Performance Optimizations

### Caching Strategy
- **Recognition Cache**: 24-hour cache for processed images
- **Recipe Cache**: Standard Spoonacular API caching
- **Image Optimization**: Automatic resize and compression

### API Optimization
- **Rate Limiting**: Prevents API quota exhaustion
- **Fallback System**: Multiple AI providers for reliability
- **Timeout Handling**: Prevents hanging requests

## Testing

### Test Scenarios
1. **Happy Path**: Photo → Ingredients → Recipes → Details
2. **Edge Cases**: Blurry photos, no ingredients, network failures
3. **Error Recovery**: API failures, permission denials, file errors
4. **Performance**: Large images, slow networks, multiple requests

### Device Compatibility
- **iOS**: 15.1+ with camera and photo library access
- **Android**: API level 21+ with camera permissions
- **Web**: File upload with drag-and-drop support

## Future Enhancements

### Planned Features
- **Offline Recognition**: Local ML model for basic ingredient detection
- **Batch Processing**: Multiple images at once
- **Shopping List Integration**: Auto-generate missing ingredient lists
- **Nutrition Analysis**: Detailed nutritional breakdown of detected ingredients
- **Recipe History**: Save and revisit photo-based recipe discoveries

### API Improvements
- **GPT-4 Vision Fallback**: Third fallback option for complex images
- **Custom Model Training**: Train on user's specific ingredient types
- **Real-time Processing**: Stream processing for video input

## Troubleshooting

### Common Issues

#### "No ingredients detected"
- Ensure image shows food ingredients clearly
- Use better lighting
- Take photo from closer distance
- Try different angle or background

#### "Camera permission denied"
- Go to device Settings → Apps → Mazah → Permissions
- Enable Camera and Photos access
- Restart the app

#### "API rate limit exceeded"
- Wait 1 hour before trying again
- Feature automatically resets rate limits hourly

#### "Recognition taking too long"
- Try with smaller image size
- Check internet connection
- Switch to gallery upload instead of camera

## Dependencies Added

```json
{
  "expo-camera": "^17.0.8",
  "expo-image-picker": "^17.0.8",
  "expo-media-library": "^18.2.0"
}
```

## File Structure

```
app/
├── photo-recipe-finder.tsx          # Main feature screen
├── recipe-details.tsx               # Enhanced recipe details
└── app/api/
    ├── recognize-ingredients+api.ts  # Recognition endpoint
    ├── get-recipes+api.ts           # Recipe search endpoint
    └── recipe/[id]+api.ts           # Recipe details endpoint

services/
├── foodRecognitionService.ts        # AI recognition service
├── imageCaptureService.ts           # Camera/upload service
└── recipeService.ts                 # Enhanced recipe service (existing)
```

## Success Metrics

### Target Performance
- **Recognition Accuracy**: 80%+ for common ingredients
- **Processing Time**: <5 seconds from photo to recipes
- **User Engagement**: 30%+ of users try feature in first week
- **Error Rate**: <5% failed recognitions

### Monitoring
- API usage tracking
- Recognition confidence scores
- User completion rates
- Error frequency and types

## Conclusion

The Food Recognition to Recipe Recommendation feature successfully integrates AI-powered ingredient detection with the existing recipe recommendation system, providing users with a seamless way to discover recipes based on available ingredients. The implementation includes comprehensive error handling, performance optimizations, and a user-friendly interface that guides users through the entire process.