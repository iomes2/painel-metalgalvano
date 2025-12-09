"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export function StatCard({
  title,
  value,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend === "up" && <ArrowUp className="h-4 w-4 text-green-500" />}
        {trend === "down" && <ArrowDown className="h-4 w-4 text-red-500" />}
        {trend === "neutral" && <Minus className="h-4 w-4 text-gray-500" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
