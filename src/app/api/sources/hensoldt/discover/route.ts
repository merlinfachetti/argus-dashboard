import { withRetry } from "@/lib/connectors/retry";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/connectors/rate-limit";
import { discoverHensoldtJobs } from "@/lib/connectors/hensoldt";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "6"), 12);
  const enrich = searchParams.get("enrich") === "1";

  const rateCheck = checkRateLimit("hensoldt");
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterMs: rateCheck.retryAfterMs },
      { status: 429 }
    );
  }

  try {
    const result = await withRetry("hensoldt", () => discoverHensoldtJobs(limit, enrich));
    const jobs = result.data ?? [];
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Hensoldt discovery failed",
        jobs: [],
      },
      { status: 500 },
    );
  }
}
