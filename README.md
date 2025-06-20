# Mazah

A mobile app designed to revolutionize household food waste reduction by combining inventory tracking, smart meal planning, local food sharing, and educational content into one simple and sustainable experience.

## Features

- Food Inventory Tracker
- "Cook with What You Have" Recipe Suggestions
- Expiration Alerts
- Local Food Sharing Board
- Meal Planner & Smart Shopping
- Education + Gamification

## Tech Stack

- Frontend: Expo + React Native
- Backend: Supabase
- Database: PostgreSQL
- Authentication: Supabase Auth
- Real-time Updates: Supabase Realtime

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Supabase Account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/mazah.git
   cd mazah
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   ```bash
   cp env.example .env
   ```
   Then edit `.env` with your Supabase credentials.

4. Start the development server
   ```bash
   npm start
   # or
   yarn start
   ```

5. Open the app in your simulator or device using Expo Go

## Development

- `npm start` - starts the development server
- `npm run ios` - runs the app on iOS simulator
- `npm run android` - runs the app on Android simulator
- `npm run web` - runs the app in your browser
- `npm run lint` - runs the linter

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
