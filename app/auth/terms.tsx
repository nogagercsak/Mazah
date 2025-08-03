import React from 'react';
import { ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';

const termsMarkdown = `
# TERMS OF SERVICE

**Last Updated:** August 3rd, 2025

## 1. Introduction

Welcome to **Mazah** ("Company", "we", "our", "us")! 

These Terms of Service ("Terms") govern your use of our mobile application Mazah: Food Waste Fighting App. Please read these Terms carefully before using our Service.

By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part, you may not access the Service.

**Contact us at:** mazahfoodsavingapp@gmail.com if you have any questions.

## 2. Communications

By creating an account, you agree to receive:

- Newsletters
- Marketing materials
- Promotional content
- Service-related communications

You may opt-out at any time via the unsubscribe link or by emailing us.

## 3. Contests and Promotions

Any promotions ("Promotions") available through the Service may have separate rules. In case of conflict between Promotion rules and these Terms, the Promotion rules will prevail.

## 4. Subscription Fees

Mazah reserves the right to:

- Modify subscription fees at any time
- Provide reasonable notice before changes take effect
- Implement changes at the end of current billing cycles

Continued use after changes constitutes agreement to new fees.

## 5. Refunds

Refunds are issued within zero (0) days of original purchase.

## 6. Content

All Service content is property of Mazah or used with permission. You may not:

- Distribute
- Modify 
- Transmit
- Reuse
- Repost
- Copy 

...any content without our express written permission.

## 7. Prohibited Uses

You agree not to use the Service to:

1. Violate any applicable laws
2. Exploit or harm minors
3. Send unsolicited promotional materials
4. Impersonate others
5. Infringe on others' rights
6. Engage in illegal or harmful activities

Additionally, you must not:

1. Disable or impair Service functionality
2. Use automated systems to access Service
3. Monitor or copy Service content without permission
4. Introduce viruses or malicious software
5. Attempt unauthorized access
6. Launch denial-of-service attacks
7. Falsify Company ratings
8. Otherwise interfere with Service operations

## 8. Analytics

We use third-party analytics providers:

### Google Analytics
- Tracks and reports website traffic
- Privacy Policy: [https://policies.google.com/privacy](https://policies.google.com/privacy)

### Supabase
- Provides backend services including:
  - Authentication
  - Database management
  - Real-time data
- May collect user metadata for:
  - Performance monitoring
  - Security purposes
- Privacy Policy: [https://supabase.com/privacy](https://supabase.com/privacy)

## 9. Age Restrictions

Service is for users **18 years or older**. By using the Service, you represent that you:

- Are at least 18 years old
- Have full legal capacity
- Can enter into binding agreements

## 10. Accounts

When creating an account, you guarantee:

1. You are over 18
2. Information provided is accurate and current
3. You'll maintain account security
4. You'll notify us of any unauthorized access

We reserve the right to:

- Refuse service
- Terminate accounts
- Remove content
- Cancel orders

...at our sole discretion.

## 11. Intellectual Property

The Service and its original content are:

- Exclusive property of Mazah
- Protected by copyright/trademark laws
- Not to be used without written consent

## 12. Feedback

You may provide feedback about:

- Errors
- Improvements
- Problems
- Other Service-related matters

By submitting feedback, you acknowledge:

1. You retain no rights to the feedback
2. We may have similar ideas
3. Feedback isn't confidential
4. We have no confidentiality obligations

## 13. Third-Party Links

Our Service may contain links to third-party sites. We:

- Have no control over these sites
- Assume no responsibility for their content
- Do not endorse their offerings

Use third-party sites at your own risk.

## 14. Termination

We may terminate or suspend your account:

- Without prior notice
- For any reason
- At our sole discretion

You may terminate by discontinuing Service use.

## 15. Governing Law

These Terms are governed by New York state law, without regard to conflict of law provisions.

## 16. Service Changes

We reserve the right to:

- Withdraw or amend the Service
- Restrict access
- Make unavailable at any time

...without liability.

## 17. Terms Amendments

We may amend these Terms by:

- Posting revised terms
- Making changes effective immediately

Your continued use constitutes acceptance.

## 18. Waiver and Severability

- No waiver of terms is permanent
- Invalid provisions will be modified minimally
- Remaining terms remain in full effect

## 19. Acknowledgement

BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ AND AGREE TO THESE TERMS.

## 20. Contact Us

For questions or support:

Email: mazahfoodsavingapp@gmail.com
`;

export default function TermsScreen() {
  return (
    <ScrollView style={{ padding: 20, backgroundColor: '#fff' }}>
      <Markdown
        style={{
          heading1: { 
            fontSize: 24, 
            fontWeight: 'bold', 
            marginBottom: 16,
            color: '#2c3e50',
            marginTop: 8
          },
          heading2: { 
            fontSize: 20, 
            fontWeight: 'bold', 
            marginBottom: 12,
            color: '#34495e',
            marginTop: 16
          },
          heading3: {
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 8,
            color: '#3d566e',
            marginTop: 12
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
          },
          blockquote: {
            backgroundColor: '#f8f9fa',
            padding: 10,
            borderLeftWidth: 3,
            borderLeftColor: '#2980b9',
            marginBottom: 10
          }
        }}
      >
        {termsMarkdown}
      </Markdown>
    </ScrollView>
  );
}

// New change - Sun Aug  3 18:56:27 CEST 2025
