/**
 * Location Picker Component
 *
 * Interactive map for selecting coordinates.
 * Click on the map to set latitude and longitude.
 */

"use client";

import * as React from "react";
import { MapPin, X, Navigation } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================================================
// Constants
// ============================================================================

const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_CSS_INTEGRITY =
  "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";

// Default center (world view)
const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;
const SELECTED_ZOOM = 10;

// ============================================================================
// Types
// ============================================================================

export interface LocationPickerProps {
  /** Current latitude value */
  latitude?: number | null;
  /** Current longitude value */
  longitude?: number | null;
  /** Called when location is selected */
  onChange: (coords: { latitude: number; longitude: number } | null) => void;
  /** Additional class name */
  className?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  className,
  disabled = false,
}: LocationPickerProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markerRef = React.useRef<L.Marker | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const hasCoords =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined;

  // Load Leaflet CSS on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS_URL;
    link.integrity = LEAFLET_CSS_INTEGRITY;
    link.crossOrigin = "";
    document.head.appendChild(link);
  }, []);

  // Initialize map when expanded
  React.useEffect(() => {
    if (
      !isExpanded ||
      typeof window === "undefined" ||
      !mapContainerRef.current
    )
      return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Skip if already initialized
      if (mapRef.current) return;

      // Determine initial center
      const center: [number, number] = hasCoords
        ? [latitude!, longitude!]
        : DEFAULT_CENTER;
      const zoom = hasCoords ? SELECTED_ZOOM : DEFAULT_ZOOM;

      // Create map
      const map = L.map(mapContainerRef.current!, {
        center,
        zoom,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      // Add tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Create custom marker icon
      const markerIcon = L.divIcon({
        className: "custom-picker-marker",
        html: `
          <div class="picker-marker-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      // Add marker if coordinates exist
      if (hasCoords) {
        const marker = L.marker([latitude!, longitude!], { icon: markerIcon });
        marker.addTo(map);
        markerRef.current = marker;
      }

      // Handle map click
      map.on("click", (e: L.LeafletMouseEvent) => {
        if (disabled) return;

        const { lat, lng } = e.latlng;

        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { icon: markerIcon });
          marker.addTo(map);
          markerRef.current = marker;
        }

        // Notify parent
        onChange({
          latitude: Math.round(lat * 1000000) / 1000000, // 6 decimal places
          longitude: Math.round(lng * 1000000) / 1000000,
        });
      });

      mapRef.current = map;
      setIsLoaded(true);

      // Add custom styles for marker
      addPickerStyles();

      // Fix map size after render
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    initMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        setIsLoaded(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  // Update marker when coordinates change externally
  React.useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    const updateMarker = async () => {
      const L = (await import("leaflet")).default;

      const markerIcon = L.divIcon({
        className: "custom-picker-marker",
        html: `
          <div class="picker-marker-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      if (hasCoords) {
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude!, longitude!]);
        } else {
          const marker = L.marker([latitude!, longitude!], {
            icon: markerIcon,
          });
          marker.addTo(mapRef.current!);
          markerRef.current = marker;
        }
      } else {
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
      }
    };

    updateMarker();
  }, [latitude, longitude, hasCoords, isLoaded]);

  const handleClear = () => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    onChange(null);
  };

  const handleLocateMe = async () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        if (mapRef.current) {
          const L = (await import("leaflet")).default;

          mapRef.current.setView([lat, lng], SELECTED_ZOOM);

          const markerIcon = L.divIcon({
            className: "custom-picker-marker",
            html: `
              <div class="picker-marker-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                  <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                </svg>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const marker = L.marker([lat, lng], { icon: markerIcon });
            marker.addTo(mapRef.current);
            markerRef.current = marker;
          }
        }

        onChange({
          latitude: Math.round(lat * 1000000) / 1000000,
          longitude: Math.round(lng * 1000000) / 1000000,
        });
      },
      () => {
        // Geolocation error - silently ignore
      }
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toggle Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full justify-start gap-2"
      >
        <MapPin className="h-4 w-4" />
        {isExpanded ? "Hide Map" : "Pick Location on Map"}
        {hasCoords && !isExpanded && (
          <span className="ml-auto text-xs text-muted-foreground">
            ({latitude?.toFixed(4)}, {longitude?.toFixed(4)})
          </span>
        )}
      </Button>

      {/* Map Container */}
      {isExpanded && (
        <div className="space-y-2">
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            {/* Map */}
            <div ref={mapContainerRef} className="h-[250px] w-full bg-muted" />

            {/* Loading State */}
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 animate-pulse" />
                  <span className="text-sm">Loading map...</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isLoaded && (
              <div className="absolute right-2 top-2 z-[1000] flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-border bg-muted/90 backdrop-blur-sm hover:bg-muted"
                  onClick={handleLocateMe}
                  title="Use my location"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
                {hasCoords && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-border bg-muted/90 backdrop-blur-sm hover:bg-muted"
                    onClick={handleClear}
                    title="Clear location"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Click on the map to select a location, or use the locate button to
            use your current position.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

function addPickerStyles() {
  if (typeof window === "undefined") return;
  if (document.getElementById("location-picker-styles")) return;

  const style = document.createElement("style");
  style.id = "location-picker-styles";
  style.textContent = `
    .custom-picker-marker {
      background: transparent !important;
      border: none !important;
    }
    .picker-marker-icon {
      color: hsl(var(--primary));
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      transition: transform 0.15s ease;
    }
    .picker-marker-icon:hover {
      transform: scale(1.1);
    }
  `;
  document.head.appendChild(style);
}
