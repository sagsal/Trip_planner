// API utility functions with retry mechanism and better error handling

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export async function apiCall<T>(
  url: string, 
  options: RequestInit = {},
  retries: number = 3
): Promise<ApiResponse<T>> {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add cache-busting parameter
  const urlWithCacheBust = url.includes('?') 
    ? `${url}&t=${Date.now()}` 
    : `${url}?t=${Date.now()}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`API call attempt ${attempt}: ${urlWithCacheBust}`);
      
      const response = await fetch(urlWithCacheBust, defaultOptions);
      
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
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          return { 
            error: 'Network error. Please check your connection and try again.', 
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
  return apiCall<any>(`/api/trips/${id}`);
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
