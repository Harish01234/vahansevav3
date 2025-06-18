'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@/lib/theme-context';

interface Location {
  lat: number;
  lon: number;
  display_name: string;
}

interface MapPreviewProps {
  pickup?: Location;
  dropoff?: Location;
  className?: string;
}

export function MapPreview({ pickup, dropoff, className = '' }: MapPreviewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([0, 0], 2);
      
      // Add tile layer based on theme
      const tileLayer = L.tileLayer(
        theme === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap contributors',
        }
      ).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [theme]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const locations: Location[] = [];
    if (pickup) locations.push(pickup);
    if (dropoff) locations.push(dropoff);

    if (locations.length === 0) return;

    // Add markers for each location
    locations.forEach((location, index) => {
      const marker = L.marker([location.lat, location.lon])
        .bindPopup(location.display_name)
        .addTo(mapRef.current!);
      
      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lon]));
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  }, [pickup, dropoff]);

  return (
    <div 
      id="map" 
      className={`w-full h-48 rounded-lg overflow-hidden ${className}`}
    />
  );
} 