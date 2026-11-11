'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Star, Loader2, X, Sparkles, ZoomIn, Check, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface TripAdvisorResult {
  location_id: string;
  name: string;
  address_obj?: {
    street1?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  rating?: string;
  num_reviews?: string;
  category?: {
    name: string;
  };
  web_url?: string;
  photo_url?: string; // full photo link (Google), used for the large preview
  photos?: Array<{
    images: {
      medium?: { url: string };
      large?: { url: string };
      original?: { url: string };
    };
  }>;
}

interface TripAdvisorSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: TripAdvisorResult) => void;
  placeholder?: string;
  category?: 'hotels' | 'restaurants' | 'attractions';
  className?: string;
  cityName?: string; // City name to include in search
  countryName?: string; // Country name to include in search
  allowDescribe?: boolean; // show "Can't remember the name? Describe it"
}

export default function TripAdvisorSearch({
  value,
  onChange,
  onSelect,
  placeholder = 'Search...',
  category,
  className = '',
  cityName,
  countryName,
  allowDescribe = false
}: TripAdvisorSearchProps) {
  // "Describe it" mode: find a place from a description like "vegetarian restaurant on Parque España"
  const [describeOpen, setDescribeOpen] = useState(false);
  const [describeText, setDescribeText] = useState('');
  const [describing, setDescribing] = useState(false);
  const [describeMsg, setDescribeMsg] = useState('');
  // Large photo preview, so a place can be recognised before choosing it
  const [preview, setPreview] = useState<TripAdvisorResult | null>(null);
  const previewOpenRef = useRef(false);
  previewOpenRef.current = !!preview;
  const [searchQuery, setSearchQuery] = useState(value);
  const [results, setResults] = useState<TripAdvisorResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Only search after the person types in this box (not when the box first appears),
  // so saved names don't pop open suggestion lists or use up Google searches
  const userTypedRef = useRef(false);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If we have city name but no query, still search for locations in that city
    const shouldSearch = userTypedRef.current && (searchQuery.trim().length >= 2 || (cityName && (category === 'hotels' || category === 'restaurants' || category === 'attractions') && searchQuery.trim().length === 0));
    
    if (!shouldSearch) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Build search query: if user types something, use it; otherwise search for locations in the city
        let query = searchQuery.trim();
        
        // If no query but we have city name, search for locations in that city
        if (!query && cityName && (category === 'hotels' || category === 'restaurants' || category === 'attractions')) {
          // Try simpler query format - just city name works better
          query = cityName;
          if (countryName) {
            query = `${cityName}, ${countryName}`;
          }
        } else if (query && cityName && (category === 'hotels' || category === 'restaurants' || category === 'attractions')) {
          // If user types something, combine with city name for better results
          query = `${query} ${cityName}`;
          if (countryName) {
            query += ` ${countryName}`;
          }
        }
        
        const params = new URLSearchParams({
          query: query,
        });
        if (category) {
          params.append('category', category);
        }

        console.log('TripAdvisor search query:', query);
        const response = await fetch(`/api/tripadvisor/search?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Search API error:', errorData);
          // If it's a 500 error, show empty results instead of throwing
          if (response.status === 500) {
            setResults([]);
            setShowResults(true);
            setSelectedIndex(-1);
            return;
          }
          throw new Error(errorData.message || 'Search failed');
        }

        const data = await response.json();
        console.log('TripAdvisor search response:', data);
        console.log('Results count:', data.results?.length || 0);
        
        // Check for error in response
        if (data.error) {
          console.error('API returned error:', data.error);
          setResults([]);
          setShowResults(true);
          setSelectedIndex(-1);
          return;
        }
        
        setResults(data.results || []);
        setShowResults(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, category, cityName, countryName]);

  // Auto-search for hotels in city when component mounts or city changes
  useEffect(() => {
    if (cityName && category === 'hotels' && searchQuery.trim().length === 0) {
      // Trigger a search for hotels in the city after a short delay
      const timeoutId = setTimeout(() => {
        // Try different query formats for better results
        const queries = [
          `hotels ${cityName}${countryName ? ` ${countryName}` : ''}`,
          `hotel ${cityName}`,
          cityName
        ];
        
        // Try simpler query format - just city name works better with TripAdvisor API
        const query = cityName + (countryName ? `, ${countryName}` : '');
        setIsSearching(true);
        fetch(`/api/tripadvisor/search?query=${encodeURIComponent(query)}&category=hotels`)
          .then(res => {
            if (!res.ok) {
              console.error('Auto-search API error:', res.status, res.statusText);
              return res.json().then(data => ({ error: data.error || 'API error', results: [] }));
            }
            return res.json();
          })
          .then(data => {
            console.log('Auto-search results:', data.results?.length || 0);
            if (data.error) {
              console.error('Auto-search API error:', data.error);
            }
            setResults(data.results || []);
            setIsSearching(false);
            // Show results if we have any
            if (data.results && data.results.length > 0) {
              setShowResults(true);
            }
          })
          .catch(err => {
            console.error('Auto-search error:', err);
            setIsSearching(false);
          });
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [cityName, countryName, category, searchQuery]); // Include searchQuery to prevent re-running

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (previewOpenRef.current) return; // clicks in the photo preview shouldn't close the list
      // Dragging the page's scrollbar also fires mousedown: don't treat that as clicking away
      const root = document.documentElement;
      if (event.target === root || event.clientX >= root.clientWidth || event.clientY >= root.clientHeight) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    userTypedRef.current = true;
    setSearchQuery(newValue);
    onChange(newValue);
  };

  const handleSelect = (result: TripAdvisorResult) => {
    userTypedRef.current = false; // picking a result shouldn't start a new search
    setDescribeOpen(false);
    setDescribeMsg('');
    setSearchQuery(result.name);
    onChange(result.name);
    onSelect(result);
    setShowResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  const getImageUrl = (result: TripAdvisorResult): string | null => {
    if (!result.photos || result.photos.length === 0) return null;
    const photo = result.photos[0];
    return photo.images?.large?.url || 
           photo.images?.medium?.url || 
           photo.images?.original?.url || 
           null;
  };

  const getAddress = (result: TripAdvisorResult): string => {
    if (!result.address_obj) return '';
    const parts = [
      result.address_obj.street1,
      result.address_obj.city,
      result.address_obj.state,
      result.address_obj.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const runDescribe = async () => {
    const text = describeText.trim();
    if (text.length < 3) {
      setDescribeMsg('Please describe the place a bit more.');
      return;
    }
    setDescribing(true);
    setDescribeMsg('');
    try {
      const res = await fetch('/api/places/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, city: cityName, country: countryName, category }),
      });
      const data = await res.json().catch(() => ({}));
      const found: TripAdvisorResult[] = data.results || [];
      setResults(found);
      setShowResults(found.length > 0);
      setSelectedIndex(-1);
      setDescribeMsg(
        data.error ||
          (found.length === 0
            ? 'Nothing matched. Try adding a detail, like the street, a nearby landmark or the type of food.'
            : `Here are the best matches${data.note ? ` (${data.note.toLowerCase()})` : ''}. Pick the right one below.`)
      );
    } catch {
      setDescribeMsg('Couldn’t search right now. Please try again.');
    } finally {
      setDescribing(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            } else if (cityName && category === 'hotels') {
              // Auto-search for hotels in city when focused
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
        )}
        {searchQuery && !isSearching && (
          <button
            type="button"
            aria-label="Clear"
            title="Clear"
            onClick={() => {
              userTypedRef.current = false;
              setSearchQuery('');
              onChange('');
              setResults([]);
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {allowDescribe && (
        <div className="mt-1.5">
          {!describeOpen ? (
            <button
              type="button"
              onClick={() => { setDescribeOpen(true); setDescribeMsg(''); }}
              className="inline-flex items-center text-xs text-[#3F5B6A] hover:text-[#2F4A5C] underline"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Can’t remember the name? Describe it
            </button>
          ) : (
            <div className="rounded-lg border border-[#C9D9DF] bg-[#F3F7F8] p-3">
              <label className="block text-xs font-medium text-[#2F4A5C] mb-1">Describe the place</label>
              <input
                type="text"
                value={describeText}
                onChange={(e) => setDescribeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); runDescribe(); }
                }}
                placeholder={
                  category === 'attractions'
                    ? 'e.g. the big park with the castle on the hill, or the museum next to the cathedral'
                    : category === 'hotels'
                    ? 'e.g. the boutique hotel with a rooftop pool in Condesa'
                    : 'e.g. the vegetarian restaurant on Parque España, or one directly across from the Hyatt Regency Polanco'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#4A6878] focus:border-transparent"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={runDescribe}
                  disabled={describing}
                  className="inline-flex items-center px-3 py-1.5 bg-[#4A6878] text-white rounded-lg text-sm hover:bg-[#3F5B6A] disabled:opacity-50"
                >
                  {describing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  {describing ? 'Looking…' : 'Find it'}
                </button>
                <button
                  type="button"
                  onClick={() => { setDescribeOpen(false); setDescribeMsg(''); }}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
              {describeMsg && <p className="mt-2 text-xs text-[#3F5B6A]">{describeMsg}</p>}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          >
            {results.map((result, index) => {
              const imageUrl = getImageUrl(result);
              const address = getAddress(result);
              const isSelected = index === selectedIndex;

              return (
                <motion.div
                  key={result.location_id}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    p-4 cursor-pointer border-b border-gray-100 last:border-b-0
                    hover:bg-blue-50 transition-colors
                    ${isSelected ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="flex gap-4">
                    {imageUrl ? (
                      <button
                        type="button"
                        title="See a bigger photo"
                        onClick={(e) => {
                          e.stopPropagation(); // view the photo without choosing the place
                          setPreview(result);
                        }}
                        className="relative flex-shrink-0 group/photo rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A6878]"
                      >
                        <img
                          src={imageUrl}
                          alt={result.name}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          loading="lazy"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/55 text-white rounded p-0.5 group-hover/photo:bg-black/75">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ) : (
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {result.name}
                      </h4>
                      {result.category && (
                        <p className="text-xs text-gray-500 mt-1">
                          {result.category.name}
                        </p>
                      )}
                      {address && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="truncate">{address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {result.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {result.rating}
                            </span>
                          </div>
                        )}
                        {result.num_reviews && (
                          <span className="text-xs text-gray-500">
                            ({result.num_reviews} reviews)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {showResults && results.length === 0 && !isSearching && (
        <div className="relative z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-center text-gray-500 mb-2">
            {cityName && category === 'hotels' 
              ? `No hotels found in ${cityName}`
              : 'No results found'}
          </p>
          <div className="text-xs text-gray-400 text-center">
            {searchQuery.trim().length < 2 && cityName && category === 'hotels' 
              ? (
                <p>Try typing a hotel name to search, or check the browser console for API errors</p>
              ) : (
                <>
                  <p className="mb-2">This may be because:</p>
                  <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
                    <li>Your TripAdvisor API key needs to be activated</li>
                    <li>Your IP address needs to be whitelisted in TripAdvisor Developer Portal</li>
                    <li>The server needs to be restarted to load the API key</li>
                    <li>There are no results for this search</li>
                  </ul>
                  <p className="mt-3">
                    <a href="https://www.tripadvisor.com/developers" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Visit TripAdvisor Developer Portal</a> to check your API settings.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Check browser console (F12) for detailed error messages</p>
                </>
              )}
          </div>
        </div>
      )}

      {/* Large photo preview (shown over the whole page) */}
      {preview && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-label={`Photo of ${preview.name}`}
        >
          <div
            className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={preview.photo_url ? `${preview.photo_url}&w=1200` : getImageUrl(preview) || ''}
              alt={preview.name}
              className="w-full max-h-[65vh] object-contain bg-gray-100"
            />
            <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{preview.name}</p>
                {getAddress(preview) && <p className="text-sm text-gray-600">{getAddress(preview)}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = preview;
                    setPreview(null);
                    handleSelect(r);
                  }}
                  className="inline-flex items-center px-3 py-2 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] text-sm"
                >
                  <Check className="w-4 h-4 mr-1" /> Use this place
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

