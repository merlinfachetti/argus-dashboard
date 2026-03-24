import { withRetry } from "@/lib/connectors/retry";
import { NextResponse } from "next/server";
import { discoverRheinmetallListings } from "@/lib/connectors/rheinmetall";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "6");
  const enrich = searchParams.get("enrich") === "1";
  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(limitParam, 12))
    : 6;

  try {
    const result = await withRetry("rheinmetall", () => discoverRheinmetallListings(limit, enrich));
    const jobs = result.data ?? [];
    if (result.error) {
      console.error(`[Argus] rheinmetall failed: ${result.error}`);
    }

    return NextResponse.json({
      source: "Rheinmetall",
      enrich,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected Rheinmetall discovery error";

    return NextResponse.json(
      {
        source: "Rheinmetall",
        count: 0,
        jobs: [],
        error: message,
      },
      { status: 502 },
    );
  }
}
