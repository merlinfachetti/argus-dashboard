import { NextResponse } from "next/server";
import { discoverHensoldtJobs } from "@/lib/connectors/hensoldt";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "6"), 12);
  const enrich = searchParams.get("enrich") === "1";

  try {
    const jobs = await discoverHensoldtJobs(limit, enrich);
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
