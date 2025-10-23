# TripPlanner - Your Journey, Your Story, Your Memories

A beautiful Next.js application for planning, sharing, and discovering amazing travel experiences. Create detailed trip journals with hotels, restaurants, and activities reviews.

## Features

### 🏖️ Beautiful Landing Page
- Animated sea background with moving waves
- Modern, responsive design
- Smooth animations and transitions
- Call-to-action buttons for easy navigation

### 👤 User Authentication
- **Registration**: Simple sign-up process with email and password
- **Login**: Secure authentication system
- **My Account**: Personal dashboard to view and manage trips

### 🗺️ Trip Management
- **Add Trips**: Comprehensive trip creation with:
  - Basic trip information (title, description, dates)
  - Multiple countries and cities support
  - Hotel reviews with ratings and experiences
  - Restaurant reviews with ratings and experiences
  - Activity reviews with ratings and experiences
- **View Trips**: Detailed trip pages with all information
- **Public Sharing**: All trips are public by default for community discovery

### 🔍 Discovery Features
- **Browse All Trips**: View trips from all users
- **Search & Filter**: Find trips by title, description, countries, or cities
- **Country Filter**: Filter trips by specific countries
- **Detailed Views**: Full trip details with all reviews and ratings

## Technology Stack

- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database**: SQLite with Prisma ORM
- **Authentication**: Custom implementation with bcrypt

## Getting Started

### Prerequisites
- Node.js 18+ (Note: Next.js 16 requires Node.js 20+, but the app will work with warnings on Node.js 18)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Trip_Planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── register/route.ts
│   │   └── trips/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── account/page.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── trips/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── Navigation.tsx
└── generated/
    └── prisma/
```

## Database Schema

The application uses the following main entities:

- **User**: User accounts with authentication
- **Trip**: Travel experiences with metadata
- **Hotel**: Hotel reviews and ratings
- **Restaurant**: Restaurant reviews and ratings
- **Activity**: Activity reviews and ratings

## Key Features Explained

### Animated Sea Background
The landing page features a beautiful animated sea background created with:
- SVG wave animations
- CSS gradients for depth
- Floating elements with staggered animations
- Responsive design that works on all devices

### Trip Creation Flow
1. **Basic Information**: Title, description, travel dates
2. **Destinations**: Add multiple countries and cities
3. **Hotels**: Add hotel reviews with ratings and experiences
4. **Restaurants**: Add restaurant reviews with ratings and experiences
5. **Activities**: Add activity reviews with ratings and experiences

### Review System
Each hotel, restaurant, and activity includes:
- **Star Rating**: 1-5 star rating system
- **Written Review**: Detailed text review
- **Experience Rating**: Loved it / Not great / Neutral
- **Location**: Where the place/activity is located

## Future Enhancements

The application is designed to be easily extensible. Potential future features include:

- **Google Places API Integration**: For automatic place suggestions
- **Image Uploads**: Add photos to trips and reviews
- **Social Features**: Follow other travelers, like trips
- **Trip Planning**: Build itineraries before traveling
- **Maps Integration**: Visual trip mapping
- **Advanced Search**: Filter by ratings, dates, etc.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.

---

**Happy Traveling! 🌍✈️**