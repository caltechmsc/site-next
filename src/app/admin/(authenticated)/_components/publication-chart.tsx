/**
 * Publication Chart Component
 *
 * Dual-axis chart showing yearly and cumulative publication counts.
 * Uses recharts with smooth animations and responsive layout.
 */

"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/shared";
import type { PublicationByYear } from "@/lib/admin/actions";

// ============================================================================
// Types
// ============================================================================

export interface PublicationChartProps {
  /** Publication count data grouped by year */
  data: PublicationByYear[];
}

// ============================================================================
// Custom Tooltip
// ============================================================================

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const yearly = payload.find((p) => p.dataKey === "count");
  const cumulative = payload.find((p) => p.dataKey === "cumulative");

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium">{label}</p>
      <div className="space-y-0.5">
        {yearly && (
          <p className="text-xs">
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: "hsl(var(--primary))" }}
            />
            <span className="text-muted-foreground">This Year: </span>
            <span className="font-semibold">{yearly.value}</span>
          </p>
        )}
        {cumulative && (
          <p className="text-xs">
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: "hsl(var(--primary) / 0.3)" }}
            />
            <span className="text-muted-foreground">Cumulative: </span>
            <span className="font-semibold">{cumulative.value}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function PublicationChart({ data }: PublicationChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Publications by Year
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BookOpen}
            title="No Publications"
            description="Publication data will appear here once added."
          />
        </CardContent>
      </Card>
    );
  }

  const totalCount = data[data.length - 1]?.cumulative ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Publications by Year
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Yearly counts and cumulative growth
            </p>
          </div>
          <span className="text-2xl font-bold tabular-nums">
            {totalCount.toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
              <defs>
                <linearGradient
                  id="cumulativeGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/50"
                vertical={false}
              />

              {/* X Axis — Year */}
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                interval="preserveStartEnd"
              />

              {/* Left Y Axis — Cumulative */}
              <YAxis
                yAxisId="cumulative"
                orientation="left"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={40}
              />

              {/* Right Y Axis — Yearly */}
              <YAxis
                yAxisId="yearly"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={32}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              />

              {/* Cumulative Area */}
              <Area
                yAxisId="cumulative"
                type="monotone"
                dataKey="cumulative"
                fill="url(#cumulativeGradient)"
                stroke="hsl(var(--primary) / 0.3)"
                strokeWidth={1.5}
                animationDuration={1200}
                animationEasing="ease-out"
              />

              {/* Yearly Bars */}
              <Bar
                yAxisId="yearly"
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: "hsl(var(--primary))" }}
            />
            <span>Yearly</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: "hsl(var(--primary) / 0.3)" }}
            />
            <span>Cumulative</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
