import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Set route runtime config to ensure proper timeout handling
export const maxDuration = 30; // 30 seconds max

// Mock data for now - we'll replace this with Prisma later
const mockTrips = [
  {
    id: '1',
    title: 'Singapore Adventure',
    description: 'Amazing trip to Singapore with family',
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: '2024-01-22T00:00:00.000Z',
    countries: '["Singapore"]',
    cities: '["Singapore"]',
    isPublic: true,
    createdAt: '2024-01-10T00:00:00.000Z',
    hotels: [
      { id: '1', name: 'Marina Bay Sands', location: 'Singapore', rating: 5, review: 'Amazing views and great service!', liked: true },
      { id: '2', name: 'Raffles Hotel', location: 'Singapore', rating: 4, review: 'Classic luxury hotel with great history', liked: true }
    ],
    restaurants: [
      { id: '1', name: 'Hawker Center', location: 'Singapore', rating: 5, review: 'Authentic local food at great prices', liked: true },
      { id: '2', name: 'Din Tai Fung', location: 'Singapore', rating: 4, review: 'Excellent dumplings and noodles', liked: true }
    ],
    activities: [
      { id: '1', name: 'Gardens by the Bay', location: 'Singapore', rating: 5, review: 'Beautiful gardens with amazing light show', liked: true },
      { id: '2', name: 'Universal Studios', location: 'Singapore', rating: 4, review: 'Fun theme park with great rides', liked: true }
    ],
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  {
    id: '2',
    title: 'Tokyo Exploration',
    description: 'First time visiting Japan - incredible experience!',
    startDate: '2024-02-10T00:00:00.000Z',
    endDate: '2024-02-17T00:00:00.000Z',
    countries: '["Japan"]',
    cities: '["Tokyo"]',
    isPublic: true,
    createdAt: '2024-02-05T00:00:00.000Z',
    hotels: [
      { id: '3', name: 'Park Hyatt Tokyo', location: 'Tokyo', rating: 5, review: 'Luxury hotel with amazing city views', liked: true }
    ],
    restaurants: [
      { id: '3', name: 'Sushi Dai', location: 'Tokyo', rating: 5, review: 'Best sushi I have ever had!', liked: true },
      { id: '4', name: 'Ramen Nagi', location: 'Tokyo', rating: 4, review: 'Authentic ramen experience', liked: true }
    ],
    activities: [
      { id: '3', name: 'Senso-ji Temple', location: 'Tokyo', rating: 5, review: 'Beautiful traditional temple', liked: true },
      { id: '4', name: 'Shibuya Crossing', location: 'Tokyo', rating: 4, review: 'Iconic busy intersection', liked: true }
    ],
    user: {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com'
    }
  },
  {
    id: '3',
    title: 'Parisian Romance',
    description: 'A magical week in the City of Light with my partner',
    startDate: '2024-03-05T00:00:00.000Z',
    endDate: '2024-03-12T00:00:00.000Z',
    countries: '["France"]',
    cities: '["Paris"]',
    isPublic: true,
    createdAt: '2024-02-28T00:00:00.000Z',
    hotels: [
      { id: '5', name: 'Hotel Ritz Paris', location: 'Paris', rating: 5, review: 'Absolutely luxurious and perfectly located', liked: true },
      { id: '6', name: 'Le Meurice', location: 'Paris', rating: 4, review: 'Beautiful hotel with excellent service', liked: true }
    ],
    restaurants: [
      { id: '5', name: 'L\'Ambroisie', location: 'Paris', rating: 5, review: 'Michelin-starred dining at its finest', liked: true },
      { id: '6', name: 'Café de Flore', location: 'Paris', rating: 4, review: 'Classic Parisian café experience', liked: true }
    ],
    activities: [
      { id: '5', name: 'Eiffel Tower', location: 'Paris', rating: 5, review: 'Iconic landmark with breathtaking views', liked: true },
      { id: '6', name: 'Louvre Museum', location: 'Paris', rating: 5, review: 'World-class art collection', liked: true }
    ],
    user: {
      id: '3',
      name: 'Marie Dubois',
      email: 'marie@example.com'
    }
  },
  {
    id: '4',
    title: 'London Calling',
    description: 'Exploring the rich history and culture of London',
    startDate: '2024-04-15T00:00:00.000Z',
    endDate: '2024-04-22T00:00:00.000Z',
    countries: '["United Kingdom"]',
    cities: '["London"]',
    isPublic: true,
    createdAt: '2024-04-10T00:00:00.000Z',
    hotels: [
      { id: '7', name: 'The Savoy', location: 'London', rating: 5, review: 'Historic luxury hotel with amazing Thames views', liked: true },
      { id: '8', name: 'Claridge\'s', location: 'London', rating: 4, review: 'Elegant and sophisticated', liked: true }
    ],
    restaurants: [
      { id: '7', name: 'Dishoom', location: 'London', rating: 5, review: 'Amazing Indian cuisine with great atmosphere', liked: true },
      { id: '8', name: 'The Wolseley', location: 'London', rating: 4, review: 'Classic British dining experience', liked: true }
    ],
    activities: [
      { id: '7', name: 'British Museum', location: 'London', rating: 5, review: 'Incredible collection of world artifacts', liked: true },
      { id: '8', name: 'Tower Bridge', location: 'London', rating: 4, review: 'Beautiful architecture and great views', liked: true }
    ],
    user: {
      id: '4',
      name: 'James Wilson',
      email: 'james@example.com'
    }
  },
  {
    id: '5',
    title: 'Barcelona Adventure',
    description: 'Discovering the vibrant culture and architecture of Barcelona',
    startDate: '2024-05-20T00:00:00.000Z',
    endDate: '2024-05-27T00:00:00.000Z',
    countries: '["Spain"]',
    cities: '["Barcelona"]',
    isPublic: true,
    createdAt: '2024-05-15T00:00:00.000Z',
    hotels: [
      { id: '9', name: 'Hotel Casa Fuster', location: 'Barcelona', rating: 5, review: 'Beautiful modernist hotel in perfect location', liked: true },
      { id: '10', name: 'El Palace Barcelona', location: 'Barcelona', rating: 4, review: 'Luxury with excellent service', liked: true }
    ],
    restaurants: [
      { id: '9', name: 'El Nacional', location: 'Barcelona', rating: 5, review: 'Amazing food hall with diverse options', liked: true },
      { id: '10', name: 'Tickets', location: 'Barcelona', rating: 5, review: 'Creative tapas and incredible experience', liked: true }
    ],
    activities: [
      { id: '9', name: 'Sagrada Familia', location: 'Barcelona', rating: 5, review: 'Gaudi\'s masterpiece is absolutely stunning', liked: true },
      { id: '10', name: 'Park Güell', location: 'Barcelona', rating: 4, review: 'Colorful and whimsical park with great views', liked: true }
    ],
    user: {
      id: '5',
      name: 'Carlos Rodriguez',
      email: 'carlos@example.com'
    }
  },
  {
    id: '6',
    title: 'Rome Eternal City',
    description: 'Walking through ancient history in the heart of Italy',
    startDate: '2024-06-10T00:00:00.000Z',
    endDate: '2024-06-17T00:00:00.000Z',
    countries: '["Italy"]',
    cities: '["Rome"]',
    isPublic: true,
    createdAt: '2024-06-05T00:00:00.000Z',
    hotels: [
      { id: '11', name: 'Hotel de Russie', location: 'Rome', rating: 5, review: 'Luxury hotel with beautiful garden', liked: true },
      { id: '12', name: 'The First Roma Arte', location: 'Rome', rating: 4, review: 'Modern hotel with great location', liked: true }
    ],
    restaurants: [
      { id: '11', name: 'Roscioli', location: 'Rome', rating: 5, review: 'Authentic Roman cuisine at its best', liked: true },
      { id: '12', name: 'Armando al Pantheon', location: 'Rome', rating: 4, review: 'Traditional trattoria near Pantheon', liked: true }
    ],
    activities: [
      { id: '11', name: 'Colosseum', location: 'Rome', rating: 5, review: 'Iconic ancient amphitheater, must-see', liked: true },
      { id: '12', name: 'Vatican Museums', location: 'Rome', rating: 5, review: 'Incredible art collection and Sistine Chapel', liked: true }
    ],
    user: {
      id: '6',
      name: 'Giulia Bianchi',
      email: 'giulia@example.com'
    }
  },
  {
    id: '7',
    title: 'Amsterdam Canals',
    description: 'Cycling through the beautiful canals and museums of Amsterdam',
    startDate: '2024-07-05T00:00:00.000Z',
    endDate: '2024-07-12T00:00:00.000Z',
    countries: '["Netherlands"]',
    cities: '["Amsterdam"]',
    isPublic: true,
    createdAt: '2024-06-30T00:00:00.000Z',
    hotels: [
      { id: '13', name: 'The Dylan Amsterdam', location: 'Amsterdam', rating: 5, review: 'Boutique hotel with canal views', liked: true },
      { id: '14', name: 'Hotel Pulitzer', location: 'Amsterdam', rating: 4, review: 'Unique hotel made of canal houses', liked: true }
    ],
    restaurants: [
      { id: '13', name: 'Restaurant de Kas', location: 'Amsterdam', rating: 5, review: 'Farm-to-table dining in greenhouse', liked: true },
      { id: '14', name: 'Café de Jaren', location: 'Amsterdam', rating: 4, review: 'Great canal-side dining', liked: true }
    ],
    activities: [
      { id: '13', name: 'Van Gogh Museum', location: 'Amsterdam', rating: 5, review: 'Amazing collection of Van Gogh\'s work', liked: true },
      { id: '14', name: 'Anne Frank House', location: 'Amsterdam', rating: 5, review: 'Moving and educational experience', liked: true }
    ],
    user: {
      id: '7',
      name: 'Pieter van der Berg',
      email: 'pieter@example.com'
    }
  },
  {
    id: '8',
    title: 'Sydney Harbor Views',
    description: 'Exploring the stunning harbor city of Sydney',
    startDate: '2024-08-15T00:00:00.000Z',
    endDate: '2024-08-22T00:00:00.000Z',
    countries: '["Australia"]',
    cities: '["Sydney"]',
    isPublic: true,
    createdAt: '2024-08-10T00:00:00.000Z',
    hotels: [
      { id: '15', name: 'Park Hyatt Sydney', location: 'Sydney', rating: 5, review: 'Perfect location with Opera House views', liked: true },
      { id: '16', name: 'The Langham Sydney', location: 'Sydney', rating: 4, review: 'Luxury hotel with excellent service', liked: true }
    ],
    restaurants: [
      { id: '15', name: 'Quay', location: 'Sydney', rating: 5, review: 'Fine dining with harbor views', liked: true },
      { id: '16', name: 'Bondi Beach Public Bar', location: 'Sydney', rating: 4, review: 'Great beachside dining', liked: true }
    ],
    activities: [
      { id: '15', name: 'Sydney Opera House', location: 'Sydney', rating: 5, review: 'Iconic architecture and great performances', liked: true },
      { id: '16', name: 'Bondi Beach', location: 'Sydney', rating: 4, review: 'Beautiful beach with great surf', liked: true }
    ],
    user: {
      id: '8',
      name: 'Sarah Thompson',
      email: 'sarah@example.com'
    }
  },
  {
    id: '9',
    title: 'Dubai Luxury',
    description: 'Experiencing the modern marvels of Dubai',
    startDate: '2024-09-10T00:00:00.000Z',
    endDate: '2024-09-17T00:00:00.000Z',
    countries: '["United Arab Emirates"]',
    cities: '["Dubai"]',
    isPublic: true,
    createdAt: '2024-09-05T00:00:00.000Z',
    hotels: [
      { id: '17', name: 'Burj Al Arab', location: 'Dubai', rating: 5, review: 'Iconic luxury hotel, truly spectacular', liked: true },
      { id: '18', name: 'Atlantis The Palm', location: 'Dubai', rating: 4, review: 'Amazing resort with great facilities', liked: true }
    ],
    restaurants: [
      { id: '17', name: 'Al Mahara', location: 'Dubai', rating: 5, review: 'Underwater dining experience', liked: true },
      { id: '18', name: 'Zuma Dubai', location: 'Dubai', rating: 4, review: 'Excellent Japanese cuisine', liked: true }
    ],
    activities: [
      { id: '17', name: 'Burj Khalifa', location: 'Dubai', rating: 5, review: 'Tallest building in the world, amazing views', liked: true },
      { id: '18', name: 'Dubai Mall', location: 'Dubai', rating: 4, review: 'Huge mall with great shopping and entertainment', liked: true }
    ],
    user: {
      id: '9',
      name: 'Ahmed Al-Rashid',
      email: 'ahmed@example.com'
    }
  },
  {
    id: '10',
    title: 'Bangkok Street Food',
    description: 'Discovering the vibrant street food scene of Bangkok',
    startDate: '2024-10-05T00:00:00.000Z',
    endDate: '2024-10-12T00:00:00.000Z',
    countries: '["Thailand"]',
    cities: '["Bangkok"]',
    isPublic: true,
    createdAt: '2024-09-30T00:00:00.000Z',
    hotels: [
      { id: '19', name: 'The Siam', location: 'Bangkok', rating: 5, review: 'Luxury riverside hotel with great service', liked: true },
      { id: '20', name: 'Mandarin Oriental Bangkok', location: 'Bangkok', rating: 4, review: 'Historic hotel with modern amenities', liked: true }
    ],
    restaurants: [
      { id: '19', name: 'Jay Fai', location: 'Bangkok', rating: 5, review: 'Michelin-starred street food, incredible', liked: true },
      { id: '20', name: 'Thip Samai', location: 'Bangkok', rating: 4, review: 'Best pad thai in Bangkok', liked: true }
    ],
    activities: [
      { id: '19', name: 'Grand Palace', location: 'Bangkok', rating: 5, review: 'Beautiful royal palace complex', liked: true },
      { id: '20', name: 'Chatuchak Weekend Market', location: 'Bangkok', rating: 4, review: 'Huge market with everything imaginable', liked: true }
    ],
    user: {
      id: '10',
      name: 'Niran Srisawat',
      email: 'niran@example.com'
    }
  },
  {
    id: '11',
    title: 'New York City Dreams',
    description: 'The city that never sleeps - exploring NYC',
    startDate: '2024-11-15T00:00:00.000Z',
    endDate: '2024-11-22T00:00:00.000Z',
    countries: '["United States"]',
    cities: '["New York"]',
    isPublic: true,
    createdAt: '2024-11-10T00:00:00.000Z',
    hotels: [
      { id: '21', name: 'The Plaza', location: 'New York', rating: 5, review: 'Iconic luxury hotel in perfect location', liked: true },
      { id: '22', name: 'The St. Regis New York', location: 'New York', rating: 4, review: 'Elegant hotel with excellent service', liked: true }
    ],
    restaurants: [
      { id: '21', name: 'Le Bernardin', location: 'New York', rating: 5, review: 'Exceptional seafood dining', liked: true },
      { id: '22', name: 'Katz\'s Delicatessen', location: 'New York', rating: 4, review: 'Classic NYC deli experience', liked: true }
    ],
    activities: [
      { id: '21', name: 'Central Park', location: 'New York', rating: 5, review: 'Beautiful park in the heart of the city', liked: true },
      { id: '22', name: 'Statue of Liberty', location: 'New York', rating: 4, review: 'Iconic symbol of freedom', liked: true }
    ],
    user: {
      id: '11',
      name: 'Michael Johnson',
      email: 'michael@example.com'
    }
  },
  {
    id: '12',
    title: 'Cape Town Safari',
    description: 'Wildlife and wine in beautiful South Africa',
    startDate: '2024-12-10T00:00:00.000Z',
    endDate: '2024-12-17T00:00:00.000Z',
    countries: '["South Africa"]',
    cities: '["Cape Town"]',
    isPublic: true,
    createdAt: '2024-12-05T00:00:00.000Z',
    hotels: [
      { id: '23', name: 'The Silo Hotel', location: 'Cape Town', rating: 5, review: 'Unique hotel with amazing harbor views', liked: true },
      { id: '24', name: 'One&Only Cape Town', location: 'Cape Town', rating: 4, review: 'Luxury resort with great facilities', liked: true }
    ],
    restaurants: [
      { id: '23', name: 'La Colombe', location: 'Cape Town', rating: 5, review: 'World-class fine dining experience', liked: true },
      { id: '24', name: 'Kloof Street House', location: 'Cape Town', rating: 4, review: 'Cozy restaurant with great atmosphere', liked: true }
    ],
    activities: [
      { id: '23', name: 'Table Mountain', location: 'Cape Town', rating: 5, review: 'Breathtaking views from the top', liked: true },
      { id: '24', name: 'Kirstenbosch Gardens', location: 'Cape Town', rating: 4, review: 'Beautiful botanical gardens', liked: true }
    ],
    user: {
      id: '12',
      name: 'Thabo Mthembu',
      email: 'thabo@example.com'
    }
  },
  {
    id: '13',
    title: 'Iceland Northern Lights',
    description: 'Chasing the aurora borealis in Iceland',
    startDate: '2024-01-20T00:00:00.000Z',
    endDate: '2024-01-27T00:00:00.000Z',
    countries: '["Iceland"]',
    cities: '["Reykjavik"]',
    isPublic: true,
    createdAt: '2024-01-15T00:00:00.000Z',
    hotels: [
      { id: '25', name: 'The Retreat at Blue Lagoon', location: 'Reykjavik', rating: 5, review: 'Luxury hotel with geothermal spa', liked: true },
      { id: '26', name: 'Hotel Borg', location: 'Reykjavik', rating: 4, review: 'Historic hotel in city center', liked: true }
    ],
    restaurants: [
      { id: '25', name: 'Dill Restaurant', location: 'Reykjavik', rating: 5, review: 'Michelin-starred Nordic cuisine', liked: true },
      { id: '26', name: 'Bæjarins Beztu Pylsur', location: 'Reykjavik', rating: 4, review: 'Famous hot dog stand', liked: true }
    ],
    activities: [
      { id: '25', name: 'Blue Lagoon', location: 'Reykjavik', rating: 5, review: 'Amazing geothermal spa experience', liked: true },
      { id: '26', name: 'Golden Circle Tour', location: 'Reykjavik', rating: 4, review: 'Beautiful waterfalls and geysers', liked: true }
    ],
    user: {
      id: '13',
      name: 'Erik Jonsson',
      email: 'erik@example.com'
    }
  }
];

export async function POST(request: NextRequest) {
  try {
    const { title, description, startDate, endDate, countries, cities, citiesData, userId, userName, userEmail, isDraft } = await request.json();

    // Validate required fields - drafts don't need dates
    if (!title || !countries) {
      return NextResponse.json(
        { error: 'Title and country are required' },
        { status: 400 }
      );
    }

    // For non-draft trips, dates are required
    if (!isDraft && (!startDate || !endDate)) {
      return NextResponse.json(
        { error: 'Start date and end date are required for shared trips' },
        { status: 400 }
      );
    }

    // Validate user data
    if (!userId || !userName || !userEmail) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Ensure user exists to satisfy FK constraint
    let userRecord = await prisma.user.findUnique({ where: { id: userId } });
    if (!userRecord) {
      userRecord = await prisma.user.findUnique({ where: { email: userEmail } });
    }
    if (!userRecord) {
      // Create a minimal user record if missing (for demo/local use)
      userRecord = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          password: 'placeholder'
        }
      });
    }

    // Log received data for debugging
    console.log('Received citiesData:', JSON.stringify(citiesData, null, 2));

    // Create trip in database with hierarchical structure
    // Handle both old structure (hotels/restaurants/activities arrays) and new structure (days array)
    const newTrip = await prisma.trip.create({
      data: {
        title,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        countries: JSON.stringify(countries),
        cities: cities ? JSON.stringify(cities) : JSON.stringify([]),
        isPublic: isDraft ? false : true, // Drafts are always private
        isDraft: isDraft || false,
        userId: userRecord.id,
        cities_data: {
          create: (citiesData || []).map((cityData: any) => {
            // Handle new structure with days array - flatten restaurants and activities from all days
            let hotels = cityData.hotels || [];
            let restaurants = cityData.restaurants || [];
            let activities = cityData.activities || [];

            // If we have days array, flatten restaurants and activities from all days
            if (cityData.days && Array.isArray(cityData.days)) {
              restaurants = [];
              activities = [];
              cityData.days.forEach((day: any) => {
                if (day.restaurants && Array.isArray(day.restaurants)) {
                  restaurants.push(...day.restaurants);
                }
                if (day.activities && Array.isArray(day.activities)) {
                  activities.push(...day.activities);
                }
              });
            }

            return {
              name: cityData.name,
              country: cityData.country,
              hotels: {
                create: hotels.map((hotel: any) => ({
                  name: hotel.name || '',
                  location: hotel.location || '',
                  rating: hotel.rating || null,
                  review: hotel.review || null,
                  liked: hotel.liked ?? null
                }))
              },
              restaurants: {
                create: restaurants.map((restaurant: any) => ({
                  name: restaurant.name || '',
                  location: restaurant.location || '',
                  rating: restaurant.rating || null,
                  review: restaurant.review || null,
                  liked: restaurant.liked ?? null
                }))
              },
              activities: {
                create: activities.map((activity: any) => ({
                  name: activity.name || '',
                  location: activity.location || '',
                  rating: activity.rating || null,
                  review: activity.review || null,
                  liked: activity.liked ?? null
                }))
              }
            };
          })
        }
      },
      include: {
        user: true,
        cities_data: {
          include: {
            hotels: true,
            restaurants: true,
            activities: true
          }
        }
      }
    });

    console.log('Trip created successfully:', newTrip.title, 'by user:', userName);

    return NextResponse.json(
      { 
        message: 'Trip created successfully',
        trip: newTrip
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Trip creation error:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      // Log Prisma errors in detail
      if (error.message.includes('Prisma') || error.message.includes('prisma')) {
        console.error('Prisma error detected:', error);
      }
    }
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: errorMessage,
        message: process.env.NODE_ENV === 'development' ? errorMessage : 'Failed to create trip. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const drafts = searchParams.get('drafts') === 'true';
    const publicOnly = searchParams.get('public') === 'true';
    const userId = searchParams.get('userId');

    // Build where clause
    let where: any = {};
    
    if (drafts) {
      // Get user's draft trips
      where.isDraft = true;
      if (userId) {
        where.userId = userId;
      }
    } else if (publicOnly) {
      // Get only public shared trips (not drafts)
      where.isPublic = true;
      where.isDraft = false;
    } else {
      // Default: public trips only
      where.isPublic = true;
      where.isDraft = false;
    }

    // Fetch trips from database
    const trips = await prisma.trip.findMany({
      where,
      include: {
        user: true,
        cities_data: {
          include: {
            hotels: true,
            restaurants: true,
            activities: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.trip.count({ where });

    return NextResponse.json({
      trips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Trips fetch error:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      // Log Prisma errors in detail
      if (error.message.includes('Prisma') || error.message.includes('prisma')) {
        console.error('Prisma error detected:', error);
      }
    }
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
