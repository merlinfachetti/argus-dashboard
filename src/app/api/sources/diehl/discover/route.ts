import { NextResponse } from "next/server";
import { discoverDiehlJobs } from "@/lib/connectors/diehl";
import { checkRateLimit } from "@/lib/connectors/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateCheck = checkRateLimit("diehl");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", retryAfterMs: rateCheck.retryAfterMs }, { status: 429 });
  }
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "6"), 12);
  try {
    const jobs = await discoverDiehlJobs(limit);
    return NextResponse.json({ source: "Diehl", count: jobs.length, jobs });
  } catch (error) {
    return NextResponse.json(
      { source: "Diehl", count: 0, jobs: [], error: error instanceof Error ? error.message : "Diehl discovery failed" },
      { status: 500 }
    );
  }
}
