"use client";
import { ConvexReactClient } from "convex/react";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { TanstackClientProvider } from "@/providers/TanstackClientProvider";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <TanstackClientProvider>{children}</TanstackClientProvider>
    </ConvexProviderWithClerk>
  );
}
