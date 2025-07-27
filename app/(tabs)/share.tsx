import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

const proto = Colors.proto;

const mockListings = [
  {
    id: 1,
    title: 'Fresh Tomatoes',
    description: 'Organic tomatoes from my garden. Too many to use!',
    quantity: '2kg',
    location: 'Downtown',
    distance: '0.5km',
    postedBy: 'Sarah M.',
    postedTime: '2 hours ago',
    category: 'Vegetables',
  },
  {
    id: 2,
    title: 'Bread Loaves',
    description: 'Fresh bread from local bakery. Bought too much.',
    quantity: '3 loaves',
    location: 'Westside',
    distance: '1.2km',
    postedBy: 'Mike R.',
    postedTime: '4 hours ago',
    category: 'Bakery',
  },
  {
    id: 3,
    title: 'Apples',
    description: 'Red apples, still crisp and fresh.',
    quantity: '1kg',
    location: 'North Park',
    distance: '0.8km',
    postedBy: 'Emma L.',
    postedTime: '1 day ago',
    category: 'Fruits',
  },
];

const mockCategories = [
  { id: 'all', name: 'All', active: true },
  { id: 'vegetables', name: 'Vegetables', active: false },
  { id: 'fruits', name: 'Fruits', active: false },
  { id: 'bakery', name: 'Bakery', active: false },
  { id: 'dairy', name: 'Dairy', active: false },
];

export default function ShareScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState(mockCategories);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const toggleCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCategories(categories.map(c => ({ ...c, active: c.id === categoryId })));
  };

  const getFilteredListings = () => {
    if (selectedCategory === 'all') return mockListings;
    return mockListings.filter(listing => 
      listing.category.toLowerCase() === selectedCategory
    );
  };

  const postNewItem = () => {
    Alert.alert('Post Item', 'This would open a form to post a new food item for sharing');
  };

  const contactUser = (listing: any) => {
    Alert.alert('Contact', `This would open chat with ${listing.postedBy} about ${listing.title}`);
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile');
  };

  const renderListingCard = (listing: any) => (
    <View key={listing.id} style={styles.listingCard}>
      <View style={styles.listingImage}>
        <Text style={styles.listingImageText}>{listing.title.split(' ')[0]}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{listing.category}</Text>
        </View>
      </View>
      <View style={styles.listingInfo}>
        <View style={styles.listingHeader}>
          <Text style={styles.listingTitle}>{listing.title}</Text>
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{listing.quantity}</Text>
          </View>
        </View>
        <Text style={styles.listingDescription}>{listing.description}</Text>
        <View style={styles.listingMeta}>
          <View style={styles.metaItem}>
            <IconSymbol size={16} name={"location" as any} color={proto.textSecondary} />
            <Text style={styles.metaText}>{listing.location} • {listing.distance}</Text>
          </View>
          <View style={styles.metaItem}>
            <IconSymbol size={16} name={"person" as any} color={proto.textSecondary} />
            <Text style={styles.metaText}>{listing.postedBy} • {listing.postedTime}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.contactButton} onPress={() => contactUser(listing)}>
          <IconSymbol size={16} name={"message" as any} color={proto.buttonText} />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Local Sharing</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.postButton} onPress={postNewItem}>
              <IconSymbol size={20} name={"plus" as any} color={proto.buttonText} />
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
              <IconSymbol size={20} name={"person" as any} color={proto.accentDark} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryChip, category.active && styles.categoryChipActive]}
              onPress={() => toggleCategory(category.id)}
            >
              <Text style={[styles.categoryText, category.active && styles.categoryTextActive]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView
          style={styles.listingsContainer}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}>
          <View style={styles.listingsGrid}>
            {getFilteredListings().map(renderListingCard)}
          </View>
          {getFilteredListings().length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol size={48} name={"hand.raised" as any} color={proto.textSecondary} />
              <Text style={styles.emptyStateTitle}>No items found nearby</Text>
              <Text style={styles.emptyStateText}>Be the first to share food in your area!</Text>
            </View>
          )}
        </ScrollView>
      </View>
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
        paddingTop: 8,               
        paddingBottom: 0,          
        backgroundColor: proto.background,
        marginBottom: 0,             
    },
  
    headerTitle: {
        fontSize: 32,              
        fontWeight: '700',         
        color: proto.accentDark,      
        opacity: 0.85,              
        letterSpacing: 0.5,         
        marginBottom: 0,            
        marginTop: 0,               
    },
  
    postButton: {
        flexDirection: 'row',
        alignItems: 'center',
                      
        height: 44,                  
        borderRadius: 22,           
        justifyContent: 'center',    
        backgroundColor: proto.card,   
        shadowColor: proto.shadow,  
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.2,             
        shadowRadius: 3,              
        elevation: 2,               
        paddingVertical: 8,           
        paddingHorizontal: 12,    
           
    },
    
    postButtonText: {
        color: proto.accentDark,      
        marginLeft: 8,
        fontWeight: 'bold',
    },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 60,
  },
  categoryChip: {
    backgroundColor: proto.card,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: proto.textSecondary,
  },
  categoryChipActive: {
    backgroundColor: proto.accent,
    borderColor: proto.accent,
  },
  categoryText: {
    color: proto.text,
  },
  categoryTextActive: {
    color: proto.buttonText,
  },
  listingsContainer: {
    flex: 1,
  },
  listingsGrid: {
    padding: 16,
  },
  listingCard: {
    backgroundColor: proto.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  listingImage: {
    height: 120,
    backgroundColor: proto.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  listingImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: proto.textSecondary,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
  },
  listingInfo: {
    padding: 12,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: proto.text,
    flex: 1,
  },
  quantityBadge: {
    backgroundColor: proto.background,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: proto.textSecondary,
  },
  quantityText: {
    color: proto.text,
    fontSize: 12,
  },
  listingDescription: {
    color: proto.textSecondary,
    marginBottom: 8,
  },
  listingMeta: {
    borderTopWidth: 1,
    borderColor: proto.textSecondary,
    paddingTop: 8,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    color: proto.textSecondary,
    marginLeft: 8,
  },
  contactButton: {
    backgroundColor: proto.accent,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  contactButtonText: {
    color: proto.buttonText,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: proto.text,
    marginTop: 16,
  },
  emptyStateText: {
    color: proto.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: 8,
  },
});

 