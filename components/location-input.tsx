'use client';

import { useState, useCallback } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';

interface Location {
  display_name: string;
  lat: number;
  lon: number;
}

interface LocationInputProps {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
  className?: string;
}

export function LocationInput({ onLocationSelect, placeholder = 'Enter pickup location', className = '' }: LocationInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  const searchLocation = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          onLocationSelect({
            display_name: data.display_name,
            lat: latitude,
            lon: longitude,
          });
          setQuery(data.display_name);
        } catch (error) {
          console.error('Error getting location name:', error);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLoading(false);
      }
    );
  }, [onLocationSelect]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            searchLocation(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <button
          onClick={getCurrentLocation}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Use current location"
        >
          <MapPin className="w-4 h-4 text-accent-light dark:text-accent-dark" />
        </button>
      </div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-1 bg-card-light dark:bg-card-dark rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  onLocationSelect(suggestion);
                  setQuery(suggestion.display_name);
                  setSuggestions([]);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {suggestion.display_name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
          <Loader2 className="w-4 h-4 animate-spin text-accent-light dark:text-accent-dark" />
        </div>
      )}
    </div>
  );
} 