import { NextResponse } from "next/server";
import { discoverSiemensListings } from "@/lib/connectors/siemens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "6");
  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(limitParam, 12))
    : 6;

  try {
    const jobs = await discoverSiemensListings(limit);

    return NextResponse.json({
      source: "Siemens",
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected Siemens discovery error";

    return NextResponse.json(
      {
        source: "Siemens",
        count: 0,
        jobs: [],
        error: message,
      },
      { status: 502 },
    );
  }
}
