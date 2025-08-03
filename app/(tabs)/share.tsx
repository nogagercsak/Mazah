import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  TextInput,
  Animated,
  Linking,
  Modal,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';

// Use the proto color scheme to match your existing app
const proto = Colors.proto;

type FoodBank = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  hours?: string;
  distance: number;
  acceptedItems?: string[];
  specialNotes?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

type FoodBankDetailsModalProps = {
  foodBank: FoodBank;
  visible: boolean;
  onClose: () => void;
};

const FoodBankDetailsModal: React.FC<FoodBankDetailsModalProps> = ({
  foodBank,
  visible,
  onClose
}) => {
  const handleGetDirections = () => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(foodBank.address)}`;
    Linking.openURL(url);
  };

  const handleCall = () => {
    if (foodBank.phone) {
      const phoneUrl = `tel:${foodBank.phone.replace(/[^\d]/g, '')}`;
      Linking.openURL(phoneUrl);
    }
  };

  const handleWebsite = () => {
    if (foodBank.website) {
      Linking.openURL(foodBank.website);
    }
  };

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
            <Text style={styles.modalTitle} numberOfLines={2}>
              {foodBank.name}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={24} color={proto.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color={proto.accentDark} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{foodBank.address}</Text>
                <Text style={styles.distanceText}>{foodBank.distance.toFixed(1)} miles away</Text>
              </View>
            </View>

            {foodBank.phone && (
              <View style={styles.detailRow}>
                <Ionicons name="call" size={20} color={proto.accentDark} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{foodBank.phone}</Text>
                </View>
              </View>
            )}

            {foodBank.hours && (
              <View style={styles.detailRow}>
                <Ionicons name="time" size={20} color={proto.accentDark} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Hours</Text>
                  <Text style={styles.detailValue}>{foodBank.hours}</Text>
                </View>
              </View>
            )}

            {foodBank.acceptedItems && foodBank.acceptedItems.length > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="list" size={20} color={proto.accentDark} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Accepted Items</Text>
                  <Text style={styles.detailValue}>
                    {foodBank.acceptedItems.join(', ')}
                  </Text>
                </View>
              </View>
            )}

            {foodBank.specialNotes && (
              <View style={styles.detailRow}>
                <Ionicons name="information-circle" size={20} color={proto.accentDark} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Special Notes</Text>
                  <Text style={styles.detailValue}>{foodBank.specialNotes}</Text>
                </View>
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.directionsButton]}
                onPress={handleGetDirections}
              >
                <Ionicons name="location" size={20} color={proto.buttonText} />
                <Text style={styles.actionButtonText}>Directions</Text>
              </TouchableOpacity>

              {foodBank.phone && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.callButton]}
                  onPress={handleCall}
                >
                  <Ionicons name="call" size={20} color={proto.buttonText} />
                  <Text style={styles.actionButtonText}>Call</Text>
                </TouchableOpacity>
              )}

              {foodBank.website && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.websiteButton]}
                  onPress={handleWebsite}
                >
                  <Ionicons name="globe" size={20} color={proto.buttonText} />
                  <Text style={styles.actionButtonText}>Website</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const EmptySearchState = ({ onSearch }: { onSearch: () => void }) => {
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
      <Ionicons name="heart" size={48} color={proto.textSecondary} />
      <Text style={styles.emptyTitle}>Find Local Food Banks</Text>
      <Text style={styles.emptyText}>
        Enter your ZIP code to discover nearby food banks where you can donate surplus food and help your community.
      </Text>
      <TouchableOpacity 
        style={styles.getStartedButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSearch();
        }}
      >
        <Text style={styles.getStartedButtonText}>Enter ZIP Code Above</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function FoodBankLocatorScreen() {
  const router = useRouter();
  const [zipCode, setZipCode] = useState('');
  const [foodBanks, setFoodBanks] = useState<FoodBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFoodBank, setSelectedFoodBank] = useState<FoodBank | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  // Mock data for demonstration - replace with actual API call
  const mockFoodBanks: FoodBank[] = [
    {
      id: '1',
      name: 'Community Food Bank of NYC',
      address: '123 Main St, New York, NY 10001',
      phone: '(212) 555-0123',
      website: 'https://example.com',
      hours: 'Mon-Fri: 9AM-5PM, Sat: 10AM-2PM',
      distance: 2.3,
      acceptedItems: ['Canned goods', 'Fresh produce', 'Non-perishables'],
      specialNotes: 'Please call ahead for large donations',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    {
      id: '2',
      name: 'Hope Food Pantry',
      address: '456 Oak Ave, New York, NY 10002',
      phone: '(212) 555-0456',
      hours: 'Tue-Thu: 10AM-4PM',
      distance: 4.7,
      acceptedItems: ['Canned goods', 'Dry goods'],
      coordinates: { lat: 40.7228, lng: -73.9960 }
    },
    {
      id: '3',
      name: 'Neighborhood Helping Hands',
      address: '789 Pine St, New York, NY 10003',
      phone: '(212) 555-0789',
      website: 'https://example.org',
      hours: 'Mon-Wed-Fri: 9AM-3PM',
      distance: 6.2,
      acceptedItems: ['Fresh produce', 'Dairy products', 'Baked goods'],
      specialNotes: 'Accepts fresh donations until 2 hours before closing',
      coordinates: { lat: 40.7328, lng: -73.9860 }
    }
  ];

  const validateZipCode = (zip: string): boolean => {
    const zipRegex = /^\d{5}$/;
    return zipRegex.test(zip);
  };

  const handleSearch = async () => {
    if (!validateZipCode(zipCode)) {
      Alert.alert('Invalid ZIP Code', 'Please enter a valid 5-digit ZIP code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, you'd call your API here:
      // const response = await fetch(`/api/food-banks?zipCode=${zipCode}`);
      // const data = await response.json();
      
      // For now, use mock data
      setFoodBanks(mockFoodBanks);
      
    } catch (err) {
      console.error('Error searching food banks:', err);
      setError('Failed to find food banks. Please try again.');
      setFoodBanks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFoodBankPress = (foodBank: FoodBank) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFoodBank(foodBank);
    setIsModalVisible(true);
  };

  const renderFoodBankCard = (foodBank: FoodBank) => (
    <TouchableOpacity
      key={foodBank.id}
      style={styles.foodBankCard}
      onPress={() => handleFoodBankPress(foodBank)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.foodBankName} numberOfLines={2}>
            {foodBank.name}
          </Text>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{foodBank.distance.toFixed(1)} mi</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={16} color={proto.textSecondary} />
          <Text style={styles.addressText} numberOfLines={2}>
            {foodBank.address}
          </Text>
        </View>

        {foodBank.hours && (
          <View style={styles.hoursRow}>
            <Ionicons name="time" size={16} color={proto.textSecondary} />
            <Text style={styles.hoursText}>{foodBank.hours}</Text>
          </View>
        )}

        {foodBank.acceptedItems && (
          <View style={styles.itemsRow}>
            <Ionicons name="list" size={16} color={proto.textSecondary} />
            <Text style={styles.itemsText} numberOfLines={2}>
              Accepts: {foodBank.acceptedItems.slice(0, 2).join(', ')}
              {foodBank.acceptedItems.length > 2 && '...'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <View style={styles.actionIcons}>
          {foodBank.phone && (
            <Ionicons name="call" size={18} color={proto.accent} />
          )}
          {foodBank.website && (
            <Ionicons name="globe" size={18} color={proto.accent} />
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={proto.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderSearchResults = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={proto.accent} />
          <Text style={styles.loadingText}>Finding food banks near you...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="warning" size={48} color="#E57373" />
          <Text style={styles.errorTitle}>Search Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (hasSearched && foodBanks.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="search" size={48} color={proto.textSecondary} />
          <Text style={styles.noResultsTitle}>No Food Banks Found</Text>
          <Text style={styles.noResultsText}>
            We couldn't find any food banks near ZIP code {zipCode}. Try searching a nearby area or check back later.
          </Text>
          <TouchableOpacity 
            style={styles.searchAgainButton} 
            onPress={() => searchInputRef.current?.focus()}
          >
            <Text style={styles.searchAgainButtonText}>Search Different Area</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (foodBanks.length > 0) {
      return (
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultsHeader}>
            Found {foodBanks.length} food bank{foodBanks.length !== 1 ? 's' : ''} near {zipCode}
          </Text>
          {foodBanks.map(renderFoodBankCard)}
          <View style={styles.resultsFooter}>
            <Text style={styles.footerText}>
              Always call ahead to confirm hours and donation requirements.
            </Text>
          </View>
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Bank Locator</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={proto.textSecondary} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Enter your ZIP code"
            placeholderTextColor={proto.textSecondary}
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="numeric"
            maxLength={5}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {zipCode.length > 0 && (
            <TouchableOpacity 
              onPress={() => setZipCode('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color={proto.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.searchButton,
            (!validateZipCode(zipCode) || loading) && styles.searchButtonDisabled
          ]}
          onPress={handleSearch}
          disabled={!validateZipCode(zipCode) || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={proto.buttonText} />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {!hasSearched ? (
          <EmptySearchState onSearch={() => searchInputRef.current?.focus()} />
        ) : (
          renderSearchResults()
        )}
      </View>

      {selectedFoodBank && (
        <FoodBankDetailsModal
          foodBank={selectedFoodBank}
          visible={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setSelectedFoodBank(null);
          }}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: proto.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: proto.accentDark,
    opacity: 0.85,
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 40,
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: proto.text,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: proto.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  searchButtonDisabled: {
    backgroundColor: proto.textSecondary,
    opacity: 0.5,
  },
  searchButtonText: {
    color: proto.buttonText,
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  getStartedButton: {
    backgroundColor: proto.accentDark,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  getStartedButtonText: {
    color: proto.buttonText,
    fontWeight: '600',
    fontSize: 18,
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
    paddingHorizontal: 20,
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
  noResultsTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: proto.text,
    textAlign: 'center',
  },
  noResultsText: {
    marginTop: 8,
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  searchAgainButton: {
    backgroundColor: proto.accentDark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchAgainButtonText: {
    color: proto.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  foodBankCard: {
    backgroundColor: proto.card,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: proto.accentDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodBankName: {
    fontSize: 18,
    fontWeight: '700',
    color: proto.buttonText,
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  distanceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: proto.buttonText,
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    color: proto.text,
    flex: 1,
    lineHeight: 18,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hoursText: {
    fontSize: 14,
    color: proto.textSecondary,
    fontWeight: '500',
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemsText: {
    fontSize: 14,
    color: proto.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  resultsFooter: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal styles
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: proto.text,
    flex: 1,
    marginRight: 16,
    lineHeight: 26,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: proto.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: proto.text,
    lineHeight: 22,
  },
  distanceTextModal: {
    fontSize: 14,
    color: proto.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  directionsButton: {
    backgroundColor: proto.accent,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  websiteButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: proto.buttonText,
    fontWeight: '600',
    fontSize: 14,
  },
});