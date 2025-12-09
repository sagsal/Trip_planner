import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, location, rating, review, liked } = body;

    // Check if hotel exists
    const existingHotel = await prisma.hotel.findUnique({
      where: { id }
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
    
    console.log('DELETE /api/hotels/[id] - Hotel ID:', id);

    // Check if hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id }
    });

    if (!hotel) {
      console.log('Hotel not found:', id);
      return NextResponse.json(
        { error: 'Hotel not found', hotelId: id },
        { status: 404 }
      );
    }

    console.log('Deleting hotel:', hotel.name, 'ID:', id);

    // Delete the hotel
    await prisma.hotel.delete({
      where: { id }
    });

    console.log('Hotel deleted successfully:', id);

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

