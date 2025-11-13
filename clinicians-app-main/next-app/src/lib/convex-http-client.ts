import { ConvexHttpClient } from "convex/browser";

export const convexHttpClientInstance = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);
