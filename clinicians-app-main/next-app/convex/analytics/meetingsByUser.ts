// convex/analytics/sessionsByUser.ts
import { query } from "../_generated/server";

export const meetingsByUser = query(async ({ db }) => {
  const meetings = await db.query("meetings").collect();

  const counts: Record<string, number> = {};
  for (const s of meetings) {
    counts[s.userId] = (counts[s.userId] ?? 0) + 1;
  }

  return counts;
});

// I want a version that shows me the name of the user too
export const meetingsByUserWithNames = query(async ({ db }) => {
  const meetings = await db.query("meetings").collect();
  const users = await db.query("users").collect();

  const userIdToName: Record<string, string> = {};
  for (const user of users) {
    userIdToName[user.userId] = user.name || "Unknown";
  }

  const counts: Record<string, { name: string; count: number }> = {};
  for (const s of meetings) {
    if (!counts[s.userId]) {
      counts[s.userId] = {
        name: userIdToName[s.userId] || "Unknown",
        count: 0,
      };
    }
    counts[s.userId].count += 1;
  }

  return counts;
});

export const meetingsByUserArray = query(async ({ db }) => {
  const meetings = await db.query("meetings").collect();
  const result: Record<string, number> = {};

  for (const s of meetings) {
    result[s.userId] = (result[s.userId] ?? 0) + 1;
  }

  // optionally map to array for easier charting
  return Object.entries(result).map(([userId, count]) => ({
    userId,
    count,
  }));
});

export const meetingsByUserWithNamesArray = query(async ({ db }) => {
  const meetings = await db.query("meetings").collect();
  const users = await db.query("users").collect();

  const userIdToName: Record<string, string> = {};
  for (const user of users) {
    userIdToName[user.userId] = user.name || "Unknown";
  }

  const counts: Record<string, { name: string; count: number }> = {};
  for (const s of meetings) {
    if (!counts[s.userId]) {
      counts[s.userId] = {
        name: userIdToName[s.userId] || "Unknown",
        count: 0,
      };
    }
    counts[s.userId].count += 1;
  }

  return Object.entries(counts).map(([userId, { name, count }]) => ({
    userId,
    name,
    count,
  }));
});
