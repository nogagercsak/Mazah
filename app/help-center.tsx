import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

const proto = Colors.proto;

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: IconSymbolName;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I add items to my inventory?',
    answer: 'Tap the + button on the main screen. You can then enter the item name, quantity, expiration date, and choose the storage location (fridge, pantry, or freezer).',
    icon: 'plus' as IconSymbolName,
  },
  {
    id: '2',
    question: 'How do I edit or delete items?',
    answer: 'Swipe left on any item to reveal quick actions. You can mark it as used or delete it. Tap on the item to see details and edit options.',
    icon: 'star' as IconSymbolName,
  },
  {
    id: '3',
    question: 'What do the colors mean?',
    answer: 'Red means expired, orange means expiring within 3 days, yellow means expiring within a week, and green means the item is still fresh.',
    icon: 'thermometer' as IconSymbolName,
  },
  {
    id: '4',
    question: 'Can I get notifications for expiring items?',
    answer: 'Yes! Go to Profile > Notifications to enable alerts. You can customize how many days before expiration you want to be notified.',
    icon: 'lightbulb' as IconSymbolName,
  },
  {
    id: '5',
    question: 'Is my data backed up?',
    answer: 'Yes, your inventory data is automatically synced to the cloud when you\'re logged in. You can access it from any device.',
    icon: 'checkmark' as IconSymbolName,
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleContactSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:mazah.foodsavingapp@gmail.com?subject=Help Request');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <IconSymbol size={24} name="chevron.left" color={proto.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>How can we help you today?</Text>
            <Text style={styles.heroSubtitle}>
              Find quick answers to common questions or get in touch with our support team
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <Text style={styles.sectionSubtitle}>Tap any question to expand the answer</Text>
          </View>
          
          <View style={styles.faqContainer}>
            {faqData.map((item, index) => (
              <View key={item.id} style={[
                styles.faqItem,
                index === 0 && styles.faqItemFirst,
                index === faqData.length - 1 && styles.faqItemLast
              ]}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleExpanded(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqQuestionContainer}>
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                  </View>
                  <View style={[
                    styles.expandIcon,
                    expandedItems.has(item.id) && styles.expandIconRotated
                  ]}>
                    <IconSymbol
                      size={18}
                      name="chevron.right"
                      color={proto.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
                
                {expandedItems.has(item.id) && (
                  <View style={styles.faqAnswer}>
                    <View style={styles.faqAnswerDivider} />
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pro Tips</Text>
            <Text style={styles.sectionSubtitle}>Make the most of your food inventory</Text>
          </View>
          
          <View style={styles.tipsGrid}>
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Text style={styles.tipTitle}>Stay Updated</Text>
              </View>
              <Text style={styles.tipText}>
                Mark items as used when you consume them to maintain accurate inventory levels.
              </Text>
            </View>
            
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Text style={styles.tipTitle}>Check Dates</Text>
              </View>
              <Text style={styles.tipText}>
                Review your inventory regularly to use items before they expire and reduce waste.
              </Text>
            </View>
            
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Text style={styles.tipTitle}>Be Specific</Text>
              </View>
              <Text style={styles.tipText}>
                Use clear names when adding items (e.g., "Whole Milk 2%" instead of just "Milk").
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Need more help?</Text>
          <Text style={styles.supportSubtitle}>
            Can't find what you're looking for? Our support team is here to help.
          </Text>
          
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.contactButtonText}>Contact Support Team</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: proto.textSecondary + '10',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: proto.card,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: proto.accentDark,
    opacity: 0.85,
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: proto.accent + '15',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: proto.accent + '20',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: proto.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 16,
    color: proto.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: proto.text,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: proto.textSecondary,
    opacity: 0.8,
  },
  faqContainer: {
    marginHorizontal: 20,
    backgroundColor: proto.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  faqItem: {
    backgroundColor: proto.card,
  },
  faqItemFirst: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  faqItemLast: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    minHeight: 72,
  },
  faqQuestionContainer: {
    flex: 1,
    paddingRight: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: proto.text,
    lineHeight: 22,
  },
  expandIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: proto.textSecondary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '90deg' }],
    backgroundColor: proto.accent + '20',
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  faqAnswerDivider: {
    height: 1,
    backgroundColor: proto.textSecondary + '15',
    marginBottom: 16,
  },
  faqAnswerText: {
    fontSize: 15,
    color: proto.textSecondary,
    lineHeight: 22,
  },
  tipsGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  tipCard: {
    backgroundColor: proto.card,
    borderRadius: 18,
    padding: 20,
    shadowColor: proto.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: proto.textSecondary + '08',
  },
  tipHeader: {
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: proto.text,
    letterSpacing: -0.1,
  },
  tipText: {
    fontSize: 14,
    color: proto.textSecondary,
    lineHeight: 20,
  },
  supportSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: proto.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  supportSubtitle: {
    fontSize: 15,
    color: proto.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 300,
  },
  contactButton: {
    backgroundColor: proto.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: proto.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 200,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: proto.buttonText,
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    height: 20,
  },
});