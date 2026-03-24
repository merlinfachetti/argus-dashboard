import { NextResponse } from "next/server";
import { discoverSAPJobs } from "@/lib/connectors/sap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "6"), 12);

  try {
    const jobs = await discoverSAPJobs(limit);
    return NextResponse.json({ source: "SAP", count: jobs.length, jobs });
  } catch (error) {
    return NextResponse.json(
      { source: "SAP", count: 0, jobs: [], error: error instanceof Error ? error.message : "SAP discovery failed" },
      { status: 500 },
    );
  }
}
