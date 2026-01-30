"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface MarkdownProps {
  /** The Markdown content to render */
  content: string;
  /** Additional CSS classes to apply */
  className?: string;
  /** Size variant for typography */
  size?: "sm" | "base" | "lg";
}

// ============================================================================
// Size Configuration
// ============================================================================

const sizeClasses = {
  sm: "prose-sm",
  base: "prose-base",
  lg: "prose-lg",
} as const;

// ============================================================================
// Component
// ============================================================================

export function Markdown({ content, className, size = "base" }: MarkdownProps) {
  return (
    <div
      className={cn(
        // Base prose styling
        "prose",
        // Dark mode support
        "dark:prose-invert",
        // Size variant
        sizeClasses[size],
        // Ensure full width (remove max-width constraint)
        "max-w-none",
        // Additional custom classes
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default Markdown;
