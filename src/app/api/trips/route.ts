import { NextRequest, NextResponse } from 'next/server';

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
  }
];

export async function POST(request: NextRequest) {
  try {
    const { title, description, startDate, endDate, countries, cities, hotels, restaurants, activities } = await request.json();

    // Validate required fields
    if (!title || !startDate || !endDate || !countries || !cities) {
      return NextResponse.json(
        { error: 'Title, start date, end date, countries, and cities are required' },
        { status: 400 }
      );
    }

    // Create a mock trip (in a real app, this would be saved to database)
    const newTrip = {
      id: Date.now().toString(),
      title,
      description: description || null,
      startDate,
      endDate,
      countries: JSON.stringify(countries),
      cities: JSON.stringify(cities),
      isPublic: true,
      createdAt: new Date().toISOString(),
      hotels: hotels || [],
      restaurants: restaurants || [],
      activities: activities || [],
      user: {
        id: 'mock-user-id',
        name: 'Current User',
        email: 'user@example.com'
      }
    };

    // Add to mock data
    mockTrips.unshift(newTrip);

    return NextResponse.json(
      { 
        message: 'Trip created successfully',
        trip: newTrip
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Trip creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Return mock data
    const trips = mockTrips.slice(skip, skip + limit);
    const total = mockTrips.length;

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
