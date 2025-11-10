"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsCardProps {
  title: string;
  data?: { label: string; value: number }[];
  loading?: boolean;
}

// https://chatgpt.com/c/68f90322-5dfc-8320-ae9f-8c42ad9fb2bd
// Could have a link that says "talk to chatgpt about this topic" in the front end lol
export function AnalyticsCard({ title, data, loading }: AnalyticsCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                className="fill-accent"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
