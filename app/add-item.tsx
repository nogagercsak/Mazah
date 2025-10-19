import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, FavoriteFood } from '@/lib/supabase';
import favoriteFoodService from '@/services/favoriteFoodService';
import { FavoritesFoodsSection } from '@/components/FavoritesFoodsSection';
import { checkTableExists } from '@/utils/testFavoritesSetup';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { 
  ActivityIndicator, 
  Alert, 
  Platform, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Modal,
  Pressable,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ExpirationSuggestions } from '@/components/ExpirationSuggestions';
import { useExpirationSuggestions } from '@/hooks/useExpirationSuggestions';

const proto = Colors.proto;
const { width: screenWidth } = Dimensions.get('window');

type StorageLocation = 'fridge' | 'pantry' | 'freezer';

export default function AddItemScreen() {
  const router = useRouter();
  const { storageLocation } = useLocalSearchParams<{ storageLocation?: StorageLocation }>();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState<StorageLocation>(storageLocation || 'pantry');
  const [loading, setLoading] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [isFavorited, setIsFavorited] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(false);
  
  const { calculateExpirationDate } = useExpirationSuggestions();

  const handleSuggestionSelect = (foodName: string, expirationDays: number, storage: string) => {
    setName(foodName);
    setSelectedStorage(storage as StorageLocation);
    
    const newExpirationDate = calculateExpirationDate(expirationDays);
    setExpirationDate(newExpirationDate);
    
    console.log(`Added ${foodName} to ${storage}, expires in ${expirationDays} days`);
  };

  // Check if database is set up on mount
  useEffect(() => {
    const verifySetup = async () => {
      const tableExists = await checkTableExists();
      if (!tableExists && __DEV__) {
        console.warn('⚠️  user_favorite_foods table not found. Please run the database migration.');
        console.warn('See QUICK_SETUP_FAVORITES.md for instructions.');
      }
    };
    verifySetup();
  }, []);

  // Check if the current food name is favorited whenever name changes
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !name.trim()) {
        setIsFavorited(false);
        return;
      }
      
      setCheckingFavorite(true);
      const favorited = await favoriteFoodService.isFoodFavorited(user.id, name.trim());
      setIsFavorited(favorited);
      setCheckingFavorite(false);
    };

    const timer = setTimeout(checkFavoriteStatus, 300); // Debounce
    return () => clearTimeout(timer);
  }, [name, user]);

  const handleToggleFavorite = async () => {
    if (!user || !name.trim()) {
      Alert.alert('Missing Information', 'Please enter a food name first.');
      return;
    }

    try {
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (__DEV__) {
        console.log('========================================');
        console.log('Toggling favorite for:', name.trim());
        console.log('User ID:', user.id);
        console.log('Storage:', selectedStorage);
        console.log('Quantity:', quantity.trim());
        console.log('========================================');
      }
      
      const success = await favoriteFoodService.toggleFavoriteFood({
        userId: user.id,
        foodName: name.trim(),
        storageLocation: selectedStorage,
        defaultQuantity: quantity.trim() || undefined,
      });

      if (success) {
        const newState = !isFavorited;
        setIsFavorited(newState);
        
        // Show success message
        Alert.alert(
          newState ? '⭐ Added to Favorites' : 'Removed from Favorites',
          newState 
            ? `"${name.trim()}" has been added to your favorites for quick access.`
            : `"${name.trim()}" has been removed from your favorites.`,
          [{ text: 'OK' }]
        );
        
        if (__DEV__) console.log('✅ Favorite toggled successfully. New state:', newState);
      } else {
        if (__DEV__) console.log('❌ Failed to toggle favorite');
        Alert.alert(
          'Error', 
          'Failed to update favorite status. Make sure you have run the database migration. See QUICK_SETUP_FAVORITES.md'
        );
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error in handleToggleFavorite:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
      Alert.alert('Error', 'An unexpected error occurred. Check the console for details.');
    }
  };

  const handleSelectFavorite = (favorite: FavoriteFood) => {
    setName(favorite.food_name);
    if (favorite.storage_location) {
      setSelectedStorage(favorite.storage_location as StorageLocation);
    }
    if (favorite.default_quantity) {
      setQuantity(favorite.default_quantity);
    }
  };

  const handleAddItem = async () => {
    if (!name.trim() || !quantity.trim()) {
      Alert.alert('Missing Information', 'Please fill out all fields.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'Please sign in to add items.');
      return;
    }

    setLoading(true);

    try {
      // Extract numeric value from quantity
      const numericQuantity = parseFloat(quantity) || 0;

      const { error: insertError } = await supabase.from('food_items').insert({
        name: name.trim(),
        quantity: quantity.trim(),
        remaining_quantity: numericQuantity,
        expiration_date: expirationDate.toISOString().split('T')[0],
        storage_location: selectedStorage,
        user_id: user.id,
      });

      if (insertError) {
        throw insertError;
      }

      Alert.alert('Success!', 'Your item has been added.');
      router.back();

    } catch (err) {
      if (__DEV__) console.error('Error adding item:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      Alert.alert('Error', `Could not add the item: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getExpirationText = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Expired', color: '#FF4444' };
    if (diffDays === 0) return { text: 'Today', color: '#FF8800' };
    if (diffDays === 1) return { text: 'Tomorrow', color: '#FF8800' };
    if (diffDays <= 7) return { text: `In ${diffDays} days`, color: '#FFA500' };
    return { text: `In ${diffDays} days`, color: proto.textSecondary };
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (selectedDate) {
        setExpirationDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleIOSDateConfirm = () => {
    setExpirationDate(tempDate);
    setShowDatePicker(false);
  };

  const handleIOSDateCancel = () => {
    setTempDate(expirationDate);
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    setTempDate(expirationDate);
    setShowDatePicker(true);
  };

  const renderStorageSelector = () => {
    const locations: { name: StorageLocation, icon: any }[] = [
      { name: 'pantry', icon: 'cabinet' },
      { name: 'fridge', icon: 'thermometer' },
      { name: 'freezer', icon: 'snowflake' },
    ];

    return (
      <View style={styles.storageSelectorContainer}>
        {locations.map((loc) => (
          <TouchableOpacity
            key={loc.name}
            style={[
              styles.storageOption,
              selectedStorage === loc.name && styles.storageOptionSelected,
            ]}
            onPress={() => setSelectedStorage(loc.name)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.storageIconContainer,
              selectedStorage === loc.name && styles.storageIconContainerSelected
            ]}>
              <IconSymbol 
                name={loc.icon} 
                size={24} 
                color={selectedStorage === loc.name ? proto.buttonText : proto.accentDark} 
              />
            </View>
            <Text style={[
              styles.storageOptionText, 
              selectedStorage === loc.name && styles.storageOptionTextSelected
            ]}>
              {loc.name.charAt(0).toUpperCase() + loc.name.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };



  const renderDatePicker = () => {
    const expirationInfo = getExpirationText(expirationDate);
    
    return (
      <>
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={openDatePicker}
          activeOpacity={0.7}
        >
          <View style={styles.datePickerContent}>
            <View style={styles.datePickerLeft}>
              <IconSymbol name="calendar" size={20} color={proto.accent} />
              <Text style={styles.dateText}>
                {expirationDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
            <View style={styles.datePickerRight}>
              <Text style={[styles.expirationText, { color: expirationInfo.color }]}>
                {expirationInfo.text}
              </Text>
              <IconSymbol name="chevron.right" size={16} color={proto.textSecondary} />
            </View>
          </View>
        </TouchableOpacity>

        {Platform.OS === 'ios' ? (
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
          >
            <Pressable 
              style={styles.modalOverlay} 
              onPress={handleIOSDateCancel}
            >
              <View style={styles.datePickerModal}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={handleIOSDateCancel}>
                    <Text style={styles.datePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={handleIOSDateConfirm}>
                    <Text style={styles.datePickerConfirm}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date()}
                    onChange={handleDateChange}
                    style={styles.datePickerIOS}
                    textColor={proto.text}
                    themeVariant="light"
                    locale="en-US"
                  />
                </View>
              </View>
            </Pressable>
          </Modal>
        ) : (
          showDatePicker && (
            <DateTimePicker
              value={expirationDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name={"chevron.left" as any} size={24} color={proto.accentDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Food Item</Text>
        <View style={{ width: 40 }} /> 
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {user ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <FavoritesFoodsSection 
                userId={user.id} 
                onSelectFavorite={handleSelectFavorite}
              />
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Item Name</Text>
                <TouchableOpacity 
                  onPress={handleToggleFavorite}
                  style={[
                    styles.starButton,
                    isFavorited && styles.starButtonActive,
                    !name.trim() && styles.starButtonDisabled
                  ]}
                  disabled={checkingFavorite || !name.trim()}
                  activeOpacity={0.7}
                >
                  {checkingFavorite ? (
                    <ActivityIndicator size="small" color={proto.accent} />
                  ) : (
                    <>
                      <IconSymbol 
                        name={isFavorited ? "star.fill" : "star"} 
                        size={18} 
                        color={
                          !name.trim() 
                            ? proto.textSecondary 
                            : isFavorited 
                              ? "#FFFFFF" 
                              : proto.accent
                        }
                      />
                      <Text style={[
                        styles.starButtonText,
                        isFavorited && styles.starButtonTextActive,
                        !name.trim() && styles.starButtonTextDisabled
                      ]}>
                        {isFavorited ? 'Favorited' : 'Add to Favorites'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
             </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Organic Milk"
                value={name}
                onChangeText={setName}
                placeholderTextColor={proto.textSecondary}
                returnKeyType="next"
              />
            </View>
            {/* Auto-suggestions appear as user types */}
            <ExpirationSuggestions onSuggestionSelect={handleSuggestionSelect} />
            
         </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1 gallon, 2 lbs, 500g"
              value={quantity}
              onChangeText={setQuantity}
              placeholderTextColor={proto.textSecondary}
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expiration Date</Text>
          {renderDatePicker()}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Storage Location</Text>
          {renderStorageSelector()}
        </View>

        {expirationDate && (
          <View style={styles.expirationInfo}>
            <Text style={styles.expirationInfoText}>
              Suggested expiration: {expirationDate.toLocaleDateString()}
            </Text>
            <Text style={styles.storageText}>
              Storage: {selectedStorage}
            </Text>
          </View>   
        )}
        
        <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
              onPress={handleAddItem} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={proto.buttonText} size="small" />
                  <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>Adding...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Add Item to Inventory</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: proto.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: proto.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: proto.accentDark,
    opacity: 0.85,
    letterSpacing: 0.5,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
  },
  starButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: proto.accent,
    backgroundColor: proto.background,
    gap: 6,
  },
  starButtonActive: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
  },
  starButtonDisabled: {
    borderColor: proto.border,
    opacity: 0.5,
  },
  starButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: proto.accent,
  },
  starButtonTextActive: {
    color: '#FFFFFF',
  },
  starButtonTextDisabled: {
    color: proto.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: proto.border,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: proto.text,
  },
  datePickerButton: {
    backgroundColor: proto.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: proto.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  datePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: proto.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  expirationText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: proto.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    width: '100%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: proto.border,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
  },
  datePickerCancel: {
    fontSize: 16,
    color: proto.textSecondary,
  },
  datePickerConfirm: {
    fontSize: 16,
    color: proto.accent,
    fontWeight: '600',
  },
  datePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerIOS: {
    backgroundColor: proto.background,
    width: screenWidth,
    height: 200,
  },
  storageSelectorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  storageOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: proto.border,
    backgroundColor: proto.inputBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  storageOptionSelected: {
    borderColor: 'transparent',
    transform: [{ scale: 1.02 }],
    backgroundColor: proto.accentDark,
  },
  storageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 8,
  },
  storageIconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  storageOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: proto.accentDark,
  },
  storageOptionTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: proto.accent,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 16,
    shadowColor: proto.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: proto.buttonText,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expirationInfo: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  expirationInfoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0066cc',
  },
  storageText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});