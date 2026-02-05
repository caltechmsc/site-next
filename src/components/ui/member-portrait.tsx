import Image from "next/image";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format";

// ============================================================================
// Types
// ============================================================================

export type PortraitSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "fill";
export type PortraitVariant = "circle" | "portrait";

export interface MemberPortraitProps {
  /** Member's display name */
  name: string;
  /** Photo URL (optional) */
  photo?: string | null;
  /** Size preset or "fill" */
  size?: PortraitSize;
  /** Shape: circle (avatar) or portrait (3:4 ratio) */
  variant?: PortraitVariant;
  /** Prioritize loading for above-the-fold images */
  priority?: boolean;
  /** Apply hover scale effect */
  hoverScale?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Internal Utilities
// ============================================================================

const COLOR_PALETTE = [
  "5c6bc0", // Indigo
  "7e57c2", // Deep Purple
  "26a69a", // Teal
  "42a5f5", // Blue
  "66bb6a", // Green
  "ff7043", // Deep Orange
  "ec407a", // Pink
  "8d6e63", // Brown
  "78909c", // Blue Grey
  "ab47bc", // Purple
  "ffa726", // Orange
  "ef5350", // Red
] as const;

function generateColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

// ============================================================================
// Size Configuration
// ============================================================================

const CIRCLE_SIZES: Record<
  Exclude<PortraitSize, "fill">,
  { dimension: number; fontSize: string }
> = {
  xs: { dimension: 24, fontSize: "text-[9px]" },
  sm: { dimension: 32, fontSize: "text-xs" },
  md: { dimension: 40, fontSize: "text-sm" },
  lg: { dimension: 56, fontSize: "text-base" },
  xl: { dimension: 80, fontSize: "text-xl" },
  "2xl": { dimension: 128, fontSize: "text-3xl" },
};

const PORTRAIT_SIZES: Record<
  Exclude<PortraitSize, "fill">,
  { width: number; height: number; fontSize: string }
> = {
  xs: { width: 48, height: 64, fontSize: "text-lg" },
  sm: { width: 72, height: 96, fontSize: "text-xl" },
  md: { width: 96, height: 128, fontSize: "text-2xl" },
  lg: { width: 128, height: 170, fontSize: "text-3xl" },
  xl: { width: 144, height: 192, fontSize: "text-4xl" },
  "2xl": { width: 192, height: 256, fontSize: "text-5xl" },
};

// ============================================================================
// Component
// ============================================================================

export function MemberPortrait({
  name,
  photo,
  size = "md",
  variant = "circle",
  priority = false,
  hoverScale = false,
  className,
}: MemberPortraitProps) {
  const isCircle = variant === "circle";
  const isFill = size === "fill";

  const config = (() => {
    if (isFill) return { fontSize: "text-4xl" };

    if (isCircle) {
      const sizeConfig = CIRCLE_SIZES[size as Exclude<PortraitSize, "fill">];
      return {
        width: sizeConfig.dimension,
        height: sizeConfig.dimension,
        fontSize: sizeConfig.fontSize,
      };
    }

    const sizeConfig = PORTRAIT_SIZES[size as Exclude<PortraitSize, "fill">];
    return {
      width: sizeConfig.width,
      height: sizeConfig.height,
      fontSize: sizeConfig.fontSize,
    };
  })();

  const sizes = isFill
    ? "(max-width: 640px) 50vw, 33vw"
    : `${"width" in config && config.width && config.height ? Math.max(config.width, config.height) : 256}px`;

  const renderFallback = () => {
    const bgColor = `#${generateColorFromName(name)}`;
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center font-semibold text-white",
          config.fontSize
        )}
        style={{ backgroundColor: bgColor }}
      >
        {getInitials(name)}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-muted",
        isCircle ? "rounded-full" : "rounded-lg",
        isFill && "h-full w-full",
        className
      )}
      style={
        "width" in config
          ? { width: config.width, height: config.height }
          : undefined
      }
    >
      {photo ? (
        <Image
          src={photo}
          alt={name}
          fill
          priority={priority}
          sizes={sizes}
          className={cn(
            "object-cover",
            isCircle && "rounded-full",
            hoverScale &&
              "transition-transform duration-300 group-hover:scale-105"
          )}
        />
      ) : (
        renderFallback()
      )}
    </div>
  );
}
