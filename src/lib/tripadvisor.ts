/**
 * TripAdvisor API utility functions
 */

// TripAdvisor API Key - Make sure this is activated in the TripAdvisor Developer Portal
// The API key should be set in .env.local file as TRIPADVISOR_API_KEY
export const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY || '4BD8D2DC82B84E01965E1180DBADE6EC';

// Log API key status (only first 8 chars for security)
if (!process.env.TRIPADVISOR_API_KEY) {
  console.warn('⚠️  TRIPADVISOR_API_KEY not found in environment variables. Using fallback key.');
  console.warn('⚠️  Make sure .env.local exists and contains: TRIPADVISOR_API_KEY=your_key');
} else {
  console.log('✅ TripAdvisor API key loaded from environment:', TRIPADVISOR_API_KEY.substring(0, 8) + '...');
}
// Updated to use the correct Content API base URL from documentation
const TRIPADVISOR_BASE_URL = 'https://api.content.tripadvisor.com/api/v1';

export interface TripAdvisorLocation {
  location_id: string;
  name: string;
  address_obj?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalcode?: string;
  };
  rating?: string;
  num_reviews?: string;
  category?: {
    key: string;
    name: string;
  };
  phone?: string;
  website?: string;
  latitude?: string;
  longitude?: string;
  photo?: {
    images: {
      small?: { url: string; width: string; height: string };
      medium?: { url: string; width: string; height: string };
      large?: { url: string; width: string; height: string };
      original?: { url: string; width: string; height: string };
    };
  };
  // Additional fields that might help with filtering
  subcategory?: Array<{
    key: string;
    name: string;
  }>;
}

export interface TripAdvisorSearchResponse {
  data: TripAdvisorLocation[];
  paging?: {
    results: string;
    total_results: string;
  };
}

export interface TripAdvisorLocationDetails extends TripAdvisorLocation {
  description?: string;
  web_url?: string;
  write_review?: string;
  ancestors?: Array<{
    level: string;
    name: string;
    location_id: string;
  }>;
}

export interface TripAdvisorPhoto {
  images: {
    small?: { url: string; width: string; height: string };
    medium?: { url: string; width: string; height: string };
    large?: { url: string; width: string; height: string };
    original?: { url: string; width: string; height: string };
  };
  is_blessed: boolean;
  uploaded_date: string;
  caption: string;
  id: string;
  helpful_votes: string;
  published_date: string;
  user: {
    username: string;
  };
}

export interface TripAdvisorPhotosResponse {
  data: TripAdvisorPhoto[];
}

/**
 * Search for locations (hotels, restaurants, attractions) on TripAdvisor
 */
export async function searchTripAdvisor(
  query: string,
  category?: 'hotels' | 'restaurants' | 'attractions'
): Promise<TripAdvisorSearchResponse> {
  // TripAdvisor Content API uses 'searchQuery' parameter, not 'query'
  const params = new URLSearchParams({
    key: TRIPADVISOR_API_KEY,
    searchQuery: query,
    language: 'en',
  });

  const url = `${TRIPADVISOR_BASE_URL}/location/search?${params.toString()}`;

  try {
    console.log('TripAdvisor search URL:', url);
    console.log('Using API Key:', TRIPADVISOR_API_KEY.substring(0, 8) + '...');
    console.log('Environment:', {
      nodeEnv: process.env.NODE_ENV,
      hasEnvKey: !!process.env.TRIPADVISOR_API_KEY,
      usingFallback: !process.env.TRIPADVISOR_API_KEY
    });
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const responseText = await response.text();
    console.log('TripAdvisor API response status:', response.status);
    console.log('TripAdvisor API response headers:', Object.fromEntries(response.headers.entries()));
    console.log('TripAdvisor API response:', responseText.substring(0, 1000));
    
    // Parse the response (even if status is not OK, it might contain error info)
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // If response is not JSON, handle as regular error
      if (!response.ok) {
        throw new Error(`TripAdvisor API error: ${response.status} ${response.statusText} - ${responseText.substring(0, 200)}`);
      }
      throw new Error('Invalid JSON response from TripAdvisor API');
    }
    
    // Check if the response contains an error (even if status is 200)
    if (data.error || data.Message) {
      // Handle 403 Forbidden - API key not authorized
      if (response.status === 403 || data.Message?.includes('not authorized') || data.Message?.includes('explicit deny')) {
        console.error('TripAdvisor API: 403 Forbidden - API key not authorized');
        console.error('This means your API key needs to be activated in TripAdvisor Developer Portal');
        console.error('Go to: https://www.tripadvisor.com/developers');
        console.error('API Key:', TRIPADVISOR_API_KEY);
        // Return empty results instead of throwing to prevent 500 errors
        return {
          data: [],
          paging: {
            results: '0',
            total_results: '0'
          }
        };
      }
      
      // If it's a "not found" error, return empty results instead of throwing
      if (data.error?.code === '101' || data.error?.type === 'NotFoundException') {
        console.log('TripAdvisor API: No locations found for query:', query);
        return {
          data: [],
          paging: {
            results: '0',
            total_results: '0'
          }
        };
      }
      
      // For other errors, throw
      throw new Error(`TripAdvisor API error: ${data.error?.message || data.Message || JSON.stringify(data)}`);
    }
    
    // If response status is not OK and no error object, throw
    if (!response.ok) {
      // Handle 403 specifically
      if (response.status === 403) {
        console.error('TripAdvisor API: 403 Forbidden - API key not authorized');
        return {
          data: [],
          paging: {
            results: '0',
            total_results: '0'
          }
        };
      }
      throw new Error(`TripAdvisor API error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
    }
    
    // If data.data is empty or doesn't exist, return empty results
    if (!data.data || data.data.length === 0) {
      return {
        data: [],
        paging: {
          results: '0',
          total_results: '0'
        }
      };
    }
    
    // Filter by category if specified (client-side filtering)
    // TripAdvisor API doesn't support category parameter in search, so we filter results
    let filteredData = data.data;
    if (category) {
      filteredData = data.data.filter((location: TripAdvisorLocation) => {
        // Skip locations without category (like cities)
        if (!location.category) {
          // But if the name contains category-related keywords, include it
          const nameLower = location.name?.toLowerCase() || '';
          if (category === 'hotels') {
            return nameLower.includes('hotel') || 
                   nameLower.includes('resort') ||
                   nameLower.includes('lodge') ||
                   nameLower.includes('inn');
          } else if (category === 'restaurants') {
            return nameLower.includes('restaurant') || 
                   nameLower.includes('cafe') ||
                   nameLower.includes('bistro') ||
                   nameLower.includes('diner') ||
                   nameLower.includes('eatery') ||
                   nameLower.includes('food');
          } else if (category === 'attractions') {
            return nameLower.includes('museum') || 
                   nameLower.includes('park') ||
                   nameLower.includes('gallery') ||
                   nameLower.includes('monument') ||
                   nameLower.includes('landmark');
          }
          return false;
        }
        
        const categoryKey = location.category.key?.toLowerCase() || '';
        const categoryName = location.category.name?.toLowerCase() || '';
        const nameLower = location.name?.toLowerCase() || '';
        
        if (category === 'hotels') {
          return categoryKey.includes('hotel') || 
                 categoryKey.includes('lodging') ||
                 categoryKey.includes('accommodation') ||
                 categoryName.includes('hotel') ||
                 categoryName.includes('lodging') ||
                 categoryName.includes('accommodation') ||
                 nameLower.includes('hotel') ||
                 nameLower.includes('resort') ||
                 nameLower.includes('lodge');
        } else if (category === 'restaurants') {
          return categoryKey.includes('restaurant') || 
                 categoryKey.includes('dining') ||
                 categoryKey.includes('food') ||
                 categoryKey.includes('cafe') ||
                 categoryKey.includes('bistro') ||
                 categoryName.includes('restaurant') ||
                 categoryName.includes('dining') ||
                 categoryName.includes('food') ||
                 categoryName.includes('cafe') ||
                 categoryName.includes('bistro') ||
                 nameLower.includes('restaurant') ||
                 nameLower.includes('cafe') ||
                 nameLower.includes('bistro');
        } else if (category === 'attractions') {
          return categoryKey.includes('attraction') || 
                 categoryKey.includes('sight') ||
                 categoryName.includes('attraction') ||
                 categoryName.includes('sight') ||
                 categoryName.includes('landmark') ||
                 categoryName.includes('museum') ||
                 categoryName.includes('park');
        }
        return true;
      });
    }
    
    return {
      ...data,
      data: filteredData
    };
  } catch (error) {
    console.error('Error searching TripAdvisor:', error);
    
    // Handle timeout/abort errors
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        console.error('TripAdvisor API request timed out');
        throw new Error('TripAdvisor API request timed out. Please try again.');
      }
      
      // Handle network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        console.error('Network error connecting to TripAdvisor API');
        throw new Error('Network error connecting to TripAdvisor API. Please check your connection.');
      }
    }
    
    throw error;
  }
}

/**
 * Get detailed information about a specific location
 */
export async function getLocationDetails(locationId: string): Promise<TripAdvisorLocationDetails> {
  const params = new URLSearchParams({
    key: TRIPADVISOR_API_KEY,
    language: 'en',
  });

  const url = `${TRIPADVISOR_BASE_URL}/location/${locationId}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TripAdvisor API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching location details:', error);
    throw error;
  }
}

/**
 * Get photos for a specific location
 */
export async function getLocationPhotos(locationId: string): Promise<TripAdvisorPhotosResponse> {
  const params = new URLSearchParams({
    key: TRIPADVISOR_API_KEY,
    language: 'en',
  });

  const url = `${TRIPADVISOR_BASE_URL}/location/${locationId}/photos?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TripAdvisor API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching location photos:', error);
    throw error;
  }
}

