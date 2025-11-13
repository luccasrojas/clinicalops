// app/api/upload-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { nanoid } from "nanoid";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GCS_BUCKET_NAME } from "@shared/constants";
// this is a test
import { gcpStorageClient } from "@/gcs/client";

const bucket = gcpStorageClient.bucket(GCS_BUCKET_NAME);

export async function GET(req: NextRequest) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");
  if (!filename)
    return NextResponse.json({ error: "Missing filename" }, { status: 400 });

  const timestamp = Date.now();
  const fileId = nanoid();
  const objectKey = `archive/${timestamp}/recordings/${fileId}-${filename}`;

  // signed PUT URL valid for 15 minutes
  const [uploadUrl] = await bucket.file(objectKey).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    // contentType: "audio/*",
    contentType: "application/octet-stream", // exact match required
  });

  return NextResponse.json({
    uploadUrl,
    objectKey,
  });
}
