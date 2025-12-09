import { NextRequest, NextResponse } from 'next/server';
import { searchTripAdvisor } from '@/lib/tripadvisor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testQuery = searchParams.get('query') || 'Hilton';

    console.log('Testing TripAdvisor API with query:', testQuery);
    console.log('API Key being used:', process.env.TRIPADVISOR_API_KEY || '4BD8D2DC82B84E01965E1180DBADE6EC');

    // Test the API with a simple query
    const result = await searchTripAdvisor(testQuery);
    
    console.log('Search result:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      message: 'TripAdvisor API is working!',
      testQuery,
      resultsCount: result.data?.length || 0,
      hasResults: result.data && result.data.length > 0,
      sampleResult: result.data?.[0] || null,
      fullResponse: result
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('TripAdvisor API test failed:', error);

    return NextResponse.json({
      success: false,
      message: 'TripAdvisor API test failed',
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      troubleshooting: {
        step1: 'Check if your API key is activated in TripAdvisor Developer Portal',
        step2: 'Verify the API key has access to Content API',
        step3: 'Check server console logs for detailed error messages',
        portal: 'https://www.tripadvisor.com/developers'
      }
    }, { status: 500 });
  }
}

