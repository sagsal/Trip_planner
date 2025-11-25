import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!city || !country) {
      return NextResponse.json(
        { error: 'City and country parameters are required' },
        { status: 400 }
      );
    }

    // Find the database trip
    const databaseTrip = await prisma.trip.findFirst({
      where: {
        title: {
          contains: 'DATABASE: Global'
        }
      },
      include: {
        cities_data: {
          where: {
            name: {
              equals: city,
              mode: 'insensitive'
            },
            country: {
              equals: country,
              mode: 'insensitive'
            }
          },
          include: {
            restaurants: {
              orderBy: [
                { rating: 'desc' },
                { name: 'asc' }
              ],
              take: limit
            }
          }
        }
      }
    });

    if (!databaseTrip || !databaseTrip.cities_data || databaseTrip.cities_data.length === 0) {
      return NextResponse.json({
        restaurants: []
      });
    }

    const cityData = databaseTrip.cities_data[0];
    const restaurants = cityData.restaurants || [];

    return NextResponse.json({
      restaurants: restaurants.map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        location: restaurant.location,
        rating: restaurant.rating,
        review: restaurant.review,
        liked: restaurant.liked
      }))
    });

  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}

