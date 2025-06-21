import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, GestureResponderEvent, Animated, Modal, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';

import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { FoodItem, InventoryData, supabase } from '@/lib/supabase';

const getFormattedDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Use the proto color scheme
const proto = Colors.proto;

const getExpirationColor = (daysLeft: number) => {
  if (daysLeft < 0) return '#E57373'; // Expired - soft red
  if (daysLeft <= 3) return '#E6A23C'; // Expiring soon - orange
  if (daysLeft <= 7) return '#E6D23C'; // Expiring this week - yellow
  return proto.accent; // Good - green
};

const getExpirationText = (daysLeft: number) => {
  if (daysLeft < 0) return 'Expired';
  if (daysLeft === 0) return 'Expires today';
  if (daysLeft === 1) return 'Expires tomorrow';
  return `Expires in ${daysLeft} days`;
};

type EmptySectionProps = {
  title: string;
  icon: IconSymbolName;
  location: 'fridge' | 'pantry' | 'freezer';
  onAdd: (location: 'fridge' | 'pantry' | 'freezer') => void;
};

const EmptySectionContent = ({ icon, message, onAdd }: { 
  icon: IconSymbolName; 
  message: string; 
  onAdd: () => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Start the pulse animation
    const pulseAnimation = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]);

    Animated.loop(pulseAnimation).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <Animated.View 
      style={[
        styles.emptySectionContent,
        { opacity: fadeAnim }
      ]}
    >
      <IconSymbol size={24} name={icon} color={proto.textSecondary} />
      <Text style={styles.emptySectionText}>{message}</Text>
      <TouchableOpacity 
        style={styles.quickAddButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAdd();
        }}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <IconSymbol size={20} name="plus" color={proto.accent} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const MainEmptyState = ({ onAdd }: { onAdd: () => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View 
      style={[
        styles.centerContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <IconSymbol size={48} name="hand.raised" color={proto.textSecondary} />
      <Text style={styles.emptyTitle}>Welcome to Your Food Inventory!</Text>
      <Text style={styles.emptyText}>
        Track what you have, reduce waste, and never forget about expiring food again. Tap the + button to add your first item!
      </Text>
      <TouchableOpacity 
        style={styles.addFirstItemButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAdd();
        }}
      >
        <Text style={styles.addFirstItemButtonText}>Get Started</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

type ItemDetailsModalProps = {
  item: FoodItem;
  visible: boolean;
  onClose: () => void;
  onSave: (updatedItem: FoodItem) => void;
  onDelete: (itemId: string) => void;
};

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  visible,
  onClose,
  onSave,
  onDelete
}) => {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [daysUntilExpiration, setDaysUntilExpiration] = useState(item.daysLeft || 0);
  const [location, setLocation] = useState<'fridge' | 'pantry' | 'freezer'>(item.storage_location);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(item.name);
      setQuantity(item.quantity);
      setDaysUntilExpiration(item.daysLeft || 0);
      setLocation(item.storage_location);
      setIsEditing(false);
    }
  }, [visible, item]);

  const handleSave = () => {
    onSave({
      ...item,
      name,
      quantity,
      storage_location: location,
      expiration_date: getFormattedDate(daysUntilExpiration)
    });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDelete(item.id);
            onClose();
          }
        }
      ]
    );
  };

  const locations: { name: 'fridge' | 'pantry' | 'freezer'; icon: IconSymbolName }[] = [
    { name: 'fridge', icon: 'thermometer' },
    { name: 'pantry', icon: 'cabinet' },
    { name: 'freezer', icon: 'snowflake' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Item' : 'Item Details'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol size={24} name="trash" color={proto.textSecondary} />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Item name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Quantity"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Expiration</Text>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderValue}>
                    {getExpirationText(daysUntilExpiration)}
                  </Text>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={-7}
                    maximumValue={180}
                    step={1}
                    value={daysUntilExpiration}
                    onValueChange={setDaysUntilExpiration}
                    minimumTrackTintColor={proto.accent}
                    maximumTrackTintColor={proto.textSecondary}
                    thumbTintColor={proto.accentDark}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.locationSelector}>
                  {locations.map((loc) => (
                    <TouchableOpacity
                      key={loc.name}
                      style={[
                        styles.locationOption,
                        location === loc.name && styles.locationOptionSelected
                      ]}
                      onPress={() => setLocation(loc.name)}
                    >
                      <IconSymbol
                        name={loc.icon}
                        size={24}
                        color={location === loc.name ? proto.buttonText : proto.accentDark}
                      />
                      <Text
                        style={[
                          styles.locationOptionText,
                          location === loc.name && styles.locationOptionTextSelected
                        ]}
                      >
                        {loc.name.charAt(0).toUpperCase() + loc.name.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.detailsView}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{item.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValue}>{item.quantity}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expiration</Text>
                <Text 
                  style={[
                    styles.detailValue,
                    { color: getExpirationColor(item.daysLeft || 0) }
                  ]}
                >
                  {getExpirationText(item.daysLeft || 0)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location</Text>
                <View style={styles.locationBadge}>
                  <IconSymbol
                    name={locations.find(l => l.name === item.storage_location)?.icon || 'cabinet'}
                    size={16}
                    color={proto.accentDark}
                  />
                  <Text style={styles.locationText}>
                    {item.storage_location.charAt(0).toUpperCase() + item.storage_location.slice(1)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editButtonText}>Edit Item</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default function InventoryScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [inventory, setInventory] = useState<InventoryData>({
    fridge: [],
    pantry: [],
    freezer: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Debug: Log current user state
  console.log('InventoryScreen: Current user:', user ? user.email : 'No user');

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchInventory();
      }
    }, [user])
  );

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all food items for the current user
      const { data, error: fetchError } = await supabase
        .from('food_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('expiration_date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Transform the data to match the expected format
      const transformedData: InventoryData = {
        fridge: [],
        pantry: [],
        freezer: []
      };

      data?.forEach((item: FoodItem) => {
        const daysLeft = calculateDaysLeft(item.expiration_date);
        const itemWithDaysLeft = { ...item, daysLeft };
        
        switch (item.storage_location) {
          case 'fridge':
            transformedData.fridge.push(itemWithDaysLeft);
            break;
          case 'pantry':
            transformedData.pantry.push(itemWithDaysLeft);
            break;
          case 'freezer':
            transformedData.freezer.push(itemWithDaysLeft);
            break;
        }
      });

      setInventory(transformedData);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysLeft = (expirationDate: string): number => {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSignOut = async () => {
    console.log('Sign out button pressed');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            console.log('Starting sign out process...');
            try {
              await signOut();
              console.log('Sign out completed successfully');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Sign Out Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      // Refresh the inventory
      fetchInventory();
    } catch (err) {
      console.error('Error deleting item:', err);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    }
  };

  const handleMarkAsUsed = async (itemId: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      // Show confirmation
      Alert.alert('Success', 'Item marked as used!');
      
      // Refresh the inventory
      fetchInventory();
    } catch (err) {
      console.error('Error marking item as used:', err);
      Alert.alert('Error', 'Failed to mark item as used. Please try again.');
    }
  };

  const handleUpdateItem = async (updatedItem: FoodItem) => {
    try {
      const { error } = await supabase
        .from('food_items')
        .update({
          name: updatedItem.name,
          quantity: updatedItem.quantity,
          expiration_date: updatedItem.expiration_date,
          storage_location: updatedItem.storage_location,
        })
        .eq('id', updatedItem.id);

      if (error) throw error;
      
      fetchInventory();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Error updating item:', err);
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  const renderRightActions = (itemId: string) => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: proto.accent }]}
          onPress={() => handleMarkAsUsed(itemId)}
        >
          <IconSymbol size={24} name="checkmark" color={proto.buttonText} />
          <Text style={styles.actionText}>Used</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#E57373' }]}
          onPress={() => {
            Alert.alert(
              'Delete Item',
              'Are you sure you want to delete this item?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(itemId) }
              ]
            );
          }}
        >
          <IconSymbol size={24} name="trash" color={proto.buttonText} />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = (item: FoodItem) => (
    <Swipeable
      key={item.id}
      renderRightActions={() => renderRightActions(item.id)}
      overshootRight={false}
    >
      <TouchableOpacity 
        style={styles.itemCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedItem(item);
          setIsModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.quantity}>{item.quantity}</Text>
        </View>
        <View style={styles.expirationInfo}>
          <Text style={[styles.expirationText, { color: getExpirationColor(item.daysLeft || 0) }]}> 
            {getExpirationText(item.daysLeft || 0)}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  const getEmptyMessage = (location: 'fridge' | 'pantry' | 'freezer') => {
    switch (location) {
      case 'fridge':
        return "Your fridge is looking empty! Add fresh ingredients, dairy products, or leftovers.";
      case 'pantry':
        return "Stock up your pantry! Add dry goods, canned items, or snacks.";
      case 'freezer':
        return "Nothing in your freezer yet! Add frozen meals, meats, or meal prep items.";
      default:
        return "Add some items to get started!";
    }
  };

  const renderStorageSection = (title: string, items: FoodItem[], icon: IconSymbolName) => {
    const location = title.toLowerCase() as 'fridge' | 'pantry' | 'freezer';
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol size={22} name={icon} color={proto.buttonText} />
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.itemCount}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
        </View>
        {items.length === 0 ? (
          <View style={styles.emptySection}>
            <EmptySectionContent
              icon={icon}
              message={getEmptyMessage(location)}
              onAdd={() => router.push({
                pathname: '/add-item',
                params: { storageLocation: location }
              })}
            />
          </View>
        ) : (
          items.map(renderItem)
        )}
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={proto.accent} />
      <Text style={styles.loadingText}>Loading your inventory...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContainer}>
      <IconSymbol size={48} name="lightbulb" color="#E57373" />
      <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchInventory}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <MainEmptyState onAdd={() => router.push('/add-item')} />
  );

  const hasAnyItems = inventory.fridge.length > 0 || inventory.pantry.length > 0 || inventory.freezer.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Inventory</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => router.push('/add-item')}
          >
            <IconSymbol size={28} name={"plus" as any} color={proto.buttonText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <IconSymbol size={24} name={"person" as any} color={proto.accentDark} />
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : !hasAnyItems ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderStorageSection('Fridge', inventory.fridge, 'thermometer')}
          {renderStorageSection('Pantry', inventory.pantry, 'cabinet')}
          {renderStorageSection('Freezer', inventory.freezer, 'snowflake')}
        </ScrollView>
      )}
      
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          visible={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setSelectedItem(null);
          }}
          onSave={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: proto.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: proto.background,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: proto.accentDark,
    opacity: 0.85,
    letterSpacing: 0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    backgroundColor: proto.accent,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: proto.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: proto.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: proto.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
    color: proto.text,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 24,
    fontSize: 16,
    color: proto.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
    marginHorizontal: 25,
    borderRadius: 20,
    backgroundColor: proto.card,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.accentDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    color: proto.buttonText,
    fontWeight: '700',
    fontSize: 20,
    marginLeft: 10,
    flex: 1,
    letterSpacing: 0.2,
  },
  itemCount: {
    color: proto.buttonText,
    fontSize: 14,
    opacity: 0.7,
  },
  itemCard: {
    backgroundColor: proto.background,
    borderRadius: 18,
    marginHorizontal: 10,
    marginVertical: 6,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 2,
  },
  quantity: {
    fontSize: 14,
    color: proto.textSecondary,
  },
  expirationInfo: {
    alignItems: 'flex-end',
  },
  expirationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    padding: 8,
  },
  emptySection: {
    paddingVertical: 24,
    opacity: 0.8,
  },
  emptySectionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  emptySectionText: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 14,
    color: proto.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: proto.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: proto.accent,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    marginRight: 10,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 18,
    marginLeft: 8,
  },
  actionText: {
    color: proto.buttonText,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  addFirstItemButton: {
    backgroundColor: proto.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addFirstItemButtonText: {
    color: proto.buttonText,
    fontWeight: '600',
    fontSize: 18,
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
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: proto.text,
  },
  closeButton: {
    padding: 8,
  },
  editForm: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
  },
  input: {
    backgroundColor: proto.card,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    color: proto.text,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 14,
    color: proto.textSecondary,
    marginBottom: 8,
  },
  locationSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  locationOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: proto.card,
    borderWidth: 1,
    borderColor: proto.textSecondary,
  },
  locationOptionSelected: {
    backgroundColor: proto.accentDark,
    borderColor: proto.accentDark,
  },
  locationOptionText: {
    marginTop: 4,
    fontSize: 12,
    color: proto.accentDark,
    fontWeight: '600',
  },
  locationOptionTextSelected: {
    color: proto.buttonText,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#E57373',
  },
  deleteButtonText: {
    color: proto.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: proto.accent,
  },
  saveButtonText: {
    color: proto.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
  detailsView: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: proto.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: proto.accentDark,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: proto.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: proto.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
});
