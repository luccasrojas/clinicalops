// app/api/files/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { verifyToken } from "@/lib/token";
import { Readable } from "stream";
import { GCS_BUCKET_NAME } from "@shared/constants";

export const runtime = "nodejs"; // ensure Node runtime

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const bucketName = GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

function nodeToWebReadable(nodeStream: Readable): ReadableStream<Uint8Array> {
  let closed = false;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on("data", (chunk) => {
        if (!closed) {
          try {
            controller.enqueue(
              chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk)
            );
          } catch {
            // Ignore if enqueue throws after closed
            console.error(
              "Error enqueuing chunk — Ignore if enqueue throws after closed"
            );
          }
        }
      });

      nodeStream.on("end", () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      });

      nodeStream.on("error", (err) => {
        if (!closed) {
          closed = true;
          controller.error(err);
        }
      });
    },

    cancel() {
      closed = true;
      nodeStream.destroy();
    },
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  // Await context.params
  const { path } = await context.params;
  const filename = path.join("/");

  if (!token || !verifyToken(filename, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const file = bucket.file(filename);
  const [exists] = await file.exists();
  if (!exists) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const [metadata] = await file.getMetadata();
  const contentType = metadata.contentType || "application/octet-stream";

  const nodeStream = file.createReadStream();
  const webStream = nodeToWebReadable(nodeStream);

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
