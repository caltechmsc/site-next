/**
 * Collaborator Map Component
 *
 * Interactive world map showing collaborator locations.
 * Uses Leaflet with custom markers and popups.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { CollaboratorWithCoords } from "@/lib/db/queries/collaborators";
import { cn } from "@/lib/utils";

// ============================================================================
// Constants
// ============================================================================

const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_CSS_INTEGRITY =
  "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";

// ============================================================================
// Types
// ============================================================================

interface CollaboratorMapProps {
  collaborators: CollaboratorWithCoords[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  className?: string;
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  data: CollaboratorWithCoords;
}

// ============================================================================
// Component
// ============================================================================

export function CollaboratorMap({
  collaborators,
  selectedId,
  onSelect,
  className,
}: CollaboratorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Prepare markers data
  const markers: MapMarker[] = collaborators
    .filter((c) => c.latitude !== null && c.longitude !== null)
    .map((c) => ({
      id: c.id,
      lat: c.latitude!,
      lng: c.longitude!,
      data: c,
    }));

  // Load Leaflet CSS on mount (only when this component is used)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS_URL;
    link.integrity = LEAFLET_CSS_INTEGRITY;
    link.crossOrigin = "";
    document.head.appendChild(link);
  }, []);

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Capture ref values at effect start
    const markersMap = markersRef.current;

    // Dynamically import Leaflet (client-side only)
    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Skip if map already initialized
      if (mapRef.current) return;

      // Create map
      const map = L.map(mapContainerRef.current!, {
        center: [20, 0],
        zoom: 2,
        minZoom: 1,
        maxZoom: 10,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      // Add tile layer (grayscale style)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Custom marker icon
      const createIcon = (isSelected: boolean) =>
        L.divIcon({
          className: "custom-marker",
          html: `
            <div class="${isSelected ? "marker-selected" : "marker-default"}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
              </svg>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -24],
        });

      // Add markers
      markers.forEach((marker) => {
        const leafletMarker = L.marker([marker.lat, marker.lng], {
          icon: createIcon(marker.id === selectedId),
        });

        // Create popup content
        const popupContent = createPopupContent(marker.data);
        leafletMarker.bindPopup(popupContent, {
          maxWidth: 280,
          className: "collaborator-popup",
        });

        // Handle click
        leafletMarker.on("click", () => {
          onSelect?.(marker.id);
        });

        leafletMarker.addTo(map);
        markersRef.current.set(marker.id, leafletMarker);
      });

      mapRef.current = map;
      setIsLoaded(true);

      // Add custom styles
      addMapStyles();
    };

    initMap();

    // Cleanup
    return () => {
      const currentMap = mapRef.current;
      if (currentMap) {
        currentMap.remove();
        mapRef.current = null;
        markersMap.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selected marker
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    const L = require("leaflet");

    markersRef.current.forEach((marker, id) => {
      const isSelected = id === selectedId;
      marker.setIcon(
        L.divIcon({
          className: "custom-marker",
          html: `
            <div class="${isSelected ? "marker-selected" : "marker-default"}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
              </svg>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -24],
        })
      );

      // Open popup if selected
      if (isSelected) {
        marker.openPopup();
        const markerData = markers.find((m) => m.id === id);
        if (markerData) {
          mapRef.current?.setView([markerData.lat, markerData.lng], 5, {
            animate: true,
          });
        }
      }
    });
  }, [selectedId, isLoaded, markers]);

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="h-full w-full bg-muted"
        style={{ minHeight: "300px" }}
      />

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5 animate-pulse" />
            <span className="text-sm">Loading map...</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded bg-background/90 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          {markers.length} collaborator{markers.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function createPopupContent(collaborator: CollaboratorWithCoords): string {
  const parts: string[] = [];

  parts.push(`<div class="popup-content">`);
  parts.push(`<h3 class="popup-title">${collaborator.organization}</h3>`);

  if (collaborator.leader) {
    parts.push(`<p class="popup-leader">${collaborator.leader}</p>`);
  }

  if (collaborator.city || collaborator.country) {
    const location = [collaborator.city, collaborator.country]
      .filter(Boolean)
      .join(", ");
    parts.push(`<p class="popup-location">${location}</p>`);
  }

  parts.push(`<div class="popup-links">`);
  if (collaborator.website) {
    parts.push(
      `<a href="${collaborator.website}" target="_blank" rel="noopener noreferrer" class="popup-link">Website</a>`
    );
  }
  if (collaborator.email) {
    parts.push(
      `<a href="mailto:${collaborator.email}" class="popup-link">Email</a>`
    );
  }
  parts.push(`</div>`);
  parts.push(`</div>`);

  return parts.join("");
}

function addMapStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("collaborator-map-styles")) return;

  const style = document.createElement("style");
  style.id = "collaborator-map-styles";
  style.textContent = `
    .custom-marker {
      background: transparent;
      border: none;
    }
    .marker-default {
      color: hsl(var(--primary));
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
      transition: transform 0.15s ease;
    }
    .marker-default:hover {
      transform: scale(1.2);
    }
    .marker-selected {
      color: hsl(var(--secondary));
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
      transform: scale(1.3);
    }
    .collaborator-popup .leaflet-popup-content-wrapper {
      background: hsl(var(--card));
      color: hsl(var(--card-foreground));
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .collaborator-popup .leaflet-popup-tip {
      background: hsl(var(--card));
    }
    .popup-content {
      padding: 0.25rem;
    }
    .popup-title {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }
    .popup-leader {
      font-size: 0.75rem;
      color: hsl(var(--muted-foreground));
    }
    .popup-location {
      font-size: 0.75rem;
      color: hsl(var(--muted-foreground));
      margin-top: 0.25rem;
    }
    .popup-links {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
    }
    .popup-link {
      color: hsl(var(--primary));
      text-decoration: none;
    }
    .popup-link:hover {
      text-decoration: underline;
    }
  `;
  document.head.appendChild(style);
}
