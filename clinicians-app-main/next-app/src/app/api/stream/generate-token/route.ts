// https://clerk.com/docs/nextjs/guides/users/reading
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";

export async function POST() {
  console.log("generate-token/route.ts Generating Stream Video token...");
  // Clerk authentication
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Fetch current user from Clerk backend
  const user = await currentUser();
  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  // Create or update Stream Video user
  await streamVideo.upsertUsers([
    {
      id: user.id,
      name: user.fullName || "User",
      role: "admin",
      image:
        user.imageUrl ??
        generateAvatarUri({
          seed: user.fullName || "User",
          variant: "initials",
        }),
    },
  ]);

  const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const issuedAt = Math.floor(Date.now() / 1000) - 60;
  const token = streamVideo.generateUserToken({
    user_id: user.id,
    exp: expirationTime,
    iat: issuedAt,
  });

  console.log("generate-token/route.ts Generated token:", token);
  return NextResponse.json({ token });
}
