import { NextResponse } from "next/server";
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

  try {
    const jobs = await discoverBwiListings(limit, enrich);

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
