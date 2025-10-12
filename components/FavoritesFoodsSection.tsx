import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { FavoriteFood } from '@/lib/supabase';
import favoriteFoodService from '@/services/favoriteFoodService';

const proto = Colors.proto;

interface FavoritesFoodsSectionProps {
  userId: string;
  onSelectFavorite: (favorite: FavoriteFood) => void;
}

export const FavoritesFoodsSection: React.FC<FavoritesFoodsSectionProps> = ({
  userId,
  onSelectFavorite,
}) => {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadFavorites();
    }
  }, [userId]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const favs = await favoriteFoodService.getFavoriteFoods(userId);
      setFavorites(favs || []);
    } catch (err) {
      if (__DEV__) console.error('Error loading favorites:', err);
      setError('Failed to load favorites');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const getStorageIcon = (location: string | null) => {
    switch (location) {
      case 'fridge':
        return 'thermometer';
      case 'freezer':
        return 'snowflake';
      case 'pantry':
        return 'cabinet';
      default:
        return 'star.fill';
    }
  };

  // Don't show section if loading or no favorites
  if (loading) {
    return null;
  }

  if (error) {
    if (__DEV__) console.log('Favorites error:', error);
    return null;
  }

  if (!favorites || favorites.length === 0) {
    return null; // Don't show section if no favorites
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.starIconContainer}>
            <IconSymbol name="star.fill" size={18} color="#FFD700" />
          </View>
          <Text style={styles.headerText}>Quick Add Favorites</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{favorites.length}</Text>
          </View>
        </View>
        <IconSymbol 
          name={expanded ? "chevron.up" : "chevron.down"} 
          size={18} 
          color={proto.textSecondary} 
        />
      </TouchableOpacity>

      {expanded && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.favoritesScroll}
        >
          {favorites.map((favorite) => (
            <TouchableOpacity
              key={favorite.id}
              style={styles.favoriteCard}
              onPress={() => onSelectFavorite(favorite)}
              activeOpacity={0.8}
            >
              <View style={styles.favoriteIconContainer}>
                <IconSymbol 
                  name={getStorageIcon(favorite.storage_location) as any} 
                  size={28} 
                  color={proto.accent}
                />
              </View>
              <Text style={styles.favoriteName} numberOfLines={2}>
                {favorite.food_name}
              </Text>
              {favorite.default_quantity && (
                <View style={styles.quantityBadge}>
                  <Text style={styles.favoriteQuantity} numberOfLines={1}>
                    {favorite.default_quantity}
                  </Text>
                </View>
              )}
              <View style={styles.starBadge}>
                <IconSymbol name="star.fill" size={10} color="#FFD700" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: proto.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: proto.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  starIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: proto.text,
  },
  badge: {
    backgroundColor: proto.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: proto.buttonText,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  favoritesScroll: {
    paddingHorizontal: 12,
    gap: 12,
  },
  favoriteCard: {
    backgroundColor: proto.inputBackground,
    borderRadius: 14,
    padding: 14,
    width: 110,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: proto.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  favoriteIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: proto.accent,
  },
  favoriteName: {
    fontSize: 14,
    fontWeight: '700',
    color: proto.text,
    textAlign: 'center',
    marginBottom: 6,
    minHeight: 36,
  },
  quantityBadge: {
    backgroundColor: proto.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  favoriteQuantity: {
    fontSize: 11,
    fontWeight: '600',
    color: proto.buttonText,
    textAlign: 'center',
  },
  starBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
