import React from 'react';
import { ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';

const privacyMarkdown = `
# PRIVACY POLICY

**Last Updated:** August 3rd, 2025

## Introduction

Welcome to **Mazah** ("us", "we", or "our"). We operate the Mazah: Food Waste Fighting mobile application (the "**Service**").

This Privacy Policy governs your use of our Service and explains how we:

- Collect
- Safeguard 
- Disclose 

information resulting from your use of our Service.

We use your data to provide and improve the Service. By using the Service, you agree to our collection and use of information in accordance with this policy.

## Definitions

- **Service:** The Mazah: Food Waste Fighting mobile application operated by Mazah
- **Personal Data:** Information about a living individual who can be identified from that data
- **Usage Data:** Data collected automatically from Service use or infrastructure
- **Cookies:** Small files stored on your device (computer or mobile device)
- **Data Controller:** Entity that determines how and why personal data is processed
- **Data Processors:** Third parties who process data on our behalf
- **Data Subject:** Individual who is the subject of Personal Data
- **User:** Individual using our Service (corresponds to Data Subject)

## Information Collection and Use

We collect several types of information to provide and improve our Service:

### Types of Data Collected

#### Personal Data
While using our Service, we may ask you to provide:

1. Email address
2. Address (including city, state, ZIP/postal code)
3. Cookies and Usage Data

We may use your Personal Data to:
- Contact you with newsletters and promotions
- Provide service updates
- Offer customer support

You may opt out of communications at any time.

#### Usage Data
We collect information about how you access the Service, including:

- IP address
- Browser type and version
- Pages visited
- Time and date of visits
- Device identifiers
- Diagnostic data

#### Location Data
With your permission, we may collect and store location information to:

- Provide location-based features
- Improve service customization

You can enable/disable location services through device settings.

#### Tracking Cookies Data
We use cookies and similar technologies to:

- Track Service activity
- Hold certain information

Cookie types we use:

1. **Session Cookies:** For operating our Service
2. **Preference Cookies:** To remember your settings
3. **Security Cookies:** For security purposes
4. **Advertising Cookies:** To serve relevant ads

## Use of Data

Mazah uses collected data to:

1. Provide and maintain our Service
2. Notify you about Service changes
3. Enable interactive features
4. Provide customer support
5. Gather analysis for improvement
6. Monitor Service usage
7. Detect and address technical issues
8. Fulfill other purposes you provide it for
9. Carry out contractual obligations
10. Provide account notifications
11. Offer news and special offers (unless you opt out)
12. Other purposes with your consent

## Data Retention

We retain your Personal Data only as long as necessary for:

- Legal obligations
- Dispute resolution
- Policy enforcement

Usage Data is generally retained for shorter periods, except when needed for:

- Security enhancement
- Service improvement
- Legal requirements

## Data Transfer

Your information may be transferred to and maintained on computers located outside your jurisdiction. By using our Service, you consent to this transfer.

We ensure all transfers comply with adequate data protection measures.

## Data Disclosure

We may disclose personal information when:

1. Required by law enforcement
2. Involved in business transactions (mergers, acquisitions)
3. Necessary to protect our rights or others' safety

## Data Security

While we use commercially acceptable security measures, no method is 100% secure. We cannot guarantee absolute security.

## Your Rights

### GDPR Rights (EU/EEA Residents)
You have the right to:

1. Access, update, or delete your data
2. Request rectification of inaccurate data
3. Object to our processing of your data
4. Request processing restrictions
5. Request data portability
6. Withdraw consent

Contact us at: mazah.foodsavingapp@gmail.com

### California Privacy Rights
Under CalOPPA and CCPA, California residents can:

1. Request information about collected personal data
2. Delete personal information
3. Opt-out of data "sales"

## Service Providers

We may employ third-party companies to:

- Facilitate our Service
- Provide Service on our behalf
- Perform Service-related services
- Assist in Service analysis

These parties only access your data to perform these tasks.

## Analytics

We use third-party analytics providers including:

### Google Analytics
- Tracks and reports website traffic
- Privacy Policy: [https://policies.google.com/privacy](https://policies.google.com/privacy)

### Supabase
- Privacy Policy: [https://supabase.com/privacy](https://supabase.com/privacy)

## Advertising

We may use third-party advertising providers:

### Google AdSense
- Uses cookies to serve ads
- Opt-out: [http://www.google.com/ads/preferences/](http://www.google.com/ads/preferences/)

## Payments

For paid services, we use PCI-DSS compliant processors:

### PayPal/Braintree
- Privacy Policy: [https://www.paypal.com/webapps/mpp/ua/privacy-full](https://www.paypal.com/webapps/mpp/ua/privacy-full)

## Children's Privacy

Our Service is not intended for children under 18. We do not knowingly collect data from children.

## Policy Changes

We may update this Privacy Policy. We will notify you of changes by:

- Posting the new policy on this page
- Sending email notifications
- Displaying prominent Service notices

## Contact Us

For questions about this Privacy Policy:

Email: mazah.foodsavingapp@gmail.com
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
