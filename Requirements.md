## 📄 Product Requirements Document (PRD)

**Product Name:** Mazah
**Platform:** iOS (and Android-ready via Expo)
**Frontend:** Expo React Native
**Backend:** Supabase
**Date:** June 17, 2025
**Version:** 1.1

---

### 1. **Overview**

#### 1.1. **Purpose**

Mazah is a mobile app designed to revolutionize household food waste reduction by combining inventory tracking, smart meal planning, local food sharing, and educational content into one simple and sustainable experience.

#### 1.2. **Problem Statement**

Millions of households discard edible food due to lack of visibility, planning, and urgency in food consumption. Food waste contributes to climate change, financial waste, and resource inefficiency.

#### 1.3. **Solution**

Mazah reduces food waste at the household level by helping users:

* Track what they have
* Cook what’s expiring
* Share what they don’t need
* Learn how to waste less

---

### 2. **Objectives & Goals**

* 🎯 Help users reduce food waste by 25%+ within 3 months
* 🧠 Increase awareness of expiration dates and food usage habits
* 🛠 Provide tools to organize food, plan meals, and save money
* 🌱 Create a community-driven sustainability ecosystem

---

### 3. **Target Audience**

* Young adults and families (18–45) in urban or suburban homes
* Budget-conscious shoppers
* Sustainability-focused users
* Roommates and students in shared living spaces

---

### 4. **Key Features & Requirements**

#### 4.1. **Food Inventory Tracker**

* OCR/barcode scanning to add items
* Manual entry with name, quantity, and expiration date
* Categorization by storage (fridge, pantry, freezer)

#### 4.2. **"Cook with What You Have"**

* Recipe suggestions based on inventory
* Filters for allergies, dietary restrictions
* Prioritize items expiring soon

#### 4.3. **Expiration Alerts**

* Push notifications (via Expo Notifications)
* Color-coded dashboard
* Optional calendar integration

#### 4.4. **Local Sharing Board**

* Post excess food with pickup instructions
* Browse nearby listings (MapView with Supabase Geo queries)
* Chat feature for coordination (via Supabase Realtime)

#### 4.5. **Meal Planner & Smart Shopping**

* Weekly meal calendar view
* Auto-generate grocery lists
* Identify what’s already in your pantry

#### 4.6. **Education + Gamification**

* Food storage tips, composting how-tos
* Waste facts and mini quizzes
* Badges, streaks, and savings tracker

---

### 5. **Tech Stack**

#### 5.1. **Frontend: Expo + React Native**

* Cross-platform support (iOS and Android)
* Managed workflow for ease of deployment
* UI libraries: React Native Paper or NativeWind for styling
* Navigation: React Navigation
* OCR/Barcode: `expo-camera`, `react-native-vision-camera`, or integration with MLKit

#### 5.2. **Backend: Supabase**

* Database: PostgreSQL
* Auth: Supabase Auth (Email, Social Logins)
* Realtime updates: Supabase Realtime
* File storage: Supabase Storage (images, receipts)
* Edge functions: Food expiration logic, custom API endpoints

#### 5.3. **Other Integrations**

* Map & Geolocation: Mapbox or Expo Location
* Recipe API (external): Spoonacular API (or own dataset)
* Push Notifications: Expo Notifications API

---

### 6. **Non-Functional Requirements**

* ⏱ <300ms latency for key interactions
* 🔒 Secure data storage and communication (SSL, role-based access)
* 🛠 Scalable backend via Supabase Edge Functions
* 🌐 Offline-first experience for inventory and recipes
* ♿ Accessibility via screen reader support and large text modes

---

### 7. **User Flows (Simplified)**

#### a. **Add Food**

→ Tap "+" → Scan or type item → Auto-suggest shelf life → Save to list

#### b. **Get Recipe**

→ Tap "Cook" → View suggested recipes → Filter → Save/cook/share

#### c. **Share Food**

→ Tap "Share" → Add listing → Add pickup instructions → Post to board

#### d. **Plan Week**

→ Tap "Plan" → Add meals → Auto-check against pantry → Generate shopping list

---

### 8. **Success Metrics**

* 👥 10k users in 6 months
* 🧾 Average 20 food items tracked per user
* 🍽 10 recipe interactions/week per user
* 🌍 25% average reduction in self-reported food waste
* ⭐ 4.5+ App Store rating

---

### 9. **Open Questions & Risks**

* Will users be comfortable inputting food data regularly?
* How do we handle misinformation or abuse in the sharing board?
* Should we support AI-driven shopping predictions from Supabase Edge Functions?
* How to handle expired food responsibly in shared listings?

