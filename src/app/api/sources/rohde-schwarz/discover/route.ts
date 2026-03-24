import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/connectors/rate-limit";
import { withRetry } from "@/lib/connectors/retry";
import { discoverRohdeSchwarzJobs } from "@/lib/connectors/rohde-schwarz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateCheck = checkRateLimit("rohde-schwarz");
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterMs: rateCheck.retryAfterMs },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "8"), 20);

    const result = await withRetry("rohde-schwarz", () => discoverRohdeSchwarzJobs(limit));
    const jobs = result.data ?? [];
    if (result.error) {
      console.error(`[Argus] rohde-schwarz discovery failed after ${result.attempts} attempts: ${result.error}`);
    }
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rohde & Schwarz discovery failed", jobs: [] },
      { status: 500 },
    );
  }
}
