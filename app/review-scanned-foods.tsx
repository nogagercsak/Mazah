import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { extractRecipeFromImage, ExtractedFood, estimateExpirationDays } from '@/services/recipeScanService';
import * as Haptics from 'expo-haptics';

const proto = Colors.proto;

type StorageLocation = 'fridge' | 'pantry' | 'freezer';

interface EditableFoodItem extends ExtractedFood {
  id: string;
  isEditing: boolean;
}

export default function ReviewScannedFoodsScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [foods, setFoods] = useState<EditableFoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<EditableFoodItem | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    loadExtractedFoods();
  }, [imageUri]);

  const loadExtractedFoods = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'No image provided');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const extractedFoods = await extractRecipeFromImage(imageUri);

      // Convert to editable format with unique IDs
      const editableFoods: EditableFoodItem[] = extractedFoods.map((food, index) => ({
        ...food,
        id: `temp-${index}`,
        isEditing: false,
      }));

      setFoods(editableFoods);
    } catch (error) {
      if (__DEV__) console.error('Error loading extracted foods:', error);
      Alert.alert('Error', 'Failed to extract ingredients from the recipe. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEditFood = (food: EditableFoodItem) => {
    setSelectedFood(food);
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = (updatedFood: EditableFoodItem) => {
    setFoods(foods.map(f => f.id === updatedFood.id ? updatedFood : f));
    setIsEditModalVisible(false);
    setSelectedFood(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveFood = (foodId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFoods(foods.filter(f => f.id !== foodId));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const calculateExpirationDate = (daysFromNow: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  };

  const handleConfirmAll = async () => {
    if (foods.length === 0) {
      Alert.alert('No Items', 'There are no items to add to your inventory.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to add items.');
      return;
    }

    setSaving(true);

    try {
      // Prepare items for insertion
      const itemsToInsert = foods.map(food => {
        // Extract numeric value from quantity for remaining_quantity
        const numericMatch = food.quantity.match(/(\d+(?:\.\d+)?)/);
        const numericQuantity = numericMatch ? parseFloat(numericMatch[1]) : 1;

        return {
          name: food.name,
          quantity: food.quantity,
          remaining_quantity: numericQuantity,
          expiration_date: calculateExpirationDate(food.estimatedExpirationDays),
          storage_location: food.suggestedStorage,
          user_id: user.id,
        };
      });

      // Insert all items at once
      const { error } = await supabase
        .from('food_items')
        .insert(itemsToInsert);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Success!',
        `${foods.length} item${foods.length > 1 ? 's' : ''} added to your inventory.`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/'),
          },
        ]
      );
    } catch (error) {
      if (__DEV__) console.error('Error saving foods:', error);
      Alert.alert('Error', 'Failed to add items to inventory. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: ExtractedFood['category']) => {
    switch (category) {
      case 'dairy':
        return 'drop';
      case 'produce':
        return 'leaf';
      case 'meat':
        return 'flame';
      case 'frozen':
        return 'snowflake';
      case 'pantry':
        return 'cabinet';
      default:
        return 'bag';
    }
  };

  const getExpirationColor = (days: number) => {
    if (days <= 3) return '#E57373';
    if (days <= 7) return '#FFB74D';
    return proto.accent;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={proto.accent} />
          <Text style={styles.loadingText}>Scanning recipe...</Text>
          <Text style={styles.loadingSubtext}>Identifying ingredients and estimating expiration dates</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={proto.accentDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Items</Text>
        <View style={{ width: 40 }} />
      </View>

      {imageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        </View>
      )}

      <View style={styles.infoBar}>
        <IconSymbol name="info.circle" size={20} color={proto.accent} />
        <Text style={styles.infoText}>
          Review and edit items below. Tap to modify or remove items.
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.itemsContainer}>
          {foods.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.foodCard}
              onPress={() => handleEditFood(food)}
              activeOpacity={0.7}
            >
              <View style={styles.foodCardLeft}>
                <View style={[styles.categoryIcon, { backgroundColor: `${proto.accent}20` }]}>
                  <IconSymbol name={getCategoryIcon(food.category)} size={24} color={proto.accentDark} />
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodQuantity}>{food.quantity}</Text>
                  <View style={styles.foodMeta}>
                    <View style={styles.storageTag}>
                      <IconSymbol
                        name={food.suggestedStorage === 'fridge' ? 'thermometer' : food.suggestedStorage === 'freezer' ? 'snowflake' : 'cabinet'}
                        size={14}
                        color={proto.textSecondary}
                      />
                      <Text style={styles.storageText}>
                        {food.suggestedStorage.charAt(0).toUpperCase() + food.suggestedStorage.slice(1)}
                      </Text>
                    </View>
                    <View style={[styles.expirationTag, { backgroundColor: `${getExpirationColor(food.estimatedExpirationDays)}20` }]}>
                      <Text style={[styles.expirationText, { color: getExpirationColor(food.estimatedExpirationDays) }]}>
                        ~{food.estimatedExpirationDays} days
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.foodCardRight}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveFood(food.id);
                  }}
                >
                  <IconSymbol name="trash" size={20} color="#E57373" />
                </TouchableOpacity>
                <IconSymbol name="chevron.right" size={20} color={proto.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {foods.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="exclamationmark.triangle" size={48} color={proto.textSecondary} />
            <Text style={styles.emptyStateText}>No items found</Text>
            <Text style={styles.emptyStateSubtext}>Try scanning another recipe</Text>
          </View>
        )}
      </ScrollView>

      {foods.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>{foods.length} item{foods.length > 1 ? 's' : ''} ready to add</Text>
          </View>
          <TouchableOpacity
            style={[styles.confirmButton, saving && styles.confirmButtonDisabled]}
            onPress={handleConfirmAll}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={proto.buttonText} />
            ) : (
              <>
                <IconSymbol name="checkmark" size={24} color={proto.buttonText} />
                <Text style={styles.confirmButtonText}>Add All to Inventory</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {selectedFood && (
        <EditFoodModal
          food={selectedFood}
          visible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setSelectedFood(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </SafeAreaView>
  );
}

interface EditFoodModalProps {
  food: EditableFoodItem;
  visible: boolean;
  onClose: () => void;
  onSave: (food: EditableFoodItem) => void;
}

const EditFoodModal: React.FC<EditFoodModalProps> = ({ food, visible, onClose, onSave }) => {
  const [editedFood, setEditedFood] = useState<EditableFoodItem>(food);

  useEffect(() => {
    setEditedFood(food);
  }, [food]);

  const handleSave = () => {
    onSave(editedFood);
  };

  const storageOptions: StorageLocation[] = ['fridge', 'pantry', 'freezer'];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={proto.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editedFood.name}
                onChangeText={(text) => setEditedFood({ ...editedFood, name: text })}
                placeholder="Item name"
                placeholderTextColor={proto.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={editedFood.quantity}
                onChangeText={(text) => setEditedFood({ ...editedFood, quantity: text })}
                placeholder="e.g., 1 gallon, 2 lbs"
                placeholderTextColor={proto.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Storage Location</Text>
              <View style={styles.storageSelector}>
                {storageOptions.map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.storageOption,
                      editedFood.suggestedStorage === location && styles.storageOptionSelected,
                    ]}
                    onPress={() => setEditedFood({ ...editedFood, suggestedStorage: location })}
                  >
                    <IconSymbol
                      name={location === 'fridge' ? 'thermometer' : location === 'freezer' ? 'snowflake' : 'cabinet'}
                      size={20}
                      color={editedFood.suggestedStorage === location ? proto.buttonText : proto.accentDark}
                    />
                    <Text
                      style={[
                        styles.storageOptionText,
                        editedFood.suggestedStorage === location && styles.storageOptionTextSelected,
                      ]}
                    >
                      {location.charAt(0).toUpperCase() + location.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Estimated Expiration (days)</Text>
              <TextInput
                style={styles.input}
                value={editedFood.estimatedExpirationDays.toString()}
                onChangeText={(text) => {
                  const days = parseInt(text) || 0;
                  setEditedFood({ ...editedFood, estimatedExpirationDays: days });
                }}
                keyboardType="number-pad"
                placeholder="Days until expiration"
                placeholderTextColor={proto.textSecondary}
              />
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: proto.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  imagePreviewContainer: {
    width: '100%',
    height: 150,
    backgroundColor: proto.card,
    borderBottomWidth: 1,
    borderBottomColor: proto.border,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${proto.accent}10`,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${proto.accent}20`,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: proto.textSecondary,
    lineHeight: 18,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  foodCard: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: proto.border,
  },
  foodCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 4,
  },
  foodQuantity: {
    fontSize: 14,
    color: proto.textSecondary,
    marginBottom: 6,
  },
  foodMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: proto.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  storageText: {
    fontSize: 12,
    color: proto.textSecondary,
    fontWeight: '500',
  },
  expirationTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expirationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  foodCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: proto.textSecondary,
    marginTop: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: proto.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: proto.background,
  },
  footerInfo: {
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: proto.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: proto.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: proto.buttonText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: proto.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: proto.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: proto.text,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: proto.card,
    borderWidth: 1,
    borderColor: proto.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: proto.text,
  },
  storageSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  storageOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: proto.border,
    backgroundColor: proto.card,
  },
  storageOptionSelected: {
    backgroundColor: proto.accentDark,
    borderColor: proto.accentDark,
  },
  storageOptionText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: proto.accentDark,
  },
  storageOptionTextSelected: {
    color: proto.buttonText,
  },
  saveButton: {
    backgroundColor: proto.accent,
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: proto.buttonText,
  },
});
