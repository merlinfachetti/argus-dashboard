import { NextResponse } from "next/server";
import { withRetry } from "@/lib/connectors/retry";
import { discoverSecunetJobs } from "@/lib/connectors/secunet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "8"), 20);

    const result = await withRetry("secunet", () => discoverSecunetJobs(limit));
    const jobs = result.data ?? [];
    if (result.error) {
      console.error(`[Argus] secunet discovery failed after ${result.attempts} attempts: ${result.error}`);
    }
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "secunet discovery failed", jobs: [] },
      { status: 500 },
    );
  }
}
