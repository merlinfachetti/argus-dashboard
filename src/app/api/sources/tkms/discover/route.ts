import { NextResponse } from "next/server";
import { discoverTKMSJobs } from "@/lib/connectors/tkms";
import { checkRateLimit } from "@/lib/connectors/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateCheck = checkRateLimit("tkms");
  if (!rateCheck.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "6"), 12);
  try {
    const jobs = await discoverTKMSJobs(limit);
    return NextResponse.json({ source: "TKMS", count: jobs.length, jobs });
  } catch (error) {
    return NextResponse.json(
      { source: "TKMS", count: 0, jobs: [], error: error instanceof Error ? error.message : "TKMS failed" },
      { status: 500 }
    );
  }
}
