import { NextResponse } from "next/server";
import { buildDailyDigestPreview, persistDailyDigest } from "@/lib/daily-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const preview = await buildDailyDigestPreview();
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao montar digest diario",
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const preview = await buildDailyDigestPreview();
    await persistDailyDigest(preview);

    return NextResponse.json({
      ok: true,
      preview,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao persistir digest diario",
      },
      { status: 500 },
    );
  }
}
