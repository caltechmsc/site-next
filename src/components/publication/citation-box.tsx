/**
 * Citation Box Component
 *
 * Displays citation in multiple formats with copy functionality.
 */

"use client";

import { useState } from "react";
import { Check, Copy, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  type CitationData,
  type CitationFormat,
  formatCitation,
} from "@/lib/citation";

// ============================================================================
// Types
// ============================================================================

interface CitationBoxProps {
  data: CitationData;
  className?: string;
}

type TabType = CitationFormat;

// ============================================================================
// Constants
// ============================================================================

const TABS: { id: TabType; label: string }[] = [
  { id: "apa", label: "APA" },
  { id: "mla", label: "MLA" },
  { id: "bibtex", label: "BibTeX" },
];

// ============================================================================
// Component
// ============================================================================

export function CitationBox({ data, className }: CitationBoxProps) {
  const [activeTab, setActiveTab] = useState<TabType>("apa");
  const [copied, setCopied] = useState(false);

  const citation = formatCitation(data, activeTab);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy citation:", err);
    }
  };

  return (
    <div className={cn("rounded-lg border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Cite this publication
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Citation Content */}
      <div className="p-4">
        <pre
          className={cn(
            "whitespace-pre-wrap break-words font-mono text-sm leading-relaxed",
            activeTab === "bibtex" ? "text-xs" : ""
          )}
        >
          {citation}
        </pre>
      </div>
    </div>
  );
}
