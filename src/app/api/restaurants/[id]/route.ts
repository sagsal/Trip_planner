import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, location, rating, review, liked } = body;

    // Check if restaurant exists
    const auth1 = requireUser(request);
    if ('error' in auth1) return auth1.error;
    // Only the owner of the trip can change or remove its places
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: { id, city: { trip: { userId: auth1.userId } } }
    });

    if (!existingRestaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Update the restaurant
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingRestaurant.name,
        location: location !== undefined ? location : existingRestaurant.location,
        rating: rating !== undefined ? rating : existingRestaurant.rating,
        review: review !== undefined ? review : existingRestaurant.review,
        liked: liked !== undefined ? liked : existingRestaurant.liked
      }
    });

    return NextResponse.json(
      { message: 'Restaurant updated successfully', restaurant: updatedRestaurant },
      { status: 200 }
    );

  } catch (error) {
    console.error('Restaurant update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if restaurant exists
    const auth2 = requireUser(request);
    if ('error' in auth2) return auth2.error;
    // Only the owner of the trip can change or remove its places
    const restaurant = await prisma.restaurant.findFirst({
      where: { id, city: { trip: { userId: auth2.userId } } }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Delete the restaurant
    await prisma.restaurant.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Restaurant deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Restaurant delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

