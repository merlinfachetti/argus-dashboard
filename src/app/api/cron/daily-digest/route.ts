import { NextResponse } from "next/server";
import { runDailyDigestCycle } from "@/lib/daily-digest";
import { getCronSecret } from "@/lib/infrastructure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const expectedSecret = getCronSecret();

  if (!expectedSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${expectedSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized cron invocation" }, { status: 401 });
  }

  try {
    const result = await runDailyDigestCycle({
      persist: true,
      sendEmail: true,
    });

    return NextResponse.json({
      ok: true,
      emailId: result.emailId,
      subject: result.preview.subject,
      itemCount: result.preview.items.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao rodar cron do digest diario",
      },
      { status: 500 },
    );
  }
}
