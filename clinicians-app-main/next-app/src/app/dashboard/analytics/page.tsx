import React from "react";
import AnalyticsPageClient from "./_components/analytics-page-client";
import { auth, currentUser } from "@clerk/nextjs/server";

const Page = async () => {
  // Make sure only users who have been made admins on Clerk can access this page

  const _auth = await auth();
  const user = await currentUser();

  if (!_auth.userId) {
    throw new Error("Unauthorized");
  }

  // User gotta be admin too!!!!
  // If privateMetadata property has prartisExecutive == true, then ok

  if (user?.privateMetadata?.prartisExecutive !== true) {
    throw new Error("Unauthorized");
    // Just return a message for now
    // return <div className="p-6">Unauthorized: Admins only</div>;
  }

  return <AnalyticsPageClient />;
};

export default Page;
