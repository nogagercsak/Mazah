import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { FoodItem, InventoryData, supabase } from '@/lib/supabase';

// Use the proto color scheme
const proto = Colors.proto;

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

  const addNewItem = () => {
    router.push('/add-item');
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

  const renderStorageSection = (title: string, items: any[], icon: IconSymbolName) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <IconSymbol size={22} name={icon} color={proto.buttonText} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>
      {items.map((item) => (
        <View key={item.id} style={styles.itemCard}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.quantity}>{item.quantity}</Text>
          </View>
          <View style={styles.expirationInfo}>
            <Text style={[styles.expirationText, { color: getExpirationColor(item.daysLeft) }]}> 
              {getExpirationText(item.daysLeft)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

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
    <View style={styles.centerContainer}>
      <IconSymbol size={48} name="hand.raised" color={proto.textSecondary} />
      <Text style={styles.emptyTitle}>No food items yet</Text>
      <Text style={styles.emptyText}>Start by adding some food to your inventory!</Text>
      <TouchableOpacity style={styles.addFirstItemButton} onPress={addNewItem}>
        <Text style={styles.addFirstItemButtonText}>Add Your First Item</Text>
      </TouchableOpacity>
    </View>
  );

  const hasAnyItems = inventory.fridge.length > 0 || inventory.pantry.length > 0 || inventory.freezer.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Inventory</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.addButton} onPress={addNewItem}>
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
    shadowOpacity: 1,
    shadowRadius: 8,
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
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstItemButton: {
    backgroundColor: proto.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstItemButtonText: {
    color: proto.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    marginBottom: 28,
    marginHorizontal: 12,
    borderRadius: 20,
    backgroundColor: proto.card,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
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
    shadowOpacity: 1,
    shadowRadius: 4,
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
});
