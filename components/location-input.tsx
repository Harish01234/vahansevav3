'use client';

import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationData {
  display_name: string;
  lat: number;
  lon: number;
}

export default function LiveLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getLiveLocation = () => {
    setIsLoading(true);
    setError('');
    setLocation(null);

    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data.display_name) {
            setLocation({
              display_name: data.display_name,
              lat: latitude,
              lon: longitude,
            });
          } else {
            setError('Unable to fetch address from coordinates.');
          }
        } catch (err) {
          setError('Failed to fetch address.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      },
      (geoError) => {
        console.error('Geo Error:', geoError);
        setError('Unable to get your current location.');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Fetch Live Location</h2>

      <button
        onClick={getLiveLocation}
        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
      >
        <MapPin className="w-4 h-4 mr-2" />
        {isLoading ? 'Fetching location...' : 'Get My Location'}
      </button>

      {isLoading && (
        <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-300">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Locating you...
        </div>
      )}

      {location && (
        <div className="mt-4 p-3 rounded border bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          <p><strong>Address:</strong> {location.display_name}</p>
          <p><strong>Latitude:</strong> {location.lat}</p>
          <p><strong>Longitude:</strong> {location.lon}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</div>
      )}
    </div>
  );
}
