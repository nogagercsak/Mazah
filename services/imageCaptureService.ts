import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

export interface ImageCaptureOptions {
  source: 'camera' | 'gallery';
  quality?: number;
  allowsEditing?: boolean;
  maxDimensions?: {
    width: number;
    height: number;
  };
}

export interface CapturedImage {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  type: string;
  base64?: string;
}

export interface CaptureError {
  code: string;
  message: string;
  details?: any;
}

export class ImageCaptureService {
  private maxFileSize: number = 5 * 1024 * 1024; // 5MB
  private defaultQuality: number = 0.8;
  private targetDimensions = { width: 224, height: 224 }; // Optimized for ML models

  async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permissions
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();

      // Request media library permissions
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Mazah needs camera access to take photos of your ingredients for recipe recommendations.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => this.openSettings() }
          ]
        );
        return false;
      }

      if (mediaStatus.status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Mazah needs photo library access to select ingredient photos for recognition.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => this.openSettings() }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async captureImage(options: ImageCaptureOptions): Promise<CapturedImage> {
    try {
      // Check permissions first
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Camera permissions not granted');
      }

      let result: ImagePicker.ImagePickerResult;

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        quality: options.quality ?? this.defaultQuality,
        base64: false, // We'll handle compression separately
        exif: false,
      };

      if (options.source === 'camera') {
        result = await ImagePicker.launchCameraAsync(pickerOptions);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        throw new Error('Image capture cancelled');
      }

      const asset = result.assets[0];

      // Validate image
      await this.validateImage(asset);

      // Process and optimize image
      const processedImage = await this.processImage(asset, options);

      return processedImage;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  private async validateImage(asset: ImagePicker.ImagePickerAsset): Promise<void> {
    // Check file size
    if (asset.fileSize && asset.fileSize > this.maxFileSize) {
      throw new Error(`Image file too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Basic file existence check (simplified for this implementation)

    // Validate image dimensions
    if (asset.width < 100 || asset.height < 100) {
      throw new Error('Image resolution too low. Please use a higher quality image.');
    }
  }

  private async processImage(
    asset: ImagePicker.ImagePickerAsset,
    options: ImageCaptureOptions
  ): Promise<CapturedImage> {
    try {
      let processedUri = asset.uri;
      let finalWidth = asset.width;
      let finalHeight = asset.height;

      // Resize image if needed
      const maxDimensions = options.maxDimensions || this.targetDimensions;
      if (asset.width > maxDimensions.width || asset.height > maxDimensions.height) {
        const resizedImage = await this.resizeImage(asset.uri, maxDimensions);
        processedUri = resizedImage.uri;
        finalWidth = resizedImage.width;
        finalHeight = resizedImage.height;
      }

      // Get file size of processed image (simplified)
      const fileSize = asset.fileSize || 0;

      return {
        uri: processedUri,
        width: finalWidth,
        height: finalHeight,
        fileSize,
        type: asset.type || 'image'
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error}`);
    }
  }

  private async resizeImage(
    uri: string,
    dimensions: { width: number; height: number }
  ): Promise<{ uri: string; width: number; height: number }> {
    try {
      // For this implementation, we'll return the original image with target dimensions
      // In a production app, you would use a proper image processing library
      return {
        uri,
        width: dimensions.width,
        height: dimensions.height
      };
    } catch (error) {
      console.warn('Image resize failed, using original:', error);
      return {
        uri,
        width: dimensions.width,
        height: dimensions.height
      };
    }
  }

  async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    // For this implementation, return the original URI
    // In a production app, you would implement proper compression
    return uri;
  }

  async saveToMediaLibrary(uri: string): Promise<string> {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Media library permission not granted');
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      return asset.uri;
    } catch (error) {
      throw new Error(`Failed to save image: ${error}`);
    }
  }

  async deleteTemporaryFile(uri: string): Promise<void> {
    // Simplified implementation - in production you would handle file cleanup
    console.log('Would delete temporary file:', uri);
  }

  async cleanupCache(): Promise<void> {
    // Simplified implementation - in production you would handle cache cleanup
    console.log('Would cleanup cache');
  }

  private openSettings(): void {
    if (Platform.OS === 'ios') {
      // iOS settings URL
      ImagePicker.requestCameraPermissionsAsync();
    } else {
      // Android - you might want to use a library like react-native-android-open-settings
      Alert.alert('Settings', 'Please enable camera permissions in your device settings.');
    }
  }

  private formatError(error: any): CaptureError {
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        return {
          code: 'PERMISSION_DENIED',
          message: 'Camera or photo library permission required.',
          details: error.message
        };
      } else if (error.message.includes('cancelled')) {
        return {
          code: 'USER_CANCELLED',
          message: 'Image capture was cancelled.',
          details: error.message
        };
      } else if (error.message.includes('too large')) {
        return {
          code: 'FILE_TOO_LARGE',
          message: 'Image file is too large.',
          details: error.message
        };
      } else if (error.message.includes('resolution')) {
        return {
          code: 'RESOLUTION_TOO_LOW',
          message: 'Image quality is too low for recognition.',
          details: error.message
        };
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred during image capture.',
      details: error?.message || 'Unknown error'
    };
  }

  // Utility method to get image metadata
  async getImageMetadata(uri: string): Promise<{
    width: number;
    height: number;
    fileSize: number;
    type: string;
  }> {
    // Simplified implementation - in production you would get actual metadata
    return {
      width: 224,
      height: 224,
      fileSize: 1024 * 1024, // 1MB default
      type: 'image'
    };
  }
}

// Singleton instance
export const imageCaptureService = new ImageCaptureService();