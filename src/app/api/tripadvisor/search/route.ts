import { NextRequest, NextResponse } from 'next/server';
import { searchTripAdvisor, getLocationDetails, getLocationPhotos } from '@/lib/tripadvisor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const category = searchParams.get('category') as 'hotels' | 'restaurants' | 'attractions' | null;
    const locationId = searchParams.get('locationId');
    const getPhotos = searchParams.get('photos') === 'true';

    if (!query && !locationId) {
      return NextResponse.json(
        { error: 'Query or locationId parameter is required' },
        { status: 400 }
      );
    }

    // If locationId is provided, get details and optionally photos
    if (locationId) {
      const [details, photosData] = await Promise.all([
        getLocationDetails(locationId),
        getPhotos ? getLocationPhotos(locationId) : Promise.resolve(null)
      ]);

      return NextResponse.json({
        location: details,
        photos: photosData?.data || []
      });
    }

    // Otherwise, perform a search
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required for search' },
        { status: 400 }
      );
    }

    let searchResults;
    try {
      console.log('Searching TripAdvisor with query:', query, 'category:', category);
      searchResults = await searchTripAdvisor(query, category || undefined);
      console.log('Search results received:', searchResults.data?.length || 0, 'results');
    } catch (error) {
      // Log the full error for debugging
      console.error('TripAdvisor search error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error message:', errorMessage);
      
      // If search fails, check if it's a "not found" error - return empty results
      if (errorMessage.includes('NotFoundException') || errorMessage.includes('code') && errorMessage.includes('101')) {
        console.log('No results found for query');
        return NextResponse.json({
          results: [],
          total: 0
        });
      }
      
      // For 403 errors, return empty results with a helpful message
      if (errorMessage.includes('403') || errorMessage.includes('not authorized') || errorMessage.includes('Forbidden')) {
        console.error('API key authorization issue');
        return NextResponse.json({
          results: [],
          total: 0,
          error: 'API key not authorized. Please check your TripAdvisor API key settings.'
        });
      }
      
      // Re-throw other errors
      throw error;
    }

    // Check if we have any results
    if (!searchResults.data || searchResults.data.length === 0) {
      return NextResponse.json({
        results: [],
        total: 0
      });
    }

    // For each result, get photos if available (limit to first 10 to avoid too many API calls)
    const resultsWithPhotos = await Promise.all(
      searchResults.data.slice(0, 10).map(async (location) => {
        try {
          const photosData = await getLocationPhotos(location.location_id);
          return {
            ...location,
            photos: photosData?.data?.slice(0, 5) || [] // Limit to 5 photos per location
          };
        } catch (error) {
          console.error(`Error fetching photos for ${location.location_id}:`, error);
          return {
            ...location,
            photos: []
          };
        }
      })
    );

    const responseData = {
      results: resultsWithPhotos,
      total: searchResults.paging?.total_results || resultsWithPhotos.length
    };
    
    console.log('Sending response with', resultsWithPhotos.length, 'results');
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('TripAdvisor API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    
    return NextResponse.json(
      { 
        error: 'Failed to search TripAdvisor',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

