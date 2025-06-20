import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const proto = Colors.proto;

type StorageLocation = 'fridge' | 'pantry' | 'freezer';

const getFormattedDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

export default function AddItemScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [daysUntilExpiration, setDaysUntilExpiration] = useState(0); // Default to today
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('pantry');
  const [loading, setLoading] = useState(false);

  const expirationDate = getFormattedDate(daysUntilExpiration);

  const handleAddItem = async () => {
    if (!name || !quantity) {
      Alert.alert('Missing Information', 'Please fill out all fields.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'Please sign in to add items.');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('food_items').insert({
        name,
        quantity,
        expiration_date: expirationDate,
        storage_location: storageLocation,
        user_id: user.id,
      });

      if (insertError) {
        throw insertError;
      }

      // We can't guarantee the inventory screen will refetch, so we'll just go back.
      // For a more robust solution, a global state manager would be ideal.
      Alert.alert('Success!', 'Your item has been added.');
      router.back();

    } catch (err) {
      console.error('Error adding item:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      Alert.alert('Error', `Could not add the item: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getExpirationText = (days: number) => {
    if (days < 0) return 'Expired'; // Should not happen with the slider's range
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
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
              storageLocation === loc.name && styles.storageOptionSelected,
            ]}
            onPress={() => setStorageLocation(loc.name)}
          >
            <IconSymbol name={loc.icon} size={24} color={storageLocation === loc.name ? proto.buttonText : proto.accentDark} />
            <Text style={[styles.storageOptionText, storageLocation === loc.name && styles.storageOptionTextSelected]}>
              {loc.name.charAt(0).toUpperCase() + loc.name.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name={"chevron.left" as any} size={22} color={proto.accentDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Food Item</Text>
        <View style={{ width: 40 }} /> 
      </View>
      
      <View style={styles.form}>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
            style={styles.input}
            placeholder="e.g., Organic Milk"
            value={name}
            onChangeText={setName}
            placeholderTextColor={proto.textSecondary}
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
            style={styles.input}
            placeholder="e.g., 1 gallon"
            value={quantity}
            onChangeText={setQuantity}
            placeholderTextColor={proto.textSecondary}
            />
        </View>

        <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
                <Text style={styles.label}>Expiration Date</Text>
                <Text style={styles.datePreview}>
                    {expirationDate} ({getExpirationText(daysUntilExpiration)})
                </Text>
            </View>
            <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={180} // ~6 months
                step={1}
                value={daysUntilExpiration}
                onValueChange={setDaysUntilExpiration}
                minimumTrackTintColor={proto.accent}
                maximumTrackTintColor={proto.textSecondary}
                thumbTintColor={proto.accentDark}
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Storage Location</Text>
            {renderStorageSelector()}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleAddItem} disabled={loading}>
            {loading ? <ActivityIndicator color={proto.buttonText} /> : <Text style={styles.saveButtonText}>Add Item to Inventory</Text>}
        </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: proto.accentDark,
    },
    form: {
        paddingHorizontal: 24,
        paddingTop: 16,
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: proto.text,
        marginBottom: 8,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    datePreview: {
        fontSize: 14,
        color: proto.textSecondary,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        fontSize: 16,
        color: proto.text,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    storageSelectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    storageOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        marginHorizontal: 4,
        backgroundColor: '#FFFFFF',
    },
    storageOptionSelected: {
        backgroundColor: proto.accentDark,
        borderColor: proto.accentDark,
    },
    storageOptionText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: proto.accentDark,
    },
    storageOptionTextSelected: {
        color: proto.buttonText,
    },
    saveButton: {
        backgroundColor: proto.accent,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 'auto', 
        marginBottom: 16,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: proto.buttonText,
    },
}); 