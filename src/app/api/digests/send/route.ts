import { NextResponse } from "next/server";
import { runDailyDigestCycle } from "@/lib/daily-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runDailyDigestCycle({
      persist: true,
      sendEmail: true,
    });

    return NextResponse.json({
      ok: true,
      preview: result.preview,
      emailId: result.emailId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao enviar digest diario",
      },
      { status: 500 },
    );
  }
}
