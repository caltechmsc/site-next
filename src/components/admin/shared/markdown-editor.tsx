/**
 * Markdown Editor Component
 *
 * Rich Markdown editor with live preview.
 */

"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

// Dynamic import to avoid SSR issues with the editor
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// ============================================================================
// Types
// ============================================================================

export interface MarkdownEditorProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum editor height */
  minHeight?: number;
  /** Maximum editor height */
  maxHeight?: number;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Preview mode: edit, preview, or live (split) */
  preview?: "edit" | "preview" | "live";
}

// ============================================================================
// Component
// ============================================================================

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Enter Markdown content...",
  minHeight = 200,
  maxHeight = 500,
  disabled = false,
  className,
  preview = "live",
}: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className={cn("markdown-editor", className)}
      data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
    >
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        preview={preview}
        height={minHeight}
        minHeight={minHeight}
        maxHeight={maxHeight}
        textareaProps={{
          placeholder,
          disabled,
        }}
        hideToolbar={disabled}
        visibleDragbar={!disabled}
      />
    </div>
  );
}
