/**
 * TripAdvisor Reviews API - Compliant Implementation
 * 
 * IMPORTANT: Review content must NEVER appear in HTML/JavaScript source code.
 * Reviews must be loaded dynamically via API calls that are blocked in robots.txt
 * 
 * This function loads reviews client-side only, never server-side rendered.
 */

import { TRIPADVISOR_API_KEY } from './tripadvisor';

// Use the same base URL as the main TripAdvisor API
const TRIPADVISOR_BASE_URL = 'https://api.content.tripadvisor.com/api/v1';

export interface TripAdvisorReview {
  id: string;
  rating: string;
  published_date: string;
  text: string;
  user: {
    username: string;
  };
  title?: string;
}

export interface TripAdvisorReviewsResponse {
  data: TripAdvisorReview[];
}

/**
 * Get reviews for a location - MUST be called client-side only
 * Reviews are loaded dynamically and never stored in HTML/JS source
 * 
 * @param locationId - TripAdvisor location ID
 * @returns Reviews data
 */
export async function getLocationReviews(locationId: string): Promise<TripAdvisorReviewsResponse> {
  const params = new URLSearchParams({
    key: TRIPADVISOR_API_KEY,
    language: 'en',
  });

  const url = `${TRIPADVISOR_BASE_URL}/location/${locationId}/reviews?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TripAdvisor API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching location reviews:', error);
    throw error;
  }
}

