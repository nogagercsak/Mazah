import React from 'react';
import { ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';

const privacyMarkdown = `
# PRIVACY POLICY

**Last Updated:** September 20th, 2025

## Introduction

Welcome to **Mazah** ("us", "we", or "our"). We operate the Mazah mobile application (the "**Service**"), a food waste reduction app that helps users track their food inventory, plan meals, and find local food banks.

This Privacy Policy explains how we collect, use, and protect your information when you use our Service.

## What Information We Collect

### Account Information
When you create an account, we collect:
- **Email address** (for authentication and account recovery)
- **Password** (securely stored via Supabase Auth)

### Profile Information
During onboarding, you may provide:
- **Household size** (to personalize meal recommendations)
- **Dietary preferences** (for better meal suggestions)
- **Cooking habits** (to improve app functionality)
- **Food waste awareness level** (for personalized tips)
- **Notification preferences** (for food expiration alerts)

### Food Inventory Data
To help you track and reduce food waste, we store:
- **Food items** you add to your inventory
- **Expiration dates** and storage locations
- **Meal plans** you create
- **Usage patterns** to improve recommendations

### Location Data (Optional)
With your explicit permission, we may collect your location to:
- **Find nearby food banks** when you search for donation locations
- **Provide distance calculations** for food bank listings

**Important:** Location data is only collected when you actively use the food bank finder feature and is not stored permanently.

### Device and Usage Information
We automatically collect:
- **Device type and operating system** (for app compatibility)
- **App usage analytics** (via Supabase Analytics - crash reports, performance data)
- **Push notification tokens** (to send expiration alerts)

### What We Don't Collect
We do **NOT** collect:
- Browsing history outside our app
- Cookies for advertising
- Social media data
- Payment information (our app is currently free)
- Camera or photo data
- Contacts or calendar information

## How We Use Your Information

We use your information to:

1. **Provide core app functionality** (food tracking, meal planning)
2. **Send food expiration notifications** (only if you enable them)
3. **Improve app performance** and fix bugs
4. **Provide customer support** when you contact us
5. **Ensure account security** and prevent fraud
6. **Comply with legal obligations**

We do **NOT** use your information for:
- Marketing emails or promotional content
- Selling to third parties
- Advertising purposes
- Social media integration

## Data Storage and Security

### Where Your Data is Stored
Your data is securely stored using **Supabase**, a trusted backend service provider:
- **Servers located:** United States (AWS infrastructure)
- **Encryption:** All data is encrypted in transit and at rest
- **Access controls:** Only authenticated users can access their own data

### Security Measures
We implement industry-standard security practices:
- **Authentication:** Secure email/password authentication
- **Session management:** Automatic session timeouts and refresh
- **Data validation:** Input sanitization and validation
- **Monitoring:** Real-time security monitoring

## Third-Party Services

We use the following third-party services:

### Supabase (Backend Services)
- **Purpose:** Authentication, database, and real-time features
- **Data shared:** Account information, food inventory, meal plans
- **Privacy Policy:** [https://supabase.com/privacy](https://supabase.com/privacy)

### Spoonacular (Recipe API)
- **Purpose:** Recipe recommendations and meal suggestions based on your food inventory
- **Data shared:** Your food ingredients (to find matching recipes)
- **Privacy Policy:** [https://spoonacular.com/food-api/privacy-policy](https://spoonacular.com/food-api/privacy-policy)

### OpenStreetMap (Food Bank Locations)
- **Purpose:** Finding nearby food banks for donations
- **Data shared:** Your location (temporarily, when you search)
- **Privacy Policy:** [https://wiki.osmfoundation.org/wiki/Privacy_Policy](https://wiki.osmfoundation.org/wiki/Privacy_Policy)

### Expo Platform (App Infrastructure)
- **Purpose:** App delivery, push notifications, crash reporting
- **Data shared:** Device information, crash logs, push tokens
- **Privacy Policy:** [https://expo.dev/privacy](https://expo.dev/privacy)

## Data Retention

We retain your data only as long as necessary:

- **Account data:** Until you delete your account
- **Food inventory:** Automatically cleaned up after items expire
- **Usage analytics:** Up to 2 years for app improvement
- **Crash logs:** Up to 90 days for debugging

You can delete your account and all associated data at any time by contacting us.

## Data Sharing and Disclosure

**We do NOT sell, rent, or trade your personal information to third parties.**

We may share your information only in these limited circumstances:
- **With your consent** for specific features you enable
- **With service providers** (Supabase, Expo) to operate the app
- **For legal compliance** when required by law
- **To protect safety** in emergency situations
- **Business transfers** (with notice if ownership changes)

All third-party services we use have their own privacy policies and security measures.

## Your Rights and Controls

### Managing Your Data
You have the right to:

1. **Access** your personal data
2. **Update** or correct your information
3. **Delete** your account and all data
4. **Export** your data (food inventory, meal plans)
5. **Control notifications** through app settings

**To delete your account:** Contact us at mazah.foodsavingapp@gmail.com with "Delete Account" in the subject line. We will permanently delete all your data within 30 days.

### GDPR Rights (EU/EEA Users)
If you're in the European Union or European Economic Area, you also have the right to:
- **Data portability** - receive your data in a machine-readable format
- **Restrict processing** - limit how we use your data
- **Object to processing** - opt out of certain data uses
- **Lodge complaints** - contact your local data protection authority

### California Privacy Rights (CCPA)
California residents have additional rights:
- **Right to know** what personal information we collect and how it's used
- **Right to delete** personal information (with some exceptions)
- **Right to opt-out** of data "sales" (we don't sell data)
- **Right to non-discrimination** for exercising privacy rights

### Location Privacy
- Location access is **always optional**
- Only used for food bank finder feature
- Can be denied or revoked at any time
- Location is **never stored** permanently

### Notification Controls
You can control push notifications:
- Turn off all notifications
- Customize expiration alert timing
- Disable specific notification types

### Data Portability
You can request a copy of your data by contacting us at mazah.foodsavingapp@gmail.com

## Children's Privacy

Our app is designed to be safe and appropriate for users of all ages, including children. We are committed to protecting children's privacy and comply with applicable children's privacy laws.

**For users under 13:** We encourage parental supervision and recommend that parents help younger children use the app responsibly.

**Data collection for minors:** We collect the same minimal data for all users regardless of age (email, food inventory, meal plans). We do not collect additional personal information from children.

**Parental rights:** Parents can contact us at mazah.foodsavingapp@gmail.com to:
- Review their child's data
- Request deletion of their child's account
- Ask questions about our privacy practices

If you believe a child has provided us with personal information without parental consent, please contact us immediately.

## Changes to This Policy

We may update this Privacy Policy to reflect:
- Changes in our data practices
- New features or services
- Legal requirements

We will notify you of significant changes by:
- Updating the "Last Updated" date
- Sending an in-app notification
- Posting a notice in the app

Continued use of the app after changes indicates acceptance of the updated policy.

## International Users

If you are accessing our app from outside the United States:
- Your data may be transferred to and stored in the US
- We comply with applicable data protection laws
- EU/EEA residents have additional rights under GDPR

## Contact Us

For questions about this Privacy Policy or your data:

**Email:** mazah.foodsavingapp@gmail.com
**Subject Line:** Privacy Policy Inquiry

We aim to respond to all privacy inquiries within 48 hours.

---

**Note:** This app is designed to help reduce food waste and support local communities. We are committed to protecting your privacy while delivering a meaningful service.
`;

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={{ padding: 20, backgroundColor: '#fff' }}>
      <Markdown
        style={{
          heading1: { 
            fontSize: 24, 
            fontWeight: 'bold', 
            marginBottom: 16,
            color: '#2c3e50'
          },
          heading2: { 
            fontSize: 20, 
            fontWeight: 'bold', 
            marginBottom: 12,
            color: '#34495e',
            marginTop: 16
          },
          strong: { 
            fontWeight: 'bold' 
          },
          link: { 
            color: '#2980b9',
            textDecorationLine: 'underline'
          },
          paragraph: { 
            marginBottom: 10,
            lineHeight: 22,
            color: '#2d3436'
          },
          list_item: {
            marginBottom: 5
          },
          bullet_list: {
            marginBottom: 10
          },
          ordered_list: {
            marginBottom: 10
          }
        }}
      >
        {privacyMarkdown}
      </Markdown>
    </ScrollView>
  );
}

// New change - Sun Aug  3 18:56:21 CEST 2025
