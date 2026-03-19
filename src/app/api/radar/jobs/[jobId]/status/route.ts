import { NextResponse } from "next/server";
import { updateRadarJobStatus } from "@/lib/radar-store";
import type { UiJobStatus } from "@/lib/radar-types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await context.params;
    const body = (await request.json()) as {
      status?: UiJobStatus;
    };

    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const job = await updateRadarJobStatus(jobId, body.status);

    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao atualizar status",
      },
      { status: 500 },
    );
  }
}
