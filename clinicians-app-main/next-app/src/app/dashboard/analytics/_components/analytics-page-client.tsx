"use client";

import { useQuery } from "convex/react";
import { api } from "@convexdev/_generated/api";
import { AnalyticsCard } from "./analytics-card";

export default function AnalyticsPageClient() {
  const meetingsData = useQuery(
    api.analytics.meetingsByUser.meetingsByUserWithNamesArray
  );

  const formatted =
    meetingsData?.map((item) => ({
      //   label: item.userId.slice(0, 6), // short ID for X-axis
      label: item.name.slice(0, 5), // name for X-axis
      value: item.count,
    })) ?? [];

  const loading = meetingsData === undefined;

  return (
    <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <AnalyticsCard
        title="Meetings per User"
        data={formatted}
        loading={loading}
      />
      {JSON.stringify(meetingsData)}
      {/* You can add more analytics cards here later */}
    </div>
  );
}
