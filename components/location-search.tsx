'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';

interface Location {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  value: string;
  onChange: (location: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
}

export function LocationSearch({
  value,
  onChange,
  placeholder = 'Enter location',
  className = '',
}: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Update search term when value changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Error searching for locations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchLocations(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, searchLocations]);

  const handleSuggestionClick = (location: Location) => {
    setSearchTerm(location.display_name);
    onChange({
      address: location.display_name,
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lon),
    });
    setShowSuggestions(false);
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.error('Error getting address:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);

    // First, request permission and get coordinates
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Get address from coordinates
          const address = await getAddressFromCoordinates(latitude, longitude);
          
          const locationData = {
            address,
            lat: latitude,
            lng: longitude
          };

          setSearchTerm(locationData.address);
          onChange(locationData);
          toast.success('Current location set successfully');
        } catch (error) {
          console.error('Error processing location:', error);
          toast.error('Error processing your location');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Could not get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        toast.error(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-focus)] pr-10"
          />
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation}
          className="border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)] min-w-[40px]"
        >
          <Navigation className={`w-4 h-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (searchTerm || isLoading) && (
        <div className="absolute z-10 w-full mt-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md shadow-lg">
          {isLoading ? (
            <div className="p-2 text-center text-[var(--color-muted)]">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-60 overflow-auto">
              {suggestions.map((location, index) => (
                <li
                  key={`${location.lat}-${location.lon}-${index}`}
                  className="px-4 py-2 hover:bg-[var(--color-hover)] cursor-pointer text-[var(--color-text)]"
                  onClick={() => handleSuggestionClick(location)}
                >
                  {location.display_name}
                </li>
              ))}
            </ul>
          ) : searchTerm ? (
            <div className="p-2 text-center text-[var(--color-muted)]">
              No locations found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 