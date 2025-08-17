import { Colors } from '@/constants/Colors';
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import OnboardingButton from '../components/OnboardingButton';
import { OnboardingProfile } from '..';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';

const proto = Colors.proto;
const { width: screenWidth } = Dimensions.get('window');

interface Step7NotificationsProps {
  onNext: () => void;
  onBack: () => void;
  updateProfile: (data: Partial<OnboardingProfile>) => void;
  profile: Partial<OnboardingProfile>;
}

export default function Step7Notifications({
  onNext,
  onBack,
  updateProfile,
  profile,
}: Step7NotificationsProps) {
  const insets = useSafeAreaInsets();
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    checkPermissionStatus();
    
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        updateProfile({ 
          notifications_enabled: true,
          expiration_notifications_enabled: true 
        });
      }
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      setIsRequesting(true);
      
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        if (Device.isDevice && Device.osName === 'Android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
        
        updateProfile({ 
          notifications_enabled: true,
          expiration_notifications_enabled: true 
        });
        
        Alert.alert(
          'Notifications Enabled! 🎉',
          'You\'ll now receive helpful reminders about food expiration and other important updates.',
          [{ text: 'Great!', onPress: onNext }]
        );
      } else {
        updateProfile({ 
          notifications_enabled: false,
          expiration_notifications_enabled: false 
        });
        
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications later in your profile settings if you change your mind.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    updateProfile({ 
      notifications_enabled: false,
      expiration_notifications_enabled: false 
    });
    onNext();
  };

  const benefits = [
    { icon: 'clock.fill', text: 'Get timely reminders before your food expires', color: '#FF6B6B' },
    { icon: 'calendar', text: 'Stay organized with weekly meal planning', color: '#4ECDC4' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <Animated.View style={{ 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }] 
        }}>
          {/* Header */}
          <View style={styles.header}>
            <Animated.View style={[
              styles.iconContainer,
              { 
                transform: [
                  { scale: scaleAnim }
                ] 
              }
            ]}>
              <IconSymbol size={48} name="bell.fill" color={proto.accent} />
            </Animated.View>
            
            <Text style={styles.title}>Never Miss a Beat</Text>
            <Text style={styles.subtitle}>
              Smart notifications to help you save food and money
            </Text>
          </View>

          {/* Benefits List */}
          <View style={styles.benefitsContainer}>
            {benefits.map((benefit, index) => (
              <Animated.View 
                key={index}
                style={[
                  styles.benefitItem,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { 
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 30],
                          outputRange: [0, 30 + (index * 10)]
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={[styles.benefitIcon, { backgroundColor: benefit.color + '15' }]}>
                  <IconSymbol size={22} name={benefit.icon} color={benefit.color} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>
                    {benefit.icon === 'clock.fill' ? 'Food Expiration Alerts' : 'Meal Planning'}
                  </Text>
                  <Text style={styles.benefitDescription}>{benefit.text}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Status Card */}
          {permissionStatus && (
            <View style={[
              styles.statusCard,
              permissionStatus === 'granted' && styles.statusCardSuccess
            ]}>
              <View style={styles.statusHeader}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: permissionStatus === 'granted' ? '#4CAF50' : '#FFA726' }
                ]} />
                <Text style={styles.statusTitle}>
                  {permissionStatus === 'granted' ? 'All Set!' : 'Action Required'}
                </Text>
              </View>
              <Text style={styles.statusMessage}>
                {permissionStatus === 'granted' 
                  ? 'Notifications are enabled and ready to help you save food!'
                  : 'Enable notifications to get the most out of your app experience'}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          {permissionStatus !== 'granted' && (
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, isRequesting && styles.buttonDisabled]}
                onPress={requestPermissions}
                disabled={isRequesting}
                activeOpacity={0.8}
              >
                <IconSymbol 
                  size={20} 
                  name="bell.fill" 
                  color={proto.buttonText} 
                />
                <Text style={styles.primaryButtonText}>
                  Enable Notifications
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Privacy Badge */}
          <View style={styles.privacyContainer}>
            <View style={styles.privacyIconWrapper}>
              <IconSymbol size={16} name="lock.fill" color={proto.accent} />
            </View>
            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>We respect your privacy</Text>
              <View style={styles.privacyPoints}>
                <View style={styles.privacyPoint}>
                  <View style={styles.privacyDot} />
                  <Text style={styles.privacyText}>No spam, ever</Text>
                </View>
                <View style={styles.privacyPoint}>
                  <View style={styles.privacyDot} />
                  <Text style={styles.privacyText}>Unsubscribe anytime</Text>
                </View>
                <View style={styles.privacyPoint}>
                  <View style={styles.privacyDot} />
                  <Text style={styles.privacyText}>Your data is secure</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Navigation */}
      <View style={[
        styles.navigation,
        { paddingBottom: Math.max(insets.bottom + 16, 24) }
      ]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <IconSymbol size={20} name="chevron.left" color={proto.text} />
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
        
        {permissionStatus === 'granted' && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={onNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              Complete Setup
            </Text>
            <IconSymbol size={20} name="chevron.right" color={proto.buttonText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: proto.background,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: proto.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: proto.accent + '30',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: proto.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: proto.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  benefitsContainer: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: proto.textSecondary,
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: proto.border,
  },
  statusCardSuccess: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50' + '08',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
  },
  statusMessage: {
    fontSize: 14,
    color: proto.textSecondary,
    lineHeight: 20,
  },
  actionContainer: {
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: proto.accent,
    paddingVertical: 18,
    borderRadius: 14,
    shadowColor: proto.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: proto.buttonText,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: proto.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  privacyContainer: {
    backgroundColor: proto.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: proto.accent + '20',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: proto.accent + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: proto.text,
    marginBottom: 8,
  },
  privacyPoints: {
    gap: 4,
  },
  privacyPoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: proto.accent,
    marginRight: 8,
  },
  privacyText: {
    fontSize: 13,
    color: proto.textSecondary,
    lineHeight: 18,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 20,
    backgroundColor: proto.background,
    borderTopWidth: 1,
    borderTopColor: proto.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  navButtonPrimary: {
    backgroundColor: proto.accent,
    paddingHorizontal: 20,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: proto.text,
  },
  navButtonTextPrimary: {
    color: proto.buttonText,
  },
});