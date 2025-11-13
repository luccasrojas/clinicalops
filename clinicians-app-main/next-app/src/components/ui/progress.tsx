"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

// Define allowed variants
type ProgressVariant = "primary" | "accent" | "success" | "warning" | "danger";

// A simple map between variant names and Tailwind classes
const variantStyles: Record<
  ProgressVariant,
  { root: string; indicator: string }
> = {
  primary: {
    root: "bg-primary/20",
    indicator: "bg-primary",
  },
  accent: {
    root: "bg-accent/20",
    indicator: "bg-accent",
  },
  success: {
    root: "bg-green-500/20",
    indicator: "bg-green-500",
  },
  warning: {
    root: "bg-yellow-500/20",
    indicator: "bg-yellow-500",
  },
  danger: {
    root: "bg-destructive/20",
    indicator: "bg-destructive",
  },
};

interface ProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  value?: number;
  variant?: ProgressVariant;
}

export function Progress({
  className,
  value = 0,
  variant = "primary",
  ...props
}: ProgressProps) {
  const styles = variantStyles[variant];

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        styles.root,
        "relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(styles.indicator, "h-full w-full flex-1 transition-all")}
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
