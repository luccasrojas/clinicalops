// portal/route.ts
import { currentUser } from "@clerk/nextjs/server";
import { CustomerPortal } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  getCustomerId: async (req: NextRequest) => {
    const user = await currentUser();

    if (!user) throw new Error("User not found");

    console.log("Current user from clerk for polar:", user);

    // Assuming you have a way to map Clerk user IDs to Polar Customer IDs
    const polarCustomerId = user.id;

    if (!polarCustomerId)
      throw new Error("Polar Customer ID not found for user");

    return polarCustomerId;
  }, // Function to resolve a Polar Customer ID
  server: "sandbox", // Use sandbox if you're testing Polar - omit the parameter or pass 'production' otherwise
});
