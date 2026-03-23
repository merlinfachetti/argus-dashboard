import { NextResponse } from "next/server";
import { discoverRohdeSchwarzJobs } from "@/lib/connectors/rohde-schwarz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "8"), 20);

    const jobs = await discoverRohdeSchwarzJobs(limit);
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rohde & Schwarz discovery failed", jobs: [] },
      { status: 500 },
    );
  }
}
