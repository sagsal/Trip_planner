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

    // Check if activity exists
    const existingActivity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Update the activity
    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingActivity.name,
        location: location !== undefined ? location : existingActivity.location,
        rating: rating !== undefined ? rating : existingActivity.rating,
        review: review !== undefined ? review : existingActivity.review,
        liked: liked !== undefined ? liked : existingActivity.liked
      }
    });

    return NextResponse.json(
      { message: 'Activity updated successfully', activity: updatedActivity },
      { status: 200 }
    );

  } catch (error) {
    console.error('Activity update error:', error);
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

    // Check if activity exists
    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Delete the activity
    await prisma.activity.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Activity deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Activity delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

