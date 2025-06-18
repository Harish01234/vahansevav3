'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  center: [number, number];
  markers: Array<{
    position: [number, number];
    popup: string;
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

export default function MapComponent({
  center,
  markers,
  onMapClick,
  className = '',
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      mapRef.current = L.map('map').setView(center, 13);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);

      // Add click handler
      if (onMapClick) {
        mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }
    }

    // Update center if changed
    mapRef.current.setView(center);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(({ position, popup }) => {
      const marker = L.marker(position)
        .addTo(mapRef.current!)
        .bindPopup(popup);
      markersRef.current.push(marker);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, markers, onMapClick]);

  return <div id="map" className={`h-full w-full ${className}`} />;
}