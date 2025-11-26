// API utility functions with retry mechanism and better error handling

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export async function apiCall<T>(
  url: string, 
  options: RequestInit = {},
  retries: number = 3,
  timeout: number = 15000 // 15 second default timeout
): Promise<ApiResponse<T>> {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...options.headers,
    },
    ...options,
  };

  // Use relative URLs for better compatibility with Next.js routing
  // This ensures requests stay within the same origin and avoid ERR_NETWORK_CHANGED errors
  // Absolute URLs (starting with http) are used as-is for external APIs
  const fetchUrl = url;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      let response;
      try {
        response = await fetch(fetchUrl, {
          ...defaultOptions,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw fetchError;
      }
      
      if (response.ok) {
        const data = await response.json();
        return { data, status: response.status };
      } else {
        console.error(`API call failed (attempt ${attempt}):`, response.status, response.statusText);
        
        if (attempt === retries) {
          return { 
            error: `Request failed: ${response.status} ${response.statusText}`, 
            status: response.status 
          };
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    } catch (error) {
      console.error(`API call error (attempt ${attempt}):`, error);
      
      if (attempt === retries) {
        if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('ERR_NETWORK_CHANGED'))) {
          return { 
            error: 'Network error. Please check your connection and try again.', 
            status: 0 
          };
        }
        if (error instanceof Error && error.message === 'Request timeout') {
          return { 
            error: 'Request timeout. Please try again.', 
            status: 0 
          };
        }
        return { 
          error: 'An unexpected error occurred. Please try again.', 
          status: 0 
        };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return { error: 'Max retries exceeded', status: 0 };
}

// Specific API functions
export async function fetchTrips() {
  return apiCall<{ trips: any[] }>('/api/trips');
}

export async function fetchTrip(id: string) {
  // Increase timeout for trip fetching as it may include large amounts of data
  return apiCall<any>(`/api/trips/${id}`, {}, 3, 30000); // 30 second timeout to match server maxDuration
}

export async function createTrip(tripData: any) {
  return apiCall<any>('/api/trips', {
    method: 'POST',
    body: JSON.stringify(tripData),
  });
}

export async function updateTrip(id: string, tripData: any) {
  return apiCall<any>(`/api/trips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tripData),
  });
}
