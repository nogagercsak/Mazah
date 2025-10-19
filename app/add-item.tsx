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
          <IconSymbol name={"chevron.left" as any} size={28} color={proto.accentDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Food</Text>
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
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Add from Favorites */}
          {user && (
            <View style={styles.favoritesWrapper}>
              <FavoritesFoodsSection
                userId={user.id}
                onSelectFavorite={handleSelectFavorite}
              />
            </View>
          )}

          <View style={styles.form}>
            {/* Name Input with Inline Suggestions */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>What are you adding?</Text>
              <View style={styles.inputContainer}>
                <IconSymbol name="fork.knife" size={20} color={proto.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Milk, Chicken, Apples"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={proto.textSecondary}
                  returnKeyType="next"
                  autoFocus={false}
                />
                {name.trim().length > 0 && (
                  <TouchableOpacity onPress={handleToggleFavorite} disabled={checkingFavorite}>
                    {checkingFavorite ? (
                      <ActivityIndicator size="small" color={proto.accent} />
                    ) : (
                      <IconSymbol
                        name={isFavorited ? "star.fill" : "star"}
                        size={22}
                        color={isFavorited ? "#FFD700" : proto.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <ExpirationSuggestions
                searchTerm={name}
                onSuggestionSelect={handleSuggestionSelect}
              />
            </View>

            {/* Quantity Input - Simplified */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>How much?</Text>
              <View style={styles.inputContainer}>
                <IconSymbol name="bag" size={20} color={proto.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 1 carton, 2 lbs, 500g"
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholderTextColor={proto.textSecondary}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Storage Location - More Visual */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Where will you store it?</Text>
              {renderStorageSelector()}
            </View>

            {/* Expiration Date - Simplified */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>When does it expire?</Text>
              {renderDatePicker()}
            </View>

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
                <>
                  <IconSymbol name="plus" size={20} color={proto.buttonText} />
                  <Text style={styles.saveButtonText}>Add to Inventory</Text>
                </>
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
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: proto.background,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: proto.accentDark,
    letterSpacing: 0.3,
  },
  favoritesWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: proto.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 17,
    color: proto.text,
  },
  datePickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: proto.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 13,
    fontWeight: '700',
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
    gap: 10,
  },
  storageOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: proto.border,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  storageOptionSelected: {
    borderColor: proto.accent,
    backgroundColor: proto.accent,
    borderWidth: 2.5,
    shadowColor: proto.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  storageIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginBottom: 10,
  },
  storageIconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  storageOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: proto.accentDark,
    textTransform: 'capitalize',
  },
  storageOptionTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: proto.accent,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
    shadowColor: proto.accent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: proto.buttonText,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});