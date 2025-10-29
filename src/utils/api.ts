// API utility functions with retry mechanism and better error handling

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Get the base URL for API calls
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: force localhost for development to prevent tripshare.org issues
    const currentOrigin = window.location.origin;
    if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
      return 'http://localhost:3003'; // Use current port
    }
    return currentOrigin;
  }
  // Server-side: use localhost for development
  return 'http://localhost:3003';
}

export async function apiCall<T>(
  url: string, 
  options: RequestInit = {},
  retries: number = 3
): Promise<ApiResponse<T>> {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    },
    ...options,
  };

  // Ensure we have an absolute URL
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Add aggressive cache-busting parameters
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const urlWithCacheBust = fullUrl.includes('?') 
    ? `${fullUrl}&t=${timestamp}&cb=${random}&v=2&nocache=true` 
    : `${fullUrl}?t=${timestamp}&cb=${random}&v=2&nocache=true`;

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
