import { NextResponse } from "next/server";
import { fetchRadarJobs, persistRadarJob } from "@/lib/radar-store";
import type { TrackedJob } from "@/lib/radar-types";

export async function GET() {
  try {
    const payload = await fetchRadarJobs();

    if (!payload.available) {
      return NextResponse.json(payload, { status: 503 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        available: false,
        reason: error instanceof Error ? error.message : "Falha ao carregar radar",
        jobs: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      job?: TrackedJob;
      rawDescription?: string;
    };

    if (!body.job) {
      return NextResponse.json({ error: "Job payload is required" }, { status: 400 });
    }

    const job = await persistRadarJob(body.job, body.rawDescription);

    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao persistir vaga",
      },
      { status: 500 },
    );
  }
}
