import { withRetry } from "@/lib/connectors/retry";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/connectors/rate-limit";
import { discoverBwiListings } from "@/lib/connectors/bwi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "6");
  const enrich = searchParams.get("enrich") === "1";
  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(limitParam, 12))
    : 6;

  const rateCheck = checkRateLimit("bwi");
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterMs: rateCheck.retryAfterMs },
      { status: 429 }
    );
  }

  try {
    const result = await withRetry("bwi", () => discoverBwiListings(limit, enrich));
    const jobs = result.data ?? [];
    if (result.error) {
      console.error(`[Argus] bwi failed: ${result.error}`);
    }

    return NextResponse.json({
      source: "BWI",
      enrich,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected BWI discovery error";

    return NextResponse.json(
      {
        source: "BWI",
        count: 0,
        jobs: [],
        error: message,
      },
      { status: 502 },
    );
  }
}
