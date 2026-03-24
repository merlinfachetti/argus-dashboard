import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/connectors/rate-limit";
import { discoverBayerJobs } from "@/lib/connectors/bayer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "6"), 12);

  const rateCheck = checkRateLimit("bayer");
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterMs: rateCheck.retryAfterMs },
      { status: 429 }
    );
  }

  try {
    const jobs = await discoverBayerJobs(limit);
    return NextResponse.json({ source: "Bayer", count: jobs.length, jobs });
  } catch (error) {
    return NextResponse.json(
      { source: "Bayer", count: 0, jobs: [], error: error instanceof Error ? error.message : "Bayer discovery failed" },
      { status: 500 },
    );
  }
}
