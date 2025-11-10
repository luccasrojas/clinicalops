import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  helloWorld,
  // sessionsProcessing,
  simulationsProcessing,
} from "@/inngest/functions";
import { NextResponse } from "next/server";
import { sessionsProcessing } from "@/inngest/sessions-processing";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    /* your functions will be passed here later! */
    helloWorld,
    sessionsProcessing,
    simulationsProcessing,
  ],
});

// test hello wolrd get
// just a get

// GET HELLO WORLD TEST
// export async function GET() {
//   return NextResponse.json({ status: "ok", message: "Hello World!" });
// }
