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
  Pressable,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { 
  searchFoodBanks, 
  clearFoodBankCache, 
  filterFoodBanks,
  sortFoodBanks,
  isCurrentlyOpen,
  getCurrentLocation,
  type FoodBank, 
  type FoodBankType 
} from '@/services/foodBankService';

const proto = Colors.proto;

type FilterPanelProps = {
  visible: boolean;
  onClose: () => void;
  selectedTypes: FoodBankType[];
  onTypesChange: (types: FoodBankType[]) => void;
  openNowOnly: boolean;
  onOpenNowChange: (value: boolean) => void;
  hasPhoneOnly: boolean;
  onHasPhoneChange: (value: boolean) => void;
  maxDistance: number;
  onMaxDistanceChange: (value: number) => void;
  sortBy: 'distance' | 'name' | 'type' | 'openStatus';
  onSortByChange: (value: 'distance' | 'name' | 'type' | 'openStatus') => void;
  onApply: () => void;
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  visible,
  onClose,
  selectedTypes,
  onTypesChange,
  openNowOnly,
  onOpenNowChange,
  hasPhoneOnly,
  onHasPhoneChange,
  maxDistance,
  onMaxDistanceChange,
  sortBy,
  onSortByChange,
  onApply,
}) => {
  const foodBankTypes: { key: FoodBankType; label: string }[] = [
    { key: 'food_bank', label: 'Food Banks' },
    { key: 'food_pantry', label: 'Food Pantries' },
    { key: 'soup_kitchen', label: 'Soup Kitchens' },
    { key: 'mobile_food_bank', label: 'Mobile Food Banks' },
    { key: 'community_fridge', label: 'Community Fridges' },
    { key: 'other', label: 'Other' },
  ];

  const sortOptions = [
    { key: 'distance' as const, label: 'Distance', icon: 'location' },
    { key: 'name' as const, label: 'Name', icon: 'text' },
    { key: 'type' as const, label: 'Type', icon: 'list' },
    { key: 'openStatus' as const, label: 'Open Now', icon: 'time' },
  ];

  const toggleType = (type: FoodBankType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const clearAllFilters = () => {
    onTypesChange([]);
    onOpenNowChange(false);
    onHasPhoneChange(false);
    onMaxDistanceChange(30);
    onSortByChange('distance');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.filterModalOverlay} onPress={onClose}>
        <Pressable style={styles.filterModalContent} onPress={e => e.stopPropagation()}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={onClose} style={styles.filterCloseButton}>
              <Ionicons name="close" size={24} color={proto.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterBody} showsVerticalScrollIndicator={false}>
            {/* Sort Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortOptionsContainer}>
                {sortOptions.map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      sortBy === option.key && styles.sortOptionSelected
                    ]}
                    onPress={() => onSortByChange(option.key)}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={16} 
                      color={sortBy === option.key ? proto.buttonText : proto.textSecondary} 
                    />
                    <Text style={[
                      styles.sortOptionText,
                      sortBy === option.key && styles.sortOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Type Filter Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Food Bank Types</Text>
              <View style={styles.typeFiltersContainer}>
                {foodBankTypes.map(type => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeFilter,
                      selectedTypes.includes(type.key) && styles.typeFilterSelected
                    ]}
                    onPress={() => toggleType(type.key)}
                  >
                    <Text style={[
                      styles.typeFilterText,
                      selectedTypes.includes(type.key) && styles.typeFilterTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Other Filters Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Other Filters</Text>
              
              <TouchableOpacity
                style={styles.toggleFilter}
                onPress={() => onOpenNowChange(!openNowOnly)}
              >
                <View style={styles.toggleFilterLeft}>
                  <Ionicons name="time" size={20} color={proto.text} />
                  <Text style={styles.toggleFilterText}>Open Now</Text>
                </View>
                <View style={[
                  styles.toggleSwitch,
                  openNowOnly && styles.toggleSwitchActive
                ]}>
                  <View style={[
                    styles.toggleSwitchThumb,
                    openNowOnly && styles.toggleSwitchThumbActive
                  ]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleFilter}
                onPress={() => onHasPhoneChange(!hasPhoneOnly)}
              >
                <View style={styles.toggleFilterLeft}>
                  <Ionicons name="call" size={20} color={proto.text} />
                  <Text style={styles.toggleFilterText}>Has Phone Number</Text>
                </View>
                <View style={[
                  styles.toggleSwitch,
                  hasPhoneOnly && styles.toggleSwitchActive
                ]}>
                  <View style={[
                    styles.toggleSwitchThumb,
                    hasPhoneOnly && styles.toggleSwitchThumbActive
                  ]} />
                </View>
              </TouchableOpacity>

              <View style={styles.distanceFilter}>
                <View style={styles.distanceFilterHeader}>
                  <Ionicons name="location" size={20} color={proto.text} />
                  <Text style={styles.toggleFilterText}>Max Distance: {maxDistance} miles</Text>
                </View>
                <View style={styles.distanceOptions}>
                  {[10, 20, 30, 50].map(distance => (
                    <TouchableOpacity
                      key={distance}
                      style={[
                        styles.distanceOption,
                        maxDistance === distance && styles.distanceOptionSelected
                      ]}
                      onPress={() => onMaxDistanceChange(distance)}
                    >
                      <Text style={[
                        styles.distanceOptionText,
                        maxDistance === distance && styles.distanceOptionTextSelected
                      ]}>
                        {distance}mi
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterFooter}>
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={clearAllFilters}
            >
              <Text style={styles.clearFiltersButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyFiltersButton}
              onPress={() => {
                onApply();
                onClose();
              }}
            >
              <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
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
                <Text style={styles.distanceTextModal}>{foodBank.distance.toFixed(1)} miles away</Text>
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
  const [allFoodBanks, setAllFoodBanks] = useState<FoodBank[]>([]);
  const [foodBanks, setFoodBanks] = useState<FoodBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFoodBank, setSelectedFoodBank] = useState<FoodBank | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchType, setSearchType] = useState<'zip' | 'location' | 'city'>('zip');
  const [citySearch, setCitySearch] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<FoodBankType[]>([]);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [hasPhoneOnly, setHasPhoneOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(30);
  const [sortBy, setSortBy] = useState<'distance' | 'name' | 'type' | 'openStatus'>('distance');

  const searchInputRef = useRef<TextInput>(null);

  // Update displayed results when filters change
  useEffect(() => {
    updateFilters();
  }, [selectedTypes, openNowOnly, hasPhoneOnly, maxDistance, sortBy]);

  const validateInput = (): boolean => {
    if (searchType === 'zip') {
      const zipRegex = /^\d{5}$/;
      return zipRegex.test(zipCode);
    } else if (searchType === 'city') {
      return citySearch.trim().length >= 2;
    }
    return false;
  };

  const getCurrentInput = (): string => {
    return searchType === 'zip' ? zipCode : citySearch;
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      const location = await getCurrentLocation();
      
      // Use coordinates directly for search
      const results = await searchFoodBanks(`${location.lat},${location.lng}`, 'location');
      setAllFoodBanks(results);
      applyFiltersAndSort(results);
      setHasSearched(true);
      setError(null);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      if (__DEV__) console.error('Location error:', err);
      
      let errorMessage = 'Unable to get your location.';
      if (err instanceof Error) {
        if (err.message.includes('permission')) {
          errorMessage = 'Location permission denied. Please enable location access in settings.';
        }
      }
      
      Alert.alert('Location Error', errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = (banks: FoodBank[]) => {
    const filtered = filterFoodBanks(banks, {
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
      openNow: openNowOnly,
      hasPhone: hasPhoneOnly,
      maxDistance,
    });
    
    const sorted = sortFoodBanks(filtered, sortBy);
    setFoodBanks(sorted);
  };

  // Update displayed results when filters change
  const updateFilters = () => {
    if (allFoodBanks.length > 0) {
      applyFiltersAndSort(allFoodBanks);
    }
  };

  const handleSearch = async (forceRefresh = false) => {
    if (!validateInput()) {
      const message = searchType === 'zip' 
        ? 'Please enter a valid 5-digit ZIP code.' 
        : 'Please enter a valid city name.';
      Alert.alert('Invalid Input', message);
      return;
    }

    try {
      setLoading(!forceRefresh);
      setRefreshing(forceRefresh);
      setError(null);
      setHasSearched(true);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Clear cache if forcing refresh
      if (forceRefresh) {
        await clearFoodBankCache();
      }

      // Call the real API
      const results = await searchFoodBanks(getCurrentInput(), searchType);
      
      if (results.length === 0) {
        setAllFoodBanks([]);
        setFoodBanks([]);
      } else {
        setAllFoodBanks(results);
        applyFiltersAndSort(results);
      }
      
    } catch (err) {
      if (__DEV__) console.error('Error searching food banks:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to find food banks. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (err.message.includes('Invalid ZIP')) {
          errorMessage = 'Invalid ZIP code. Please check and try again.';
        } else if (err.message.includes('Unable to find')) {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setAllFoodBanks([]);
      setFoodBanks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFoodBankPress = (foodBank: FoodBank) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFoodBank(foodBank);
    setIsModalVisible(true);
  };

  const onRefresh = () => {
    if (validateInput()) {
      handleSearch(true);
    }
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
          <View style={styles.cardHeaderRight}>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{foodBank.distance.toFixed(1)} mi</Text>
            </View>
            {foodBank.type !== 'other' && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {foodBank.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </View>
            )}
          </View>
        </View>
        {foodBank.hours && (
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              isCurrentlyOpen(foodBank.hours) ? styles.statusDotOpen : styles.statusDotClosed
            ]} />
            <Text style={[
              styles.statusText,
              isCurrentlyOpen(foodBank.hours) ? styles.statusTextOpen : styles.statusTextClosed
            ]}>
              {isCurrentlyOpen(foodBank.hours) ? 'Open' : 'Closed'}
            </Text>
          </View>
        )}
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

        {foodBank.acceptedItems && foodBank.acceptedItems.length > 0 && (
          <View style={styles.itemsRow}>
            <Ionicons name="list" size={16} color={proto.textSecondary} />
            <Text style={styles.itemsText} numberOfLines={2}>
              Accepts: {foodBank.acceptedItems.slice(0, 2).join(', ')}
              {foodBank.acceptedItems.length > 2 && '...'}
            </Text>
          </View>
        )}

        {foodBank.requirements && foodBank.requirements.length > 0 && (
          <View style={styles.itemsRow}>
            <Ionicons name="information-circle" size={16} color={proto.accentDark} />
            <Text style={styles.requirementsText} numberOfLines={1}>
              Requirements: {foodBank.requirements[0]}
              {foodBank.requirements.length > 1 && '...'}
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
          <TouchableOpacity style={styles.retryButton} onPress={() => handleSearch()}>
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
            We couldn't find any food banks near {getCurrentInput()}. Try searching a nearby area or check back later.
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
        <ScrollView 
          style={styles.resultsContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={proto.accent}
              title="Pull to refresh"
              titleColor={proto.textSecondary}
            />
          }
        >
          <View style={styles.resultsHeaderContainer}>
            <Text style={styles.resultsHeader}>
              Found {foodBanks.length} food bank{foodBanks.length !== 1 ? 's' : ''} near {getCurrentInput()}
            </Text>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons name="options" size={16} color={proto.accent} />
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>
          {foodBanks.map(renderFoodBankCard)}
          <View style={styles.resultsFooter}>
            <Text style={styles.footerText}>
              Always call ahead to confirm hours and donation requirements.
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={16} color={proto.accent} />
              <Text style={styles.refreshButtonText}>Refresh Results</Text>
            </TouchableOpacity>
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
        <View style={styles.searchTypeSelector}>
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'zip' && styles.searchTypeButtonActive
            ]}
            onPress={() => setSearchType('zip')}
          >
            <Text style={[
              styles.searchTypeText,
              searchType === 'zip' && styles.searchTypeTextActive
            ]}>
              ZIP Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.searchTypeButton,
              searchType === 'city' && styles.searchTypeButtonActive
            ]}
            onPress={() => setSearchType('city')}
          >
            <Text style={[
              styles.searchTypeText,
              searchType === 'city' && styles.searchTypeTextActive
            ]}>
              City
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleUseCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color={proto.accent} />
            ) : (
              <Ionicons name="locate" size={20} color={proto.accent} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={proto.textSecondary} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={searchType === 'zip' ? "Enter your ZIP code" : "Enter city name"}
            placeholderTextColor={proto.textSecondary}
            value={searchType === 'zip' ? zipCode : citySearch}
            onChangeText={searchType === 'zip' ? setZipCode : setCitySearch}
            keyboardType={searchType === 'zip' ? "numeric" : "default"}
            maxLength={searchType === 'zip' ? 5 : 50}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {(searchType === 'zip' ? zipCode.length > 0 : citySearch.length > 0) && (
            <TouchableOpacity 
              onPress={() => searchType === 'zip' ? setZipCode('') : setCitySearch('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color={proto.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.searchButton,
            (!validateInput() || loading) && styles.searchButtonDisabled
          ]}
          onPress={() => handleSearch()}
          disabled={!validateInput() || loading}
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

      <FilterPanel
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        openNowOnly={openNowOnly}
        onOpenNowChange={setOpenNowOnly}
        hasPhoneOnly={hasPhoneOnly}
        onHasPhoneChange={setHasPhoneOnly}
        maxDistance={maxDistance}
        onMaxDistanceChange={setMaxDistance}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onApply={updateFilters}
      />
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
    fontSize: 32,
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
  searchTypeSelector: {
    flexDirection: 'row',
    backgroundColor: proto.card,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchTypeButtonActive: {
    backgroundColor: proto.accent,
  },
  searchTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: proto.textSecondary,
  },
  searchTypeTextActive: {
    color: proto.buttonText,
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: proto.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: proto.border,
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
  resultsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsHeader: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: proto.card,
    borderWidth: 1,
    borderColor: proto.border,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: proto.accent,
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
  cardHeaderRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    backgroundColor: proto.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    color: proto.buttonText,
    fontSize: 10,
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOpen: {
    backgroundColor: '#4CAF50',
  },
  statusDotClosed: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextOpen: {
    color: '#4CAF50',
  },
  statusTextClosed: {
    color: '#F44336',
  },
  requirementsText: {
    fontSize: 14,
    color: proto.accentDark,
    fontWeight: '500',
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
    gap: 16,
  },
  footerText: {
    fontSize: 14,
    color: proto.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: proto.accent,
  },
  refreshButtonText: {
    color: proto.accent,
    fontSize: 14,
    fontWeight: '500',
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
  // Filter Modal Styles
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: proto.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: proto.border,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: proto.text,
  },
  filterCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: proto.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBody: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 16,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: proto.card,
    borderWidth: 1,
    borderColor: proto.border,
    gap: 8,
  },
  sortOptionSelected: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: proto.textSecondary,
  },
  sortOptionTextSelected: {
    color: proto.buttonText,
  },
  typeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeFilter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: proto.card,
    borderWidth: 1,
    borderColor: proto.border,
  },
  typeFilterSelected: {
    backgroundColor: proto.accentDark,
    borderColor: proto.accentDark,
  },
  typeFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: proto.textSecondary,
  },
  typeFilterTextSelected: {
    color: proto.buttonText,
  },
  toggleFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: proto.border,
  },
  toggleFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleFilterText: {
    fontSize: 16,
    fontWeight: '500',
    color: proto.text,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: proto.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: proto.accent,
  },
  toggleSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: proto.buttonText,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleSwitchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  distanceFilter: {
    paddingVertical: 16,
  },
  distanceFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  distanceOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  distanceOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: proto.card,
    borderWidth: 1,
    borderColor: proto.border,
  },
  distanceOptionSelected: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
  },
  distanceOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: proto.textSecondary,
  },
  distanceOptionTextSelected: {
    color: proto.buttonText,
  },
  filterFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: proto.border,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: proto.border,
    alignItems: 'center',
  },
  clearFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.textSecondary,
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: proto.accent,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.buttonText,
  },
});
