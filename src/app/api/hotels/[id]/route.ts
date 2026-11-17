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

    // Check if hotel exists
    const auth1 = requireUser(request);
    if ('error' in auth1) return auth1.error;
    // Only the owner of the trip can change or remove its places
    const existingHotel = await prisma.hotel.findFirst({
      where: { id, city: { trip: { userId: auth1.userId } } }
    });

    if (!existingHotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Update the hotel
    const updatedHotel = await prisma.hotel.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingHotel.name,
        location: location !== undefined ? location : existingHotel.location,
        rating: rating !== undefined ? rating : existingHotel.rating,
        review: review !== undefined ? review : existingHotel.review,
        liked: liked !== undefined ? liked : existingHotel.liked
      }
    });

    return NextResponse.json(
      { message: 'Hotel updated successfully', hotel: updatedHotel },
      { status: 200 }
    );

  } catch (error) {
    console.error('Hotel update error:', error);
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

    // Check if hotel exists
    const auth2 = requireUser(request);
    if ('error' in auth2) return auth2.error;
    // Only the owner of the trip can change or remove its places
    const hotel = await prisma.hotel.findFirst({
      where: { id, city: { trip: { userId: auth2.userId } } }
    });

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found', hotelId: id },
        { status: 404 }
      );
    }

    // Delete the hotel
    await prisma.hotel.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Hotel deleted successfully', hotelId: id },
      { status: 200 }
    );

  } catch (error) {
    console.error('Hotel delete error:', error);
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

