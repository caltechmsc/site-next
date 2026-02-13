/**
 * Photo Collage Component
 *
 * Displays a dynamic collage of photos of Prof. Goddard, with overlapping
 * frames at varying angles. On hover, a photo lifts to the top and straightens
 * with a smooth animation.
 */

"use client";

import { useState } from "react";
import Image from "next/image";

// ============================================================================
// Component
// ============================================================================

export function PhotoCollage() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const photos = [
    {
      src: "/images/wag/red-beret-suit-portrait.jpg",
      alt: "Prof. Goddard — formal portrait with signature red beret",
      width: "30%",
      aspect: "214 / 320",
      rotate: -5,
      left: "0%",
      top: "10%",
      z: 2,
    },
    {
      src: "/images/wag/blue-beret-coconut-restaurant.jpg",
      alt: "Prof. Goddard enjoying a coconut at a restaurant",
      width: "50%",
      aspect: "4 / 3",
      rotate: 3,
      left: "46%",
      top: "-2%",
      z: 1,
      priority: true,
    },
    {
      src: "/images/wag/red-beret-closeup.png",
      alt: "Prof. Goddard — a warm smile",
      width: "34%",
      aspect: "2268 / 3313",
      rotate: -1.5,
      left: "22%",
      top: "18%",
      z: 3,
    },
  ];

  return (
    <div
      className="relative mx-auto w-full select-none"
      style={{ aspectRatio: "16 / 9" }}
    >
      {photos.map((photo, i) => {
        const isHovered = hoveredIndex === i;

        return (
          <div
            key={photo.src}
            className="absolute cursor-pointer"
            style={{
              width: photo.width,
              left: photo.left,
              top: photo.top,
              zIndex: isHovered ? 50 : photo.z,
              transform: `rotate(${
                isHovered ? 0 : photo.rotate
              }deg) scale(${isHovered ? 1.06 : 1})`,
              transition:
                "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className={`overflow-hidden rounded-sm bg-card p-1.5 transition-shadow duration-300 ${
                isHovered ? "shadow-lg" : "shadow-md"
              }`}
            >
              <div
                className="relative w-full overflow-hidden bg-muted"
                style={{ aspectRatio: photo.aspect }}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 45vw, 28vw"
                  priority={photo.priority}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
