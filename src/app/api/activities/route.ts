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
            activities: {
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
        activities: []
      });
    }

    const cityData = databaseTrip.cities_data[0];
    const activities = cityData.activities || [];

    return NextResponse.json({
      activities: activities.map(activity => ({
        id: activity.id,
        name: activity.name,
        location: activity.location,
        rating: activity.rating,
        review: activity.review,
        liked: activity.liked
      }))
    });

  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

